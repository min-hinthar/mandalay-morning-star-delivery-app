import React from "react";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
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
