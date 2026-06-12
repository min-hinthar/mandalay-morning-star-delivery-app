import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { resolveCheckoutDiscount, resolveStripeSessionDiscounts } from "./discount";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { calculateOrderTotals, createStripeLineItems } from "@/lib/utils/order";
import {
  isPastCutoff,
  getDeliveryDate,
  isPastCutoffForDay,
  getZonedDayOfWeek,
} from "@/lib/utils/delivery-dates";
import { getBusinessRules, generateTimeWindows } from "@/lib/settings";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, checkoutLimiter } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/utils/origin-check";
import { ensureProfile } from "@/lib/auth/role-redirect";
import { createCODOrder } from "@/lib/services/cod-order";
import type { AddressesRow, OrdersRow, OrderItemsRow, ProfilesRow } from "@/types/database";
import { TIMEZONE } from "@/types/delivery";
import { toISOWithTimezone } from "@/lib/utils/delivery-timezone";
import { cleanupOrder, sendCODOrderEmail, resolveAddressDistance } from "./helpers";
import {
  errorResponse,
  fetchAndValidateCart,
  buildRpcPayload,
  revalidateItemAvailability,
} from "./validation";

const MAX_DELIVERY_DAYS_FUTURE = 30;

export async function POST(request: Request) {
  try {
    const originError = checkOrigin(request);
    if (originError) return originError;

    const body = await request.json();
    const parsed = createCheckoutSessionSchema.safeParse(body);

    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, parsed.error.issues);
    const input = parsed.data;
    const rules = await getBusinessRules();

    const validWindows = generateTimeWindows(
      rules.deliveryStartHour,
      rules.deliveryEndHour,
      rules.prepTimeBufferMinutes
    );
    const isValidWindow = validWindows.some(
      (tw) => tw.start === input.timeWindowStart && tw.end === input.timeWindowEnd
    );
    if (!isValidWindow)
      return errorResponse("VALIDATION_ERROR", "Invalid delivery time window", 400);
    const scheduledDate = new Date(toISOWithTimezone(input.scheduledDate, "12:00"));
    const now = new Date();

    // TZ-05: Reject dates more than 30 days in the future (LA timezone comparison)
    const todayLA = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const diffDays = Math.ceil(
      (new Date(input.scheduledDate).getTime() - new Date(todayLA).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (diffDays > MAX_DELIVERY_DAYS_FUTURE) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Delivery date cannot be more than 30 days in the future",
        400
      );
    }

    const scheduledDayOfWeek = getZonedDayOfWeek(scheduledDate);
    const dayConfig = rules.deliveryDays.find(
      (d) => d.isActive && d.dayOfWeek === scheduledDayOfWeek
    );

    if (dayConfig) {
      if (isPastCutoffForDay(scheduledDate, dayConfig, now)) {
        return errorResponse("CUTOFF_PASSED", `Orders for ${input.scheduledDate} are closed.`, 400);
      }
    } else if (rules.deliveryDays.length > 0) {
      return errorResponse(
        "VALIDATION_ERROR",
        `${input.scheduledDate} is not an active delivery day.`,
        400
      );
    } else {
      if (isPastCutoff(scheduledDate, now, rules.cutoffDay, rules.cutoffHour)) {
        const nextDelivery = getDeliveryDate(now, rules.cutoffDay, rules.cutoffHour);
        return errorResponse(
          "CUTOFF_PASSED",
          `Orders for ${input.scheduledDate} are closed. Next delivery: ${nextDelivery.displayDate}.`,
          400,
          { nextDeliveryDate: nextDelivery.dateString }
        );
      }
    }

    if (input.paymentMethod === "cod" && !rules.codEnabled) {
      return errorResponse("COD_DISABLED", "Cash on Delivery is not currently available", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return errorResponse("UNAUTHORIZED", "You must be logged in to checkout", 401);

    const rl = await checkRateLimit({
      limiter: checkoutLimiter,
      identifier: user.id,
      role: "customer",
      route: "checkout/session",
    });
    if (rl.limited) return rl.response;

    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", input.addressId)
      .eq("user_id", user.id)
      .returns<AddressesRow[]>()
      .single();

    if (addressError || !address)
      return errorResponse("ADDRESS_INVALID", "Address not found or not yours", 400);
    if (!address.is_verified)
      return errorResponse("OUT_OF_COVERAGE", "Address not verified for delivery", 400);

    const distanceResult = await resolveAddressDistance(
      address,
      dayConfig,
      rules.deliveryZones,
      input.scheduledDate,
      rules.deliveryDays
    );
    const addressDistanceMiles = distanceResult.distanceMiles;
    if (distanceResult.directionError) {
      return errorResponse(
        "VALIDATION_ERROR",
        distanceResult.directionError,
        400,
        distanceResult.directionDetails
      );
    }

    const cartResult = await fetchAndValidateCart(supabase, input.items);
    if (!cartResult.ok) return cartResult.response;
    const validatedItems = cartResult.items;
    const tipCents = input.tipCents ?? 0;
    const subtotalCents = validatedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

    // Resolve the discount: a customer-entered code (applied as a promotion
    // code so Stripe enforces max_redemptions / minimum_amount / expires_at) or
    // the server-gated first-order auto-discount (bare coupon, no code). Stripe
    // allows one discount per session, so these never stack.
    const discountResult = await resolveCheckoutDiscount(
      supabase,
      user.id,
      subtotalCents,
      input.promoCode,
      createServiceClient()
    );
    if (!discountResult.ok) {
      return errorResponse("VALIDATION_ERROR", discountResult.message, 400);
    }
    const { discountCents } = discountResult.discount;

    const baseDeliveryFeeCents = dayConfig?.deliveryFeeCents ?? rules.deliveryFeeCents;
    const isExtendedRange =
      addressDistanceMiles != null && addressDistanceMiles > rules.longDistanceThresholdMiles;

    const totals = calculateOrderTotals(validatedItems, {
      deliveryFeeCents: baseDeliveryFeeCents,
      freeDeliveryThresholdCents: rules.freeDeliveryThresholdCents,
      tipCents,
      discountCents,
      distanceMiles: addressDistanceMiles,
      longDistanceFeeCents: rules.longDistanceFeeCents,
      longDistanceThresholdMiles: rules.longDistanceThresholdMiles,
    });

    try {
      await ensureProfile(createServiceClient(), user.id, user.email);
    } catch {
      const { error: userInsertErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email ?? null, role: "customer" as const },
          { onConflict: "id", ignoreDuplicates: true }
        );
      if (userInsertErr) {
        logger.error("Profile creation failed", {
          api: "checkout-session",
          userId: user.id,
          error: userInsertErr.message,
        });
        return errorResponse(
          "PROFILE_ERROR",
          "Unable to set up your account. Please sign out and sign in again.",
          500
        );
      }
    }

    const { rpcItems, rpcModifiers } = buildRpcPayload(validatedItems);
    for (const mod of rpcModifiers) {
      if (mod.item_index < 0 || mod.item_index >= rpcItems.length)
        return errorResponse("VALIDATION_ERROR", "Invalid modifier item index", 400);
    }
    // Order creation runs on the service client: the create_order_with_items
    // RPC is locked to service_role (totals above are server-computed; the
    // user-scoped grant is revoked so clients can't call it with forged prices).
    const orderClient = createServiceClient();
    if (input.paymentMethod === "cod") {
      const codResult = await createCODOrder(orderClient, {
        userId: user.id,
        addressId: input.addressId,
        scheduledDate: input.scheduledDate,
        timeWindowStart: input.timeWindowStart,
        timeWindowEnd: input.timeWindowEnd,
        subtotalCents: totals.subtotalCents,
        deliveryFeeCents: totals.deliveryFeeCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        tipCents,
        promoCode: input.promoCode ?? null,
        discountCents,
        customerNotes: input.customerNotes ?? null,
        deliveryInstructions: input.deliveryInstructions ?? null,
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        rpcItems,
        rpcModifiers,
        distanceMiles: addressDistanceMiles,
      });

      if (!codResult.success)
        return errorResponse(codResult.code as "INTERNAL_ERROR", codResult.message, 500);
      logger.info("COD checkout completed", {
        orderId: codResult.orderId,
        totalCents: totals.totalCents,
        userId: user.id,
      });

      after(() =>
        sendCODOrderEmail({
          orderId: codResult.orderId,
          userId: user.id,
          userEmail: user.email ?? "",
          customerName: user.user_metadata?.full_name || "Valued Customer",
          validatedItems,
          subtotalCents: totals.subtotalCents,
          deliveryFeeCents: totals.deliveryFeeCents,
          taxCents: totals.taxCents,
          tipCents,
          totalCents: totals.totalCents,
          scheduledDate: input.scheduledDate,
          timeWindowStart: input.timeWindowStart,
          timeWindowEnd: input.timeWindowEnd,
          address: {
            line1: address.line_1,
            line2: address.line_2 ?? undefined,
            city: address.city,
            state: address.state,
            postalCode: address.postal_code,
          },
          customerNotes: input.customerNotes ?? undefined,
          deliveryInstructions: input.deliveryInstructions ?? undefined,
          isExtendedRange,
        })
      );

      return NextResponse.json({
        data: {
          sessionUrl: null,
          orderId: codResult.orderId,
        },
      });
    }

    const { data: rpcResult, error: rpcError } = await orderClient.rpc("create_order_with_items", {
      p_order: {
        user_id: user.id,
        address_id: input.addressId,
        subtotal_cents: totals.subtotalCents,
        delivery_fee_cents: totals.deliveryFeeCents,
        tax_cents: totals.taxCents,
        tip_cents: tipCents,
        promo_code: input.promoCode ?? null,
        discount_cents: discountCents,
        total_cents: totals.totalCents,
        delivery_window_start: toISOWithTimezone(input.scheduledDate, input.timeWindowStart),
        delivery_window_end: toISOWithTimezone(input.scheduledDate, input.timeWindowEnd),
        special_instructions: input.customerNotes ?? null,
        delivery_instructions: input.deliveryInstructions ?? null,
        customer_phone: input.customerPhone,
        customer_name: input.customerName,
        distance_miles: addressDistanceMiles,
      },
      p_items: rpcItems,
      p_modifiers: rpcModifiers.length > 0 ? rpcModifiers : [],
    });

    if (rpcError || !rpcResult) {
      logger.exception(rpcError, { userId: user.id, api: "checkout-session", flowId: "checkout" });
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }
    const rpcData = rpcResult as Record<string, unknown> | null;
    const orderId = typeof rpcData?.order_id === "string" ? rpcData.order_id : null;
    const orderItemIdsParsed = Array.isArray(rpcData?.order_item_ids)
      ? (rpcData.order_item_ids as string[])
      : null;
    if (!orderId || !orderItemIdsParsed) {
      logger.exception(new Error("RPC returned unexpected shape"), {
        userId: user.id,
        api: "checkout-session",
        rpcResult: JSON.stringify(rpcResult),
      });
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }
    const order = { id: orderId } as OrdersRow;
    const orderItems = orderItemIdsParsed.map((id) => ({ id })) as OrderItemsRow[];

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
      await cleanupOrder(
        supabase,
        order.id,
        orderItems.map((oi) => oi.id)
      );
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

    const sessionDiscounts = await resolveStripeSessionDiscounts(
      stripe,
      discountResult.discount,
      input.promoCode
    );

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

    const serviceClient = createServiceClient();
    await serviceClient
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

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
    logger.exception(error, { api: "checkout-session", flowId: "checkout" });
    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Payment service error", 500);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
