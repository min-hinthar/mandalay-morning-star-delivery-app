import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";
import type Stripe from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handlePaymentFailed,
  handleChargeRefunded,
} from "./handlers";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  // Rate limit webhook endpoint (HARD-01)
  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: getClientIp(request),
    role: "anon",
    route: "webhooks/stripe",
  });
  if (rl.limited) return rl.response;

  if (!WEBHOOK_SECRET) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured", {
      api: "stripe-webhook",
      flowId: "webhook",
    });
    return apiError("INTERNAL_ERROR", "Webhook secret not configured", 500);
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing Stripe signature header", { api: "stripe-webhook", flowId: "webhook" });
    return apiError("BAD_REQUEST", "Missing signature", 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    logger.exception(err, { api: "stripe-webhook", flowId: "webhook" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError("BAD_REQUEST", `Webhook Error: ${message}`, 400);
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
    // Extract orderId from event metadata for Sentry context
    const eventObj = event.data.object as { metadata?: { order_id?: string } };
    logger.exception(err, {
      api: "stripe-webhook",
      flowId: "webhook",
      eventType: event.type,
      eventId: event.id,
      orderId: eventObj.metadata?.order_id,
    });
    // Return 500 for DB/service errors so Stripe retries
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
