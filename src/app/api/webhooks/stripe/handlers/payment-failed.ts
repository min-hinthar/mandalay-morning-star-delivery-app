import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";

/**
 * Handle failed payment attempt.
 * H-09 FIX: For terminal failures, cancel the pending order so it doesn't sit
 * in "pending" indefinitely. For retryable failures, log but leave pending
 * (the checkout session expiry will clean up eventually).
 */
export async function handlePaymentFailed(
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
