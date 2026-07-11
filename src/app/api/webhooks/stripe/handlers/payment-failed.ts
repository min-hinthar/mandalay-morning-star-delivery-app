import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";

/**
 * Handle a failed payment attempt (log-only).
 *
 * This intentionally does NOT cancel the order. In Stripe Checkout a card
 * decline does not close the session — the customer can retry with another card
 * in the SAME session and then trigger `checkout.session.completed`. Cancelling
 * on a "terminal" code here would strand that customer: the order goes
 * `cancelled`, then the successful retry's completion is skipped (the confirm
 * handler guards on `status = 'pending'`) → charged + cancelled. Session
 * lifecycle is Stripe's to own; `checkout.session.expired` is the sole canceller
 * for an unpaid session.
 *
 * (Note: this handler is also effectively inert today — session metadata is not
 * copied onto the PaymentIntent, so `order_id` is absent and it early-returns.
 * Do NOT "fix" that by adding `payment_intent_data.metadata.order_id` without
 * first removing any cancel-on-failure logic, or the stranding above reactivates.)
 */
export async function handlePaymentFailed(
  _supabase: ReturnType<typeof createServiceClient>,
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

  logger.warn(`Payment failed for order ${orderId}`, {
    orderId,
    errorCode: paymentIntent.last_payment_error?.code,
    errorMessage: paymentIntent.last_payment_error?.message,
    api: "stripe-webhook",
    flowId: "payment",
  });
  // Do not cancel — the customer may still complete payment in the same session.
}
