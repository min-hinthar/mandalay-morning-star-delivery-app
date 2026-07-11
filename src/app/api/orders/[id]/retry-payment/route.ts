import { after, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { isPastCutoff } from "@/lib/utils/delivery-dates";
import { getBusinessRules } from "@/lib/settings";
import { checkRateLimit, checkoutLimiter } from "@/lib/rate-limit";
import { inspectOrderPayment, classifyStrandedPayment } from "@/lib/stripe/stranded-payment";
import {
  captureStrandedPayment,
  emailAdminsStrandedPayment,
} from "@/lib/orders/stranded-payment-alert";
import type { ProfilesRow } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderWithItems {
  id: string;
  user_id: string;
  status: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  tip_cents: number;
  discount_cents: number;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  order_items: Array<{
    id: string;
    name_snapshot: string;
    base_price_snapshot: number;
    quantity: number;
    line_total_cents: number;
    order_item_modifiers: Array<{
      name_snapshot: string;
      price_delta_snapshot: number;
    }>;
  }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "You must be logged in" } },
      { status: 401 }
    );
  }

  // Rate limit
  const rl = await checkRateLimit({
    limiter: checkoutLimiter,
    identifier: user.id,
    role: "customer",
    route: "orders/retry-payment",
  });
  if (rl.limited) return rl.response;

  // Fetch order with items and modifiers
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(
      `
      id, user_id, status,
      subtotal_cents, delivery_fee_cents, tax_cents, tip_cents, discount_cents, total_cents,
      delivery_window_start, delivery_window_end,
      stripe_checkout_session_id, stripe_payment_intent_id,
      order_items (
        id, name_snapshot, base_price_snapshot, quantity, line_total_cents,
        order_item_modifiers (name_snapshot, price_delta_snapshot)
      )
    `
    )
    .eq("id", orderId)
    .returns<OrderWithItems[]>()
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  if (order.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "This order does not belong to you" } },
      { status: 403 }
    );
  }

  // Only pending orders can retry payment
  if (order.status !== "pending") {
    return NextResponse.json(
      {
        error: { code: "INVALID_STATUS", message: "This order has already been paid or cancelled" },
      },
      { status: 400 }
    );
  }

  // Guard against a double charge FIRST — before the cutoff gate. The order is
  // still `pending`, but its existing checkout session may already be PAID (a
  // dropped `checkout.session.completed` webhook left it stranded). Creating a
  // new session here would charge the customer a second time. Inspecting BEFORE
  // the cutoff check means a stranded paid order surfaces ALREADY_PAID (and heals
  // via verify-payment) instead of being routed to "cancel and reorder" when it
  // also happens to be past cutoff.
  if (order.stripe_checkout_session_id || order.stripe_payment_intent_id) {
    try {
      const inspection = await inspectOrderPayment(stripe, {
        paymentIntentId: order.stripe_payment_intent_id,
        sessionId: order.stripe_checkout_session_id,
      });
      if (classifyStrandedPayment(order.status, inspection) === "paid_but_pending") {
        const alertCtx = {
          orderId: order.id,
          userId: user.id,
          source: "retry-payment",
          inspection,
        };
        captureStrandedPayment("paid_but_pending", alertCtx);
        // after() — NOT `void`: a bare `void asyncFn()` before return is killed
        // on Vercel once the response is sent, dropping the admin email about
        // money already captured (repo Gotcha).
        after(() => emailAdminsStrandedPayment("paid_but_pending", alertCtx));
        return NextResponse.json(
          {
            error: {
              code: "ALREADY_PAID",
              message:
                "This order has already been paid. Please refresh — no second charge was made.",
            },
          },
          { status: 409 }
        );
      }
    } catch (err) {
      // Fail CLOSED: this guard exists to prevent a double charge, so if we
      // cannot confirm the prior session's payment state, do NOT open a second
      // charge — ask the customer to try again rather than risk charging twice.
      logger.warn("retry-payment: could not inspect existing session for prior payment", {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
        api: "orders/[id]/retry-payment",
      });
      return NextResponse.json(
        {
          error: {
            code: "VERIFY_FAILED",
            message: "Couldn't verify your payment status just now. Please try again in a moment.",
          },
        },
        { status: 503 }
      );
    }
  }

  // Check if delivery cutoff has passed (using DB-sourced business rules). Runs
  // AFTER the already-paid guard so a stranded paid order isn't pushed to cancel
  // when it's also past cutoff.
  const rules = await getBusinessRules();
  if (order.delivery_window_start) {
    const deliveryDate = new Date(order.delivery_window_start);
    if (isPastCutoff(deliveryDate, new Date(), rules.cutoffDay, rules.cutoffHour)) {
      return NextResponse.json(
        {
          error: {
            code: "CUTOFF_PASSED",
            message: "Delivery cutoff has passed. Please cancel and place a new order.",
          },
        },
        { status: 400 }
      );
    }
  }

  // Get or create Stripe customer
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

  // Build line items from stored order data
  const lineItems = order.order_items.map((item) => {
    const modifierNames = item.order_item_modifiers.map((m) => m.name_snapshot).join(", ");
    const modifierTotal = item.order_item_modifiers.reduce(
      (sum, m) => sum + m.price_delta_snapshot,
      0
    );
    const unitAmount = item.base_price_snapshot + modifierTotal;

    return {
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: item.name_snapshot,
          description: modifierNames || undefined,
        },
      },
      quantity: item.quantity,
    };
  });

  // Add delivery fee if applicable
  if (order.delivery_fee_cents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: order.delivery_fee_cents,
        product_data: {
          name: "Delivery Fee",
          description: undefined,
        },
      },
      quantity: 1,
    });
  }

  // Add sales tax + tip lines so the retry session matches the primary checkout (createStripeLineItems).
  // Without these the retry collected only subtotal + delivery, under-charging tax + the entire tip while
  // the order was still marked confirmed against the full total_cents.
  if (order.tax_cents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: order.tax_cents,
        product_data: { name: "Sales Tax", description: "CA sales tax (10.5%)" },
      },
      quantity: 1,
    });
  }
  if (order.tip_cents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: order.tip_cents,
        product_data: { name: "Tip", description: "Thank you for your generosity" },
      },
      quantity: 1,
    });
  }

  // Re-apply the stored discount as a one-off amount_off coupon (mirrors the primary checkout's
  // sessionDiscounts). Line items are pre-discount, so without this the retry OVER-charges a discounted
  // order by discount_cents. amount_off subtracts exactly discount_cents from the session total, so the
  // charge equals the recorded total_cents (subtotal − discount + delivery + tax + tip).
  let sessionDiscounts: Array<{ coupon: string }> | undefined;
  if (order.discount_cents > 0) {
    try {
      // Idempotency-key the coupon too: the session below uses a fixed `retry_<id>` key, so a fresh
      // coupon per retry would change the request body and make Stripe reject the repeat retry
      // (idempotency_error → 500 → the discounted order becomes un-retryable for 24h). A stable coupon key
      // means repeat retries reuse the same coupon and return the cached session.
      const coupon = await stripe.coupons.create(
        {
          amount_off: order.discount_cents,
          currency: "usd",
          duration: "once",
          name: `Order #${orderId} discount`,
        },
        { idempotencyKey: `retry_coupon_${order.id}` }
      );
      sessionDiscounts = [{ coupon: coupon.id }];
    } catch (error) {
      // A discounted order must not silently over-charge — fail the retry so the customer can re-try
      // rather than pay more than the recorded total.
      Sentry.captureException(error, {
        tags: { api: "retry-payment", step: "coupon" },
        extra: { orderId: order.id, discountCents: order.discount_cents },
      });
      return NextResponse.json(
        { error: { code: "STRIPE_ERROR", message: "Failed to create payment session" } },
        { status: 500 }
      );
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Extract scheduled date from delivery window
  const scheduledDate = order.delivery_window_start
    ? order.delivery_window_start.split("T")[0]
    : "";
  const timeWindowStart = order.delivery_window_start
    ? order.delivery_window_start.split("T")[1]?.slice(0, 5) || ""
    : "";
  const timeWindowEnd = order.delivery_window_end
    ? order.delivery_window_end.split("T")[1]?.slice(0, 5) || ""
    : "";

  try {
    const session = await stripe.checkout.sessions.create(
      {
        customer: stripeCustomerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        ...(sessionDiscounts ? { discounts: sessionDiscounts } : {}),
        metadata: {
          order_id: order.id,
          user_id: user.id,
          scheduled_date: scheduledDate,
          time_window_start: timeWindowStart,
          time_window_end: timeWindowEnd,
        },
        success_url: `${baseUrl}/orders/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/orders/${order.id}?payment_cancelled=true`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      },
      {
        // Versioned key (`_v2`): this handler's line items changed (added tax/tip + discount coupon), so a
        // stale session cached under the old `retry_${id}` key from before this deploy would otherwise
        // collide with the new request body (idempotency_error → 500) until it aged out. The version bump
        // isolates the new body; repeat retries within 24h still reuse the same (v2) session + coupon.
        idempotencyKey: `retry_v2_${order.id}`,
      }
    );

    // Point the order at the session the customer will actually pay, and expire
    // the stale prior session. Without this, the prior session's 30-min
    // `checkout.session.expired` event later cancels this order AFTER it's paid
    // on the retry (the confirm handler then skips it: status ≠ pending) →
    // charged + cancelled. Expiring it kills that event; persisting the new id
    // makes verify-payment + reconciliation inspect the right session.
    // Skip when the retry is idempotent-cached to the same id (repeat clicks).
    const priorSessionId = order.stripe_checkout_session_id;
    if (priorSessionId !== session.id) {
      // Order MUST point at the retry session BEFORE we expire the old one.
      // `expire()` emits `checkout.session.expired` for the old session; the
      // expired handler now only cancels when the expiring session is the
      // order's CURRENT session, so persisting first means that event finds the
      // new id and skips the cancel. Chain `.select("id")` to verify the write
      // actually landed (`.update()` alone returns no row count).
      // Service client: stripe_checkout_session_id is a service-role-written
      // payment column (matches checkout/session/route.ts).
      const { data: persistedRows, error: persistError } = await createServiceClient()
        .from("orders")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", order.id)
        .eq("status", "pending") // Don't repoint a concurrently-confirmed order
        .select("id");
      if (persistError) {
        // Transient DB fault repointing the order at the retry session. Don't
        // hand out a session id we couldn't record, and don't expire the new
        // session (its idempotency-cached copy must stay valid for the retry).
        // Fail closed: the order is (likely) still pending — ask them to retry.
        logger.exception(persistError, {
          api: "orders/[id]/retry-payment",
          orderId: order.id,
          message: "Retry session id persist failed — asking customer to retry",
        });
        return NextResponse.json(
          {
            error: {
              code: "VERIFY_FAILED",
              message: "Couldn't start your payment just now. Please try again in a moment.",
            },
          },
          { status: 503 }
        );
      }
      if (!persistedRows || persistedRows.length === 0) {
        // 0 rows = the order left `pending` (confirmed on the PRIOR session mid-
        // request, or cancelled) between our entry check and now. Handing the
        // customer this freshly-created session would let them pay a SECOND time
        // for an order that already completed. Expire the new session and refuse;
        // leave the prior session alone (if it just paid, that's the one charge).
        logger.warn("retry-payment: order no longer pending — expiring new session, refusing", {
          api: "orders/[id]/retry-payment",
          orderId: order.id,
          newSessionId: session.id,
        });
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch (expireNewErr) {
          logger.warn("retry-payment: could not expire the just-created retry session", {
            orderId: order.id,
            newSessionId: session.id,
            error: expireNewErr instanceof Error ? expireNewErr.message : String(expireNewErr),
            api: "orders/[id]/retry-payment",
          });
        }
        return NextResponse.json(
          {
            // Status-neutral: the 0-row race means the order is confirmed (paid)
            // OR cancelled — either way it's no longer awaiting payment, and no
            // charge was made in THIS request.
            error: {
              code: "ORDER_NOT_PENDING",
              message: "This order is no longer awaiting payment. Please refresh.",
            },
          },
          { status: 409 }
        );
      }
      // Persist landed (order still pending, now points at the retry session) →
      // expire the stale prior session so its 30-min expiry event can't cancel
      // the order after it's paid on the retry.
      if (priorSessionId) {
        try {
          await stripe.checkout.sessions.expire(priorSessionId);
        } catch (expireErr) {
          // Already expired/completed → nothing to do. Best-effort; the expired
          // handler's session-id guard makes a lingering old session harmless.
          logger.warn("retry-payment: could not expire prior checkout session", {
            orderId: order.id,
            priorSessionId,
            error: expireErr instanceof Error ? expireErr.message : String(expireErr),
            api: "orders/[id]/retry-payment",
          });
        }
      }
    }

    return NextResponse.json({
      data: {
        sessionUrl: session.url,
        orderId: order.id,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "retry-payment" },
      extra: { orderId: order.id, userId: user.id },
    });
    logger.exception(error, {
      api: "orders/[id]/retry-payment",
      orderId: order.id,
      userId: user.id,
    });
    return NextResponse.json(
      { error: { code: "STRIPE_ERROR", message: "Failed to create payment session" } },
      { status: 500 }
    );
  }
}
