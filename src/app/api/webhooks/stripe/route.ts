import { NextResponse } from "next/server";
import { headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
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
    console.error("Missing Stripe signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
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
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    Sentry.captureException(err, {
      tags: { api: "stripe-webhook", eventType: event.type },
      extra: { eventId: event.id },
    });
    console.error(`Error handling ${event.type}:`, message);
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
    console.error("No order_id in session metadata:", session.id);
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
    console.error("Failed to update order status:", error);
    throw error;
  }

  console.log(`Order ${orderId} confirmed via webhook`);

  // Trigger order confirmation email via Supabase Edge Function
  await sendOrderConfirmationEmail(orderId);
}

/**
 * Send order confirmation email via Supabase Edge Function
 */
async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  if (!SUPABASE_URL) {
    console.error("SUPABASE_URL is not configured, skipping email");
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
      console.error("Failed to send confirmation email:", errorData);
      // Don't throw - email failure shouldn't fail the webhook
    } else {
      const result = await response.json();
      console.log(`Order confirmation email sent for order ${orderId}:`, result);
    }
  } catch (error) {
    // Log but don't throw - email failure shouldn't fail the webhook
    console.error("Error calling email Edge Function:", error);
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
    console.error("No order_id in session metadata:", session.id);
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
    console.error("Failed to cancel expired order:", error);
    throw error;
  }

  console.log(`Order ${orderId} cancelled due to expired checkout session`);
}

/**
 * Handle failed payment attempt
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Payment intents may not have our order_id directly
  // We stored the session ID in the order, so we need to find the order differently
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    // This might be a retry or payment intent not associated with our checkout
    console.log("No order_id in payment_intent metadata, skipping");
    return;
  }

  // Log the failure but don't cancel the order yet
  // The customer may retry or the checkout session may expire
  console.log(`Payment failed for order ${orderId}:`, paymentIntent.last_payment_error?.message);
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
    console.log("No payment_intent on charge, skipping refund handler");
    return;
  }

  // Find and update the order
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (findError || !order) {
    console.error("Could not find order for refund:", paymentIntentId);
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
      console.error("Failed to update order status for refund:", updateError);
      throw updateError;
    }

    console.log(`Order ${order.id} cancelled due to full refund`);
  } else {
    // Partial refund - log but don't change status
    console.log(`Partial refund processed for order ${order.id}: ${charge.amount_refunded}/${charge.amount}`);
  }
}
