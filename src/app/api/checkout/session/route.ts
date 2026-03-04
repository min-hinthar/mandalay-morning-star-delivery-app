import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { validatePromoCode } from "@/lib/stripe/promo";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { calculateOrderTotals, createStripeLineItems } from "@/lib/utils/order";
import { isPastCutoff, getDeliveryDate } from "@/lib/utils/delivery-dates";
import { getBusinessRules, generateTimeWindows } from "@/lib/settings";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, checkoutLimiter } from "@/lib/rate-limit";
import { ensureProfile } from "@/lib/auth/role-redirect";
import type { AddressesRow, OrdersRow, OrderItemsRow, ProfilesRow } from "@/types/database";
import { cleanupOrder } from "./helpers";
import { errorResponse, fetchAndValidateCart, buildRpcPayload } from "./validation";

export async function POST(request: Request) {
  try {
    // Parse and validate request body (structural validation only)
    const body = await request.json();
    const parsed = createCheckoutSessionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, parsed.error.issues);
    }

    const input = parsed.data;

    // Load business rules from DB (cached)
    const rules = await getBusinessRules();

    // CHKT-04: Validate time window against dynamically generated windows (with prep buffer)
    const validWindows = generateTimeWindows(
      rules.deliveryStartHour,
      rules.deliveryEndHour,
      rules.prepTimeBufferMinutes
    );
    const isValidWindow = validWindows.some(
      (tw) => tw.start === input.timeWindowStart && tw.end === input.timeWindowEnd
    );
    if (!isValidWindow) {
      return errorResponse("VALIDATION_ERROR", "Invalid delivery time window", 400);
    }

    // BUG-05: Re-validate cutoff timing at submission
    const scheduledSaturday = new Date(input.scheduledDate + "T12:00:00");
    const now = new Date();
    if (isPastCutoff(scheduledSaturday, now, rules.cutoffDay, rules.cutoffHour)) {
      const nextDelivery = getDeliveryDate(now, rules.cutoffDay, rules.cutoffHour);
      return errorResponse(
        "CUTOFF_PASSED",
        `Orders for ${input.scheduledDate} are closed. Next delivery: ${nextDelivery.displayDate}.`,
        400,
        { nextDeliveryDate: nextDelivery.dateString }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "You must be logged in to checkout", 401);
    }

    // Rate limit: prevent double-orders
    const rl = await checkRateLimit({
      limiter: checkoutLimiter,
      identifier: user.id,
      role: "customer",
      route: "checkout/session",
    });
    if (rl.limited) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Your order is being processed. Please don't submit again.",
          },
        },
        { status: 429, headers: { "Retry-After": rl.response.headers.get("Retry-After") ?? "60" } }
      );
    }

    // CHKT-05: Duplicate order prevention — one non-cancelled order per user per Saturday
    const nextDay = new Date(input.scheduledDate + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T")[0];

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .gte("delivery_window_start", `${input.scheduledDate}T00:00:00`)
      .lt("delivery_window_start", `${nextDayStr}T00:00:00`)
      .limit(1)
      .maybeSingle();

    if (existingOrder) {
      return errorResponse(
        "DUPLICATE_ORDER",
        "You already have an order for this Saturday. View your order or contact us to make changes.",
        409,
        { existingOrderId: existingOrder.id }
      );
    }

    // Validate address belongs to user and is verified (BUG-05: coverage re-validation)
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", input.addressId)
      .eq("user_id", user.id)
      .returns<AddressesRow[]>()
      .single();

    if (addressError || !address) {
      return errorResponse("ADDRESS_INVALID", "Address not found or not yours", 400);
    }

    if (!address.is_verified) {
      return errorResponse(
        "OUT_OF_COVERAGE",
        "Address has not been verified for delivery coverage",
        400
      );
    }

    // CHKT-06: Promo code validation via Stripe Promotion Codes API
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

    // Fetch all menu items and modifier options, validate cart
    const cartResult = await fetchAndValidateCart(supabase, input.items);
    if (!cartResult.ok) return cartResult.response;
    const validatedItems = cartResult.items;

    // CHKT-01: Server-authoritative pricing — all prices resolved from DB
    const tipCents = input.tipCents ?? 0;

    // For percent-off coupons, compute discount from subtotal first
    if (promoPercentOff !== null) {
      const subtotal = validatedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      discountCents = Math.round((subtotal * promoPercentOff) / 100);
    }

    // Calculate order totals (SERVER-SIDE - never trust client)
    const totals = calculateOrderTotals(
      validatedItems,
      rules.deliveryFeeCents,
      rules.freeDeliveryThresholdCents,
      tipCents,
      discountCents
    );

    // Ensure profile exists before order creation (orders.user_id FK -> profiles.id)
    try {
      await ensureProfile(createServiceClient(), user.id, user.email);
    } catch (serviceErr) {
      logger.warn("ensureProfile via service client failed in checkout, trying user client", {
        api: "checkout-session",
        flowId: "checkout",
        userId: user.id,
        error: serviceErr instanceof Error ? serviceErr.message : String(serviceErr),
      });

      // Fallback: use the user's own authenticated client (requires profiles_insert_own RLS policy)
      const { error: userInsertErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email ?? null, role: "customer" as const },
          { onConflict: "id", ignoreDuplicates: true }
        );

      if (userInsertErr) {
        logger.error("Profile creation failed via both service and user clients", {
          api: "checkout-session",
          flowId: "checkout",
          userId: user.id,
          serviceError: serviceErr instanceof Error ? serviceErr.message : String(serviceErr),
          userError: userInsertErr.message,
        });
        return errorResponse(
          "PROFILE_ERROR",
          "Unable to set up your account. Please sign out and sign in again.",
          500
        );
      }
    }

    // H-10 FIX: Create order, items, and modifiers atomically via RPC.
    const { rpcItems, rpcModifiers } = buildRpcPayload(validatedItems);

    // CHKT-03: Validate modifier item_index bounds for RPC
    for (const mod of rpcModifiers) {
      if (mod.item_index < 0 || mod.item_index >= rpcItems.length) {
        return errorResponse("VALIDATION_ERROR", "Invalid modifier item index", 400);
      }
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
        delivery_window_start: `${input.scheduledDate}T${input.timeWindowStart}:00`,
        delivery_window_end: `${input.scheduledDate}T${input.timeWindowEnd}:00`,
        special_instructions: input.customerNotes ?? null,
        delivery_instructions: input.deliveryInstructions ?? null,
      },
      p_items: rpcItems,
      p_modifiers: rpcModifiers.length > 0 ? rpcModifiers : [],
    });

    if (rpcError || !rpcResult) {
      logger.exception(rpcError, {
        userId: user.id,
        api: "checkout-session",
        flowId: "checkout",
        itemCount: input.items.length,
        totalCents: totals.totalCents,
      });
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }

    // BUG-04 FIX: Type-safe RPC result extraction (no assertion crash on unexpected shape)
    const rpcData = rpcResult as Record<string, unknown> | null;
    const orderId = typeof rpcData?.order_id === "string" ? rpcData.order_id : null;
    const orderItemIdsParsed = Array.isArray(rpcData?.order_item_ids)
      ? (rpcData.order_item_ids as string[])
      : null;

    if (!orderId || !orderItemIdsParsed) {
      logger.exception(new Error("RPC create_order_with_items returned unexpected shape"), {
        userId: user.id,
        api: "checkout-session",
        flowId: "checkout",
        rpcResult: JSON.stringify(rpcResult),
      });
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }

    const order = { id: orderId } as OrdersRow;
    const orderItems = orderItemIdsParsed.map((id) => ({ id })) as OrderItemsRow[];

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

    // C-04 FIX: Re-validate item availability RIGHT BEFORE Stripe session creation.
    // Between initial validation and here, items could be deactivated or sold out.
    const menuItemIds = input.items.map((item) => item.menuItemId);
    const { data: freshMenuItems, error: freshMenuError } = await supabase
      .from("menu_items")
      .select("id, is_active")
      .in("id", menuItemIds);

    if (freshMenuError) {
      // BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
      await cleanupOrder(
        supabase,
        order.id,
        orderItems.map((oi) => oi.id)
      );
      return errorResponse("INTERNAL_ERROR", "Failed to re-validate menu items", 500);
    }

    const unavailableItems = (freshMenuItems ?? []).filter((item) => !item.is_active);
    if (unavailableItems.length > 0) {
      // BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
      await cleanupOrder(
        supabase,
        order.id,
        orderItems.map((oi) => oi.id)
      );

      const unavailableIds = unavailableItems.map((i) => i.id);
      const unavailableNames = validatedItems
        .filter((vi) => unavailableIds.includes(vi.menuItem.id))
        .map((vi) => vi.menuItem.name_en);

      return errorResponse(
        "ITEM_UNAVAILABLE",
        `Some items are no longer available: ${unavailableNames.join(", ")}. Please update your cart.`,
        400,
        { unavailableItems: unavailableIds }
      );
    }

    // Create Stripe Checkout Session
    const lineItems = createStripeLineItems(validatedItems, totals.deliveryFeeCents, tipCents);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build session params — add discounts if promo validated
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
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      ...(validatedCouponId ? { discounts: [{ coupon: validatedCouponId }] } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout_${order.id}`,
    });

    // CHKT-10: Checkout logging
    logger.info("Checkout session created", {
      orderId: order.id,
      totalCents: totals.totalCents,
      userId: user.id,
      paymentIntentId: session.payment_intent ?? "pending",
      tipCents,
      promoCode: input.promoCode ?? null,
      discountCents,
      itemCount: input.items.length,
    });

    return NextResponse.json({
      data: {
        sessionUrl: session.url,
        orderId: order.id,
      },
    });
  } catch (error) {
    logger.exception(error, {
      api: "checkout-session",
      flowId: "checkout",
    });

    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Payment service error", 500);
    }

    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
