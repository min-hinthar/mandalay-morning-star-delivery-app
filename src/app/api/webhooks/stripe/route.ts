import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured", { api: "stripe-webhook", flowId: "webhook" });
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing Stripe signature header", { api: "stripe-webhook", flowId: "webhook" });
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    logger.exception(err, { api: "stripe-webhook", flowId: "webhook" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Use service role client to bypass RLS (webhook has no user context)
  const supabase = createServiceClient();

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
        logger.info(`Unhandled event type: ${event.type}`, { api: "stripe-webhook", flowId: "webhook" });
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
    logger.error("No order_id in session metadata", { sessionId: session.id, api: "stripe-webhook", flowId: "checkout" });
    return;
  }

  // Update order status to confirmed
  const { error } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: session.payment_intent as string,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending"); // Only update if still pending (idempotency)

  if (error) {
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "checkout" });
    throw error;
  }

  logger.info(`Order ${orderId} confirmed via webhook`, { orderId, api: "stripe-webhook", flowId: "checkout" });

  // Trigger order confirmation email via Supabase Edge Function
  await sendOrderConfirmationEmail(orderId);
}

/**
 * Send order confirmation email via Supabase Edge Function
 */
async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  if (!SUPABASE_URL) {
    logger.warn("SUPABASE_URL is not configured, skipping email", { orderId, api: "stripe-webhook", flowId: "email" });
    return;
  }

  try {
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/send-order-confirmation`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to send confirmation email", { orderId, errorData, api: "stripe-webhook", flowId: "email" });
      // Don't throw - email failure shouldn't fail the webhook
    } else {
      logger.info(`Order confirmation email sent for order ${orderId}`, { orderId, api: "stripe-webhook", flowId: "email" });
    }
  } catch (error) {
    // Log but don't throw - email failure shouldn't fail the webhook
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "email" });
  }
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
    logger.error("No order_id in session metadata", { sessionId: session.id, api: "stripe-webhook", flowId: "checkout" });
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

  logger.info(`Order ${orderId} cancelled due to expired checkout session`, { orderId, api: "stripe-webhook", flowId: "checkout" });
}

/**
 * Handle failed payment attempt
 */
async function handlePaymentFailed(
  _supabase: ReturnType<typeof createServiceClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Payment intents may not have our order_id directly
  // We stored the session ID in the order, so we need to find the order differently
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    // This might be a retry or payment intent not associated with our checkout
    logger.info("No order_id in payment_intent metadata, skipping", { api: "stripe-webhook", flowId: "payment" });
    return;
  }

  // Log the failure but don't cancel the order yet
  // The customer may retry or the checkout session may expire
  logger.warn(`Payment failed for order ${orderId}`, {
    orderId,
    errorMessage: paymentIntent.last_payment_error?.message,
    api: "stripe-webhook",
    flowId: "payment",
  });
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
    logger.info("No payment_intent on charge, skipping refund handler", { api: "stripe-webhook", flowId: "refund" });
    return;
  }

  // Find and update the order
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (findError || !order) {
    logger.error("Could not find order for refund", { paymentIntentId, api: "stripe-webhook", flowId: "refund" });
    return;
  }

  // Check if it's a full refund
  const isFullRefund = charge.amount_refunded === charge.amount;

  if (isFullRefund) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
      })
      .eq("id", order.id);

    if (updateError) {
      logger.exception(updateError, { orderId: order.id, api: "stripe-webhook", flowId: "refund" });
      throw updateError;
    }

    logger.info(`Order ${order.id} cancelled due to full refund`, { orderId: order.id, api: "stripe-webhook", flowId: "refund" });
  } else {
    // Partial refund - log but don't change status
    logger.info(`Partial refund processed for order ${order.id}`, {
      orderId: order.id,
      amountRefunded: charge.amount_refunded,
      totalAmount: charge.amount,
      api: "stripe-webhook",
      flowId: "refund",
    });
  }
}
