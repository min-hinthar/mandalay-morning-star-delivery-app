import React from "react";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { RefundNotification } from "@/emails/RefundNotification";
import type Stripe from "stripe";
import type { OrderStatus } from "@/types/database";

/**
 * Handle refund events
 */
export async function handleChargeRefunded(
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

  // Find the order by the real PaymentIntent id. `maybeSingle()` returns
  // data:null for BOTH "no rows" and a transient DB fault — so surface a real
  // error by throwing (the route returns 500 → Stripe retries), never swallow a
  // DB fault into the "order not found" skip (which returns 200, no retry).
  const { data: byPi, error: piLookupError } = await supabase
    .from("orders")
    .select("id, status, user_id, total_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (piLookupError) throw piLookupError;
  let order = byPi;

  // Fallback: orders confirmed while the PaymentIntent was still null store a
  // `session_<checkout_session_id>` placeholder instead of the real PI id, so a
  // refund keyed on the real PI won't match. Resolve the Checkout Session for
  // this PI and match on the session id (or its placeholder) instead — otherwise
  // a dashboard refund on such an order is invisible (no status change, no email).
  if (!order) {
    // For a `session_<id>`-placeholder order, resolving the Checkout Session from
    // Stripe is the ONLY path from this refund event back to the order, so a
    // transient Stripe error here must retry (rethrow → 500 → Stripe redelivers)
    // rather than fall through to "not found" (200, no redelivery, refund lost).
    let sessionId: string | undefined;
    try {
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      sessionId = sessions.data[0]?.id;
    } catch (lookupErr) {
      // Rethrow so the webhook returns 500 and Stripe retries; the handler is
      // idempotent (status write is status-guarded, email is idempotency-keyed on
      // the charge id), so reprocessing can't double-fire.
      logger.warn("Session fallback lookup failed in charge.refunded — rethrowing for retry", {
        paymentIntentId,
        error: lookupErr instanceof Error ? lookupErr.message : String(lookupErr),
        api: "stripe-webhook",
        flowId: "refund",
      });
      throw lookupErr;
    }
    if (sessionId) {
      // A real DB fault here must 500 (Stripe retries), not masquerade as "no order".
      const { data: bySession, error: sessionLookupError } = await supabase
        .from("orders")
        .select("id, status, user_id, total_cents")
        .or(
          `stripe_checkout_session_id.eq.${sessionId},stripe_payment_intent_id.eq.session_${sessionId}`
        )
        .maybeSingle();
      if (sessionLookupError) throw sessionLookupError;
      order = bySession ?? null;
    }
  }

  if (!order) {
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
  const preDeliveryStatuses: readonly OrderStatus[] = [
    "pending",
    "pending_approval",
    "confirmed",
    "preparing",
  ];
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

  // Some refund flows already email the customer themselves (admin item-refunds
  // send an itemized RefundNotification; a cancellation sends OrderCancellation
  // with refundIssued:true). Skip the generic webhook email for those so the
  // customer isn't emailed twice. Other sources (e.g. `auto-reconcile` — a
  // system refund of a stranded cancelled order) DO email here, since no other
  // channel told the customer. (Status handling above still ran.)
  //
  // Read the source off THIS event's own refund snapshot (`charge.refunds`,
  // newest-first) rather than a live `refunds.list` on the PI: the live list can
  // return a LATER refund as "newest" when this event is processed after a
  // subsequent refund (item-refund → cancellation), mis-attributing the source.
  // The event payload is the state at trigger time, so data[0] is this event's
  // refund. Missing/undefined → fall through and email (a dup beats a miss).
  const SELF_EMAILING_REFUND_SOURCES = new Set(["admin-item-refund", "cancellation"]);
  const refundSource = charge.refunds?.data?.[0]?.metadata?.source;
  if (refundSource && SELF_EMAILING_REFUND_SOURCES.has(refundSource)) {
    logger.info(`Skipping duplicate refund email (source: ${refundSource})`, {
      orderId: order.id,
      api: "stripe-webhook",
      flowId: "refund",
    });
    return;
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

    // Schedule refund email after response (keeps serverless function alive on Vercel)
    const refundOrderId = order.id;
    const refundUserId = order.user_id;
    const refundChargeId = charge.id;
    const refundEmail = profile.email;
    const refundCustomerName = profile.full_name || "Valued Customer";
    const refundOriginalTotalCents = order.total_cents;

    after(async () => {
      try {
        await sendEmail({
          to: refundEmail,
          subject: `Your refund of $${(refundAmountCents / 100).toFixed(2)} has been processed`,
          react: React.createElement(RefundNotification, {
            customerName: refundCustomerName,
            orderId: refundOrderId,
            isPartialRefund,
            refundedItems: [
              {
                name: isPartialRefund ? "Partial refund" : "Full order refund",
                quantity: 1,
                refundAmountCents,
              },
            ],
            originalTotalCents: refundOriginalTotalCents,
            refundAmountCents,
            refundMethod: "Original payment method",
            refundTimeline: "3-5 business days",
            processedAt: new Date().toISOString(),
          }),
          type: "refund",
          orderId: refundOrderId,
          userId: refundUserId,
          mandatory: true,
          idempotencyKey: `refund-${refundChargeId}`,
        });
      } catch (emailErr) {
        logger.error("Failed to send refund email", {
          orderId: refundOrderId,
          error: emailErr instanceof Error ? emailErr.message : String(emailErr),
        });
      }
    });

    logger.info(`Refund email triggered for order ${order.id}`, {
      orderId: order.id,
      api: "stripe-webhook",
      flowId: "email",
    });
  }
}
