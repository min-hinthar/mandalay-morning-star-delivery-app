import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { validateCartItems, calculateOrderTotals, createStripeLineItems } from "@/lib/utils/order";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, apiWriteLimiter } from "@/lib/rate-limit";
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

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = createCheckoutSessionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, parsed.error.issues);
    }

    const input = parsed.data;

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
      limiter: apiWriteLimiter,
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

    // Validate address belongs to user and is verified
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

    // Calculate order totals (SERVER-SIDE - never trust client)
    const totals = calculateOrderTotals(validation.items);

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
      });
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }

    const order = { id: (rpcResult as { order_id: string }).order_id } as OrdersRow;
    const orderItemIds = (rpcResult as { order_item_ids: string[] }).order_item_ids;
    const orderItems = orderItemIds.map((id) => ({ id })) as OrderItemsRow[];

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
      await supabase
        .from("order_item_modifiers")
        .delete()
        .eq("order_item_id", orderItems.map((oi) => oi.id)[0] ? "" : "");
      await supabase.from("order_items").delete().eq("order_id", order.id);
      await supabase.from("orders").delete().eq("id", order.id);
      return errorResponse("INTERNAL_ERROR", "Failed to re-validate menu items", 500);
    }

    const unavailableItems = (freshMenuItems ?? []).filter((item) => !item.is_active);
    if (unavailableItems.length > 0) {
      // Clean up the order we already created — items are no longer available
      await supabase
        .from("order_item_modifiers")
        .delete()
        .in(
          "order_item_id",
          orderItems.map((oi) => oi.id)
        );
      await supabase.from("order_items").delete().eq("order_id", order.id);
      await supabase.from("orders").delete().eq("id", order.id);

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
    logger.exception(error, { api: "checkout-session", flowId: "checkout" });

    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Payment service error", 500);
    }

    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
