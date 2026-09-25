import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { createStripeLineItems } from "@/lib/utils/order";
import { logger } from "@/lib/utils/logger";
import type { ProfilesRow } from "@/types/database";
import type { ValidatedCartItem } from "@/lib/utils/order";
import type { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import type { z } from "zod";

import { resolveStripeSessionDiscounts, type CheckoutDiscount } from "./discount";
import { errorResponse, revalidateItemAvailability } from "./validation";

interface StripeCheckoutArgs {
  orderId: string;
  orderItemIds: string[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  input: z.infer<typeof createCheckoutSessionSchema>;
  validatedItems: ValidatedCartItem[];
  totals: { deliveryFeeCents: number; taxCents: number; totalCents: number };
  tipCents: number;
  isExtendedRange: boolean;
  discount: CheckoutDiscount;
}

/**
 * Delete a just-created order that never reached a payment surface
 * (order_items/modifiers cascade). Service client: `orders` has no customer
 * DELETE policy, so the user-scoped client silently deleted 0 rows and left a
 * `pending`, session-less order behind — which reclaimPendingCheckouts can
 * never clear (it requires a session id), permanently locking the customer
 * out of the first-order discount and any coupon that order held.
 */
async function discardOrder(orderId: string): Promise<void> {
  const { error } = await createServiceClient().from("orders").delete().eq("id", orderId);
  if (error) logger.exception(error, { api: "checkout-session", cleanup: "orders", orderId });
}

/**
 * Everything after the order row exists on the Stripe path: customer, final
 * availability re-check, line items, discount mapping, session creation.
 * Any throw here (Stripe outage, rejected discount) discards the order before
 * rethrowing, so a failed checkout never strands a pending row.
 */
export async function createStripeCheckoutForOrder({
  orderId,
  supabase,
  user,
  input,
  validatedItems,
  totals,
  tipCents,
  isExtendedRange,
  discount,
}: StripeCheckoutArgs): Promise<NextResponse> {
  let sessionCreated = false;
  try {
    const order = { id: orderId };

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .returns<Pick<ProfilesRow, "full_name">[]>()
      .single();

    const stripeCustomerId = await getOrCreateStripeCustomer(
      user.id,
      user.email!,
      profile?.full_name
    );

    const menuItemIds = input.items.map((item) => item.menuItemId);
    const revalidation = await revalidateItemAvailability(supabase, menuItemIds, validatedItems);
    if (!revalidation.ok) {
      await discardOrder(order.id);
      if ("unavailableNames" in revalidation) {
        return errorResponse(
          "ITEM_UNAVAILABLE",
          `Some items are no longer available: ${revalidation.unavailableNames!.join(", ")}. Please update your cart.`,
          400,
          { unavailableItems: revalidation.unavailableIds }
        );
      }
      return errorResponse("INTERNAL_ERROR", revalidation.error!, 500);
    }

    const lineItems = createStripeLineItems(
      validatedItems,
      totals.deliveryFeeCents,
      tipCents,
      totals.taxCents,
      isExtendedRange
    );
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionDiscounts = await resolveStripeSessionDiscounts(stripe, discount, input.promoCode);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: "payment",
      // Omit payment_method_types so Checkout uses the dynamic methods enabled
      // in the Stripe Dashboard. On hosted Checkout this surfaces one-tap
      // wallets (Apple Pay, Google Pay) and Link automatically on supported
      // devices — maximizing checkout completion — while still only showing
      // methods activated for the account.
      line_items: lineItems,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        scheduled_date: input.scheduledDate,
        time_window_start: input.timeWindowStart,
        time_window_end: input.timeWindowEnd,
        tip_cents: String(tipCents),
        promo_code: input.promoCode ?? "",
      },
      success_url: `${baseUrl}/orders/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // amount_off codes apply as a promotion_code (Stripe enforces
      // max_redemptions / minimum_amount / expires_at); percent codes are
      // converted to a one-off amount_off coupon so the discount never
      // touches the tax/tip line items; the server-gated first-order
      // discount applies as a bare coupon.
      ...(sessionDiscounts ? { discounts: sessionDiscounts } : {}),
    };

    // Phase 110 CFIX-04 — TODO(Phase 111+): the idempotency key is keyed
    // on `order.id`, which means a client retry after CHECKOUT_NETWORK_TIMEOUT
    // will hit Stripe with the SAME key and return the cached session.
    // This is the intended behavior today (customer retries safely, no
    // duplicate charges). Risk: if the client-side retry path ever
    // regenerates `order.id` before calling this endpoint, idempotency
    // is broken and a second Stripe session may be created. Guardrails:
    //   1. PaymentStepV8 retries the same `order.id` via handleCheckout
    //      (no order re-creation).
    //   2. Server-side order creation is memoized upstream of this call.
    // If Phase 111 introduces client-side order regeneration, swap this
    // to a request-level idempotency key (e.g., crypto.randomUUID() per
    // clicked "Place Order") and de-dupe on the server.
    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout_${order.id}`,
    });
    sessionCreated = true;

    const serviceClient = createServiceClient();
    const { error: sessionPersistError } = await serviceClient
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);
    // Make a failed session-id persist VISIBLE: the abandoned-checkout expiry
    // handler now only auto-cancels when this id matches the order's current
    // session, so a silently-lost write means expiry can't auto-cancel the order.
    // The order is unpaid, so it just lingers as a stale `pending` row — the
    // reconciliation cron is detect-only for PAID strandings and won't sweep it;
    // no money is at stake. Log loudly; don't fail checkout — a created Stripe
    // session with an unrecorded id is worse than a delayed auto-cancel.
    if (sessionPersistError) {
      logger.exception(sessionPersistError, { api: "checkout-session", orderId: order.id });
    }

    logger.info("Checkout session created", {
      orderId: order.id,
      totalCents: totals.totalCents,
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        sessionUrl: session.url,
        orderId: order.id,
      },
    });
  } catch (error) {
    // Once a session exists it may still be paid — never discard then; the
    // expiry webhook cancels it if abandoned.
    if (!sessionCreated) await discardOrder(orderId);
    throw error;
  }
}
