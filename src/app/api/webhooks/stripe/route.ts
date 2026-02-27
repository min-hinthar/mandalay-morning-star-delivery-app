import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handlePaymentFailed,
  handleChargeRefunded,
} from "./handlers";

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
