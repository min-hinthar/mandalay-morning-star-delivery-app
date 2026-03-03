import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { validateCartItems, calculateOrderTotals, createStripeLineItems } from "@/lib/utils/order";
import { isPastCutoff, getDeliveryDate } from "@/lib/utils/delivery-dates";
import { getBusinessRules, generateTimeWindows } from "@/lib/settings";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, checkoutLimiter } from "@/lib/rate-limit";
import type { CheckoutError, CheckoutErrorCode } from "@/types/checkout";
import type {
  AddressesRow,
  MenuItemsRow,
  ModifierOptionsRow,
  OrdersRow,
  OrderItemsRow,
  ProfilesRow,
} from "@/types/database";

function errorResponse(
  code: CheckoutErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  const error: CheckoutError = { code, message, details };
  return NextResponse.json({ error }, { status });
}

// BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
// so partial cleanup failures are logged but don't crash the cleanup chain
async function cleanupOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  orderItemIds: string[]
) {
  try {
    await supabase.from("order_item_modifiers").delete().in("order_item_id", orderItemIds);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "order_item_modifiers", orderId });
  }
  try {
    await supabase.from("order_items").delete().eq("order_id", orderId);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "order_items", orderId });
  }
  try {
    await supabase.from("orders").delete().eq("id", orderId);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "orders", orderId });
  }
}

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

    // Validate time window against dynamically generated windows
    const validWindows = generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour);
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

    // Fetch all menu items and modifier options for validation
    const menuItemIds = input.items.map((item) => item.menuItemId);
    const modifierOptionIds = input.items.flatMap((item) => item.modifiers.map((m) => m.optionId));

    const { data: menuItemsData, error: menuError } = await supabase
      .from("menu_items")
      .select("*")
      .in("id", menuItemIds)
      .returns<MenuItemsRow[]>();

    if (menuError) {
      return errorResponse("INTERNAL_ERROR", "Failed to fetch menu items", 500);
    }

    const { data: modifierOptionsData, error: modifierError } = await supabase
      .from("modifier_options")
      .select("*")
      .in(
        "id",
        modifierOptionIds.length > 0 ? modifierOptionIds : ["00000000-0000-0000-0000-000000000000"]
      )
      .returns<ModifierOptionsRow[]>();

    if (modifierError) {
      return errorResponse("INTERNAL_ERROR", "Failed to fetch modifier options", 500);
    }

    // Create lookup maps
    const menuItems = new Map<string, MenuItemsRow>(
      (menuItemsData ?? []).map((item) => [item.id, item])
    );
    const modifierOptions = new Map<string, ModifierOptionsRow>(
      (modifierOptionsData ?? []).map((option) => [option.id, option])
    );

    // Validate cart items against database
    const validation = await validateCartItems(input.items, menuItems, modifierOptions);

    if (!validation.valid) {
      const firstError = validation.errors[0];
      return errorResponse(
        firstError.code as CheckoutErrorCode,
        firstError.message,
        400,
        validation.errors
      );
    }

    // BUG-08: Detect price drift — compare client-reported prices against DB
    const priceDrifts: Array<{
      itemIndex: number;
      menuItemId: string;
      itemName: string;
      field: "base_price" | "modifier_price";
      cartPriceCents: number;
      currentPriceCents: number;
      modifierName?: string;
    }> = [];

    for (let i = 0; i < input.items.length; i++) {
      const cartItem = input.items[i];
      const dbItem = menuItems.get(cartItem.menuItemId);
      if (!dbItem) continue;

      // Check base price drift
      if (cartItem.basePriceCents !== dbItem.base_price_cents) {
        priceDrifts.push({
          itemIndex: i,
          menuItemId: cartItem.menuItemId,
          itemName: dbItem.name_en,
          field: "base_price",
          cartPriceCents: cartItem.basePriceCents,
          currentPriceCents: dbItem.base_price_cents,
        });
      }

      // Check modifier price drift
      for (const mod of cartItem.modifiers) {
        const dbMod = modifierOptions.get(mod.optionId);
        if (dbMod && mod.priceDeltaCents !== dbMod.price_delta_cents) {
          priceDrifts.push({
            itemIndex: i,
            menuItemId: cartItem.menuItemId,
            itemName: dbItem.name_en,
            field: "modifier_price",
            cartPriceCents: mod.priceDeltaCents,
            currentPriceCents: dbMod.price_delta_cents,
            modifierName: dbMod.name,
          });
        }
      }
    }

    if (priceDrifts.length > 0) {
      return errorResponse(
        "PRICE_CHANGED",
        "Some prices have changed since you added items to your cart. Please review the updated prices.",
        409,
        { priceDrifts }
      );
    }

    // Calculate order totals (SERVER-SIDE - never trust client)
    const totals = calculateOrderTotals(
      validation.items,
      rules.deliveryFeeCents,
      rules.freeDeliveryThresholdCents
    );

    // H-10 FIX: Create order, items, and modifiers atomically via RPC.
    // If any insert fails, the entire transaction rolls back — no orphaned records.
    const rpcItems = validation.items.map((item) => ({
      menu_item_id: item.menuItem.id,
      name_snapshot: item.menuItem.name_en,
      base_price_snapshot: item.menuItem.base_price_cents,
      quantity: item.quantity,
      line_total_cents: item.lineTotalCents,
      special_instructions: item.notes || null,
    }));

    const rpcModifiers: Array<{
      item_index: number;
      modifier_option_id: string;
      name_snapshot: string;
      price_delta_snapshot: number;
    }> = [];

    for (let i = 0; i < validation.items.length; i++) {
      for (const modifier of validation.items[i].modifiers) {
        rpcModifiers.push({
          item_index: i,
          modifier_option_id: modifier.id,
          name_snapshot: modifier.name,
          price_delta_snapshot: modifier.price_delta_cents,
        });
      }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order_with_items", {
      p_order: {
        user_id: user.id,
        address_id: input.addressId,
        subtotal_cents: totals.subtotalCents,
        delivery_fee_cents: totals.deliveryFeeCents,
        tax_cents: totals.taxCents,
        total_cents: totals.totalCents,
        delivery_window_start: `${input.scheduledDate}T${input.timeWindowStart}:00`,
        delivery_window_end: `${input.scheduledDate}T${input.timeWindowEnd}:00`,
        special_instructions: input.customerNotes ?? null,
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
    const { data: freshMenuItems, error: freshMenuError } = await supabase
      .from("menu_items")
      .select("id, is_active")
      .in("id", menuItemIds);

    if (freshMenuError) {
      // BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
      await cleanupOrder(supabase, order.id, orderItems.map((oi) => oi.id));
      return errorResponse("INTERNAL_ERROR", "Failed to re-validate menu items", 500);
    }

    const unavailableItems = (freshMenuItems ?? []).filter((item) => !item.is_active);
    if (unavailableItems.length > 0) {
      // BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
      await cleanupOrder(supabase, order.id, orderItems.map((oi) => oi.id));

      const unavailableIds = unavailableItems.map((i) => i.id);
      const unavailableNames = validation.items
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
    const lineItems = createStripeLineItems(validation.items, totals.deliveryFeeCents);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create(
      {
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
        },
        success_url: `${baseUrl}/orders/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?cancelled=true`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      },
      {
        idempotencyKey: `checkout_${order.id}`,
      }
    );

    // Note: stripe_payment_intent_id is set by webhook on checkout.session.completed
    // session.payment_intent is null until payment completes

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
