import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import {
  validateCartItems,
  calculateOrderTotals,
  createStripeLineItems,
} from "@/lib/utils/order";
import type { CheckoutError, CheckoutErrorCode } from "@/types/checkout";
import type {
  AddressesRow,
  MenuItemsRow,
  ModifierOptionsRow,
  OrdersRow,
  OrderItemsRow,
  ProfilesRow,
} from "@/types/database";

function errorResponse(code: CheckoutErrorCode, message: string, status: number, details?: unknown) {
  const error: CheckoutError = { code, message, details };
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = createCheckoutSessionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request data",
        400,
        parsed.error.issues
      );
    }

    const input = parsed.data;

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "You must be logged in to checkout", 401);
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
      return errorResponse("OUT_OF_COVERAGE", "Address has not been verified for delivery coverage", 400);
    }

    // Fetch all menu items and modifier options for validation
    const menuItemIds = input.items.map((item) => item.menuItemId);
    const modifierOptionIds = input.items.flatMap((item) =>
      item.modifiers.map((m) => m.optionId)
    );

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
      .in("id", modifierOptionIds.length > 0 ? modifierOptionIds : ["00000000-0000-0000-0000-000000000000"])
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

    // Create order in database (status: pending)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        address_id: input.addressId,
        status: "pending",
        subtotal_cents: totals.subtotalCents,
        delivery_fee_cents: totals.deliveryFeeCents,
        tax_cents: totals.taxCents,
        total_cents: totals.totalCents,
        delivery_window_start: `${input.scheduledDate}T${input.timeWindowStart}:00`,
        delivery_window_end: `${input.scheduledDate}T${input.timeWindowEnd}:00`,
        special_instructions: input.customerNotes ?? null,
      })
      .select()
      .returns<OrdersRow[]>()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
    }

    // Create order items
    const orderItemsToInsert = validation.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItem.id,
      name_snapshot: item.menuItem.name_en,
      base_price_snapshot: item.menuItem.base_price_cents,
      quantity: item.quantity,
      line_total_cents: item.lineTotalCents,
      special_instructions: item.notes || null,
    }));

    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert)
      .select()
      .returns<OrderItemsRow[]>();

    if (orderItemsError || !orderItems) {
      console.error("Failed to create order items:", orderItemsError);
      // Clean up the order
      await supabase.from("orders").delete().eq("id", order.id);
      return errorResponse("INTERNAL_ERROR", "Failed to create order items", 500);
    }

    // Create order item modifiers
    const orderItemModifiersToInsert: Array<{
      order_item_id: string;
      modifier_option_id: string;
      name_snapshot: string;
      price_delta_snapshot: number;
    }> = [];

    for (let i = 0; i < validation.items.length; i++) {
      const validatedItem = validation.items[i];
      const orderItem = orderItems[i];

      for (const modifier of validatedItem.modifiers) {
        orderItemModifiersToInsert.push({
          order_item_id: orderItem.id,
          modifier_option_id: modifier.id,
          name_snapshot: modifier.name,
          price_delta_snapshot: modifier.price_delta_cents,
        });
      }
    }

    if (orderItemModifiersToInsert.length > 0) {
      const { error: modifiersInsertError } = await supabase
        .from("order_item_modifiers")
        .insert(orderItemModifiersToInsert);

      if (modifiersInsertError) {
        console.error("Failed to create order item modifiers:", modifiersInsertError);
        // Clean up
        await supabase.from("order_items").delete().eq("order_id", order.id);
        await supabase.from("orders").delete().eq("id", order.id);
        return errorResponse("INTERNAL_ERROR", "Failed to create order modifiers", 500);
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

    // Create Stripe Checkout Session
    const lineItems = createStripeLineItems(validation.items, totals.deliveryFeeCents);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
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
    }, {
      idempotencyKey: `checkout_${order.id}`,
    });

    // Note: stripe_payment_intent_id is set by webhook on checkout.session.completed
    // session.payment_intent is null until payment completes

    return NextResponse.json({
      data: {
        sessionUrl: session.url,
        orderId: order.id,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "checkout-session" },
    });
    console.error("Checkout session error:", error);

    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Payment service error", 500);
    }

    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
