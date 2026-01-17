import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { isPastCutoff } from "@/lib/utils/delivery-dates";
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
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
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

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "You must be logged in" } },
      { status: 401 }
    );
  }

  // Fetch order with items and modifiers
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(`
      id, user_id, status,
      subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
      delivery_window_start, delivery_window_end,
      order_items (
        id, name_snapshot, base_price_snapshot, quantity, line_total_cents,
        order_item_modifiers (name_snapshot, price_delta_snapshot)
      )
    `)
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
      { error: { code: "INVALID_STATUS", message: "This order has already been paid or cancelled" } },
      { status: 400 }
    );
  }

  // Check if delivery cutoff has passed
  if (order.delivery_window_start) {
    const deliveryDate = new Date(order.delivery_window_start);
    if (isPastCutoff(deliveryDate)) {
      return NextResponse.json(
        { error: { code: "CUTOFF_PASSED", message: "Delivery cutoff has passed. Please cancel and place a new order." } },
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
    const modifierNames = item.order_item_modifiers
      .map((m) => m.name_snapshot)
      .join(", ");
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
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
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
    }, {
      idempotencyKey: `retry_${order.id}_${Date.now()}`,
    });

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
    logger.exception(error, { api: "orders/[id]/retry-payment" });
    return NextResponse.json(
      { error: { code: "STRIPE_ERROR", message: "Failed to create payment session" } },
      { status: 500 }
    );
  }
}
