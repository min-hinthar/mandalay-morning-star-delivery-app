import React from "react";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { RefundNotification } from "@/emails/RefundNotification";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured", {
      api: "stripe-webhook",
      flowId: "webhook",
    });
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing Stripe signature header", { api: "stripe-webhook", flowId: "webhook" });
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    logger.exception(err, { api: "stripe-webhook", flowId: "webhook" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Use service role client to bypass RLS (webhook has no user context)
  const supabase = createServiceClient();

  // Atomically claim the event via UNIQUE constraint (no TOCTOU race).
  // INSERT ON CONFLICT DO NOTHING returns 0 rows if duplicate → skip processing.
  const { data: claimed, error: claimError } = await supabase
    .from("webhook_events")
    .upsert(
      { event_id: event.id, event_type: event.type },
      { onConflict: "event_id", ignoreDuplicates: true }
    )
    .select("id");

  if (claimError) {
    logger.exception(claimError, { api: "stripe-webhook", flowId: "idempotency" });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // If upsert returned no rows, another instance already claimed this event
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(supabase, session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabase, charge);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`, {
          api: "stripe-webhook",
          flowId: "webhook",
        });
    }
  } catch (err) {
    logger.exception(err, {
      api: "stripe-webhook",
      flowId: "webhook",
      eventType: event.type,
      eventId: event.id,
    });
    // Return 200 to acknowledge receipt (Stripe will retry on 4xx/5xx)
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    logger.error("No order_id in session metadata", {
      sessionId: session.id,
      api: "stripe-webhook",
      flowId: "checkout",
    });
    return;
  }

  // H-01 FIX: Safely extract payment_intent — can be null, string, or PaymentIntent object
  const rawPaymentIntent = session.payment_intent;
  const paymentIntentId =
    typeof rawPaymentIntent === "string"
      ? rawPaymentIntent
      : typeof rawPaymentIntent === "object" && rawPaymentIntent !== null
        ? rawPaymentIntent.id
        : null;

  if (!paymentIntentId) {
    logger.warn("payment_intent is null on checkout.session.completed — storing session ID as fallback", {
      sessionId: session.id,
      orderId,
      api: "stripe-webhook",
      flowId: "checkout",
    });
  }

  // Update order status to confirmed
  const { error } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId ?? `session_${session.id}`,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending"); // Only update if still pending (idempotency)

  if (error) {
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "checkout" });
    throw error;
  }

  logger.info(`Order ${orderId} confirmed via webhook`, {
    orderId,
    api: "stripe-webhook",
    flowId: "checkout",
  });

  // Fetch full order data for email
  const { data: orderData } = await supabase
    .from("orders")
    .select(
      `
      id, user_id, subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
      delivery_window_start, delivery_window_end, special_instructions, placed_at,
      profiles!orders_user_id_fkey ( email, full_name ),
      addresses ( line_1, line_2, city, state, postal_code ),
      order_items (
        name_snapshot, quantity, line_total_cents,
        order_item_modifiers ( name_snapshot, price_delta_snapshot )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (!orderData) {
    logger.error("Could not fetch order data for confirmation email", {
      orderId,
      api: "stripe-webhook",
      flowId: "email",
    });
    return;
  }

  const profile = orderData.profiles as unknown as {
    email: string | null;
    full_name: string | null;
  } | null;
  const address = orderData.addresses as unknown as {
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
  } | null;
  const items =
    (orderData.order_items as unknown as Array<{
      name_snapshot: string;
      quantity: number;
      line_total_cents: number;
      order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }>;
    }>) || [];

  const customerEmail = profile?.email;
  if (!customerEmail) {
    logger.error("No customer email for order confirmation", {
      orderId,
      api: "stripe-webhook",
      flowId: "email",
    });
    return;
  }

  const shortId = orderId.slice(0, 8).toUpperCase();

  // Fire-and-forget: email must not block webhook response
  void sendEmail({
    to: customerEmail,
    subject: `\uD83C\uDF5C Your order is confirmed! Order #${shortId}`,
    react: React.createElement(OrderConfirmation, {
      customerName: profile?.full_name || "Valued Customer",
      orderId,
      items: items.map((item) => ({
        name: item.name_snapshot,
        quantity: item.quantity,
        lineTotalCents: item.line_total_cents,
        modifiers: item.order_item_modifiers?.map((m) => ({
          name: m.name_snapshot,
          priceDelta: m.price_delta_snapshot,
        })),
      })),
      subtotalCents: orderData.subtotal_cents,
      deliveryFeeCents: orderData.delivery_fee_cents,
      taxCents: orderData.tax_cents,
      totalCents: orderData.total_cents,
      deliveryWindowStart: orderData.delivery_window_start ?? undefined,
      deliveryWindowEnd: orderData.delivery_window_end ?? undefined,
      address: address
        ? {
            line1: address.line_1,
            line2: address.line_2 ?? undefined,
            city: address.city,
            state: address.state,
            postalCode: address.postal_code,
          }
        : { line1: "Address on file", city: "", state: "", postalCode: "" },
      specialInstructions: orderData.special_instructions ?? undefined,
      placedAt: orderData.placed_at,
    }),
    type: "order_confirmation",
    orderId,
    userId: orderData.user_id,
    mandatory: true,
    idempotencyKey: `order-confirmation-${orderId}`,
  });

  logger.info(`Order confirmation email triggered for ${orderId}`, {
    orderId,
    api: "stripe-webhook",
    flowId: "email",
  });
}

/**
 * Handle expired checkout session (customer didn't complete payment in time)
 */
async function handleCheckoutSessionExpired(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    logger.error("No order_id in session metadata", {
      sessionId: session.id,
      api: "stripe-webhook",
      flowId: "checkout",
    });
    return;
  }

  // Mark order as cancelled due to payment timeout
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
    })
    .eq("id", orderId)
    .eq("status", "pending"); // Only update if still pending

  if (error) {
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "checkout" });
    throw error;
  }

  logger.info(`Order ${orderId} cancelled due to expired checkout session`, {
    orderId,
    api: "stripe-webhook",
    flowId: "checkout",
  });
}

/**
 * Handle failed payment attempt.
 * H-09 FIX: For terminal failures, cancel the pending order so it doesn't sit
 * in "pending" indefinitely. For retryable failures, log but leave pending
 * (the checkout session expiry will clean up eventually).
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    logger.info("No order_id in payment_intent metadata, skipping", {
      api: "stripe-webhook",
      flowId: "payment",
    });
    return;
  }

  const errorCode = paymentIntent.last_payment_error?.code;
  const errorMessage = paymentIntent.last_payment_error?.message;

  logger.warn(`Payment failed for order ${orderId}`, {
    orderId,
    errorCode,
    errorMessage,
    api: "stripe-webhook",
    flowId: "payment",
  });

  // Terminal failure codes where retry won't help
  const terminalFailures = [
    "card_declined",
    "expired_card",
    "incorrect_cvc",
    "processing_error",
    "insufficient_funds",
    "lost_card",
    "stolen_card",
  ];

  if (errorCode && terminalFailures.includes(errorCode)) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");

    if (error) {
      logger.exception(error, { orderId, api: "stripe-webhook", flowId: "payment" });
    } else {
      logger.info(`Order ${orderId} cancelled due to terminal payment failure: ${errorCode}`, {
        orderId,
        api: "stripe-webhook",
        flowId: "payment",
      });
    }
  }
  // Non-terminal failures: leave as pending — session expiry handler will clean up
}

/**
 * Handle refund events
 */
async function handleChargeRefunded(
  supabase: ReturnType<typeof createServiceClient>,
  charge: Stripe.Charge
) {
  // Find the order by payment intent
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    logger.info("No payment_intent on charge, skipping refund handler", {
      api: "stripe-webhook",
      flowId: "refund",
    });
    return;
  }

  // Find and update the order
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, status, user_id, total_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (findError || !order) {
    logger.error("Could not find order for refund", {
      paymentIntentId,
      api: "stripe-webhook",
      flowId: "refund",
    });
    return;
  }

  // H-08 FIX: Respect order state machine.
  // Only transition to 'cancelled' for pre-delivery states.
  // Delivered orders should NOT change status on refund (preserves delivery record).
  const isFullRefund = charge.amount_refunded === charge.amount;
  const preDeliveryStatuses = ["pending", "confirmed", "preparing", "ready"];
  const isPreDelivery = preDeliveryStatuses.includes(order.status);

  if (isFullRefund && isPreDelivery) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .in("status", preDeliveryStatuses); // Guard: only cancel pre-delivery orders

    if (updateError) {
      logger.exception(updateError, { orderId: order.id, api: "stripe-webhook", flowId: "refund" });
      throw updateError;
    }

    logger.info(`Order ${order.id} cancelled due to full refund (was ${order.status})`, {
      orderId: order.id,
      api: "stripe-webhook",
      flowId: "refund",
    });
  } else if (isFullRefund && !isPreDelivery) {
    // Delivered/out_for_delivery order refunded (dispute, customer service).
    // DON'T change status — just log the financial event.
    logger.info(`Full refund on ${order.status} order ${order.id} — status preserved`, {
      orderId: order.id,
      orderStatus: order.status,
      amountRefunded: charge.amount_refunded,
      api: "stripe-webhook",
      flowId: "refund",
    });
  } else {
    logger.info(`Partial refund processed for order ${order.id}`, {
      orderId: order.id,
      amountRefunded: charge.amount_refunded,
      totalAmount: charge.amount,
      api: "stripe-webhook",
      flowId: "refund",
    });
  }

  // Trigger refund notification email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", order.user_id)
    .single();

  if (profile?.email) {
    const refundAmountCents = charge.amount_refunded;
    const isPartialRefund = charge.amount_refunded < charge.amount;

    void sendEmail({
      to: profile.email,
      subject: `Your refund of $${(refundAmountCents / 100).toFixed(2)} has been processed`,
      react: React.createElement(RefundNotification, {
        customerName: profile.full_name || "Valued Customer",
        orderId: order.id,
        isPartialRefund,
        refundedItems: [
          {
            name: isPartialRefund ? "Partial refund" : "Full order refund",
            quantity: 1,
            refundAmountCents,
          },
        ],
        originalTotalCents: order.total_cents,
        refundAmountCents,
        refundMethod: "Original payment method",
        refundTimeline: "3-5 business days",
        processedAt: new Date().toISOString(),
      }),
      type: "refund",
      orderId: order.id,
      userId: order.user_id,
      mandatory: true,
      idempotencyKey: `refund-${charge.id}`,
    });

    logger.info(`Refund email triggered for order ${order.id}`, {
      orderId: order.id,
      api: "stripe-webhook",
      flowId: "email",
    });
  }
}
