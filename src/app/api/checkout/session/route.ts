import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { validatePromoCode } from "@/lib/stripe/promo";
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
import { toISOWithTimezone } from "@/lib/utils/delivery-timezone";
import { cleanupOrder, sendCODOrderEmail, resolveAddressDistance } from "./helpers";
import {
  errorResponse,
  fetchAndValidateCart,
  buildRpcPayload,
  revalidateItemAvailability,
} from "./validation";

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
    const scheduledDate = new Date(input.scheduledDate + "T12:00:00");
    const now = new Date();

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

    let discountCents = 0;
    let validatedCouponId: string | null = null;
    let promoPercentOff: number | null = null;

    if (input.promoCode) {
      const promoResult = await validatePromoCode(input.promoCode);
      if (!promoResult.valid) {
        return errorResponse("VALIDATION_ERROR", promoResult.message, 400);
      }
      discountCents = promoResult.discountCents;
      validatedCouponId = promoResult.couponId;
      promoPercentOff = promoResult.percentOff;
    }

    const cartResult = await fetchAndValidateCart(supabase, input.items);
    if (!cartResult.ok) return cartResult.response;
    const validatedItems = cartResult.items;
    const tipCents = input.tipCents ?? 0;
    if (promoPercentOff !== null) {
      const subtotal = validatedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      discountCents = Math.round((subtotal * promoPercentOff) / 100);
    }

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
    if (input.paymentMethod === "cod") {
      const codResult = await createCODOrder(supabase, {
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

    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order_with_items", {
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

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
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
      ...(validatedCouponId ? { discounts: [{ coupon: validatedCouponId }] } : {}),
    };

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
