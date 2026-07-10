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

  // Find the order by the real PaymentIntent id.
  let { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id, total_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  // Fallback: orders confirmed while the PaymentIntent was still null store a
  // `session_<checkout_session_id>` placeholder instead of the real PI id, so a
  // refund keyed on the real PI won't match. Resolve the Checkout Session for
  // this PI and match on the session id (or its placeholder) instead — otherwise
  // a dashboard refund on such an order is invisible (no status change, no email).
  if (!order) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      const sessionId = sessions.data[0]?.id;
      if (sessionId) {
        const { data: bySession } = await supabase
          .from("orders")
          .select("id, status, user_id, total_cents")
          .or(
            `stripe_checkout_session_id.eq.${sessionId},stripe_payment_intent_id.eq.session_${sessionId}`
          )
          .maybeSingle();
        order = bySession ?? null;
      }
    } catch (lookupErr) {
      logger.warn("Session fallback lookup failed in charge.refunded", {
        paymentIntentId,
        error: lookupErr instanceof Error ? lookupErr.message : String(lookupErr),
        api: "stripe-webhook",
        flowId: "refund",
      });
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

  // Admin item-refunds already send the customer an ITEMIZED notification
  // from the refund route — skip the generic webhook email for those so the
  // customer isn't emailed twice. (Status handling above still ran.)
  try {
    const recentRefunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });
    if (recentRefunds.data[0]?.metadata?.source === "admin-item-refund") {
      logger.info("Skipping duplicate refund email (admin-initiated item refund)", {
        orderId: order.id,
        api: "stripe-webhook",
        flowId: "refund",
      });
      return;
    }
  } catch (listErr) {
    // Fall through to emailing — a duplicate email beats a missing one.
    logger.warn("Could not inspect refund metadata; sending generic refund email", {
      orderId: order.id,
      error: listErr instanceof Error ? listErr.message : String(listErr),
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
