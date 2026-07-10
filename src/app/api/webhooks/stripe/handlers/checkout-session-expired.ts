import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";

/**
 * Handle expired checkout session (customer didn't complete payment in time)
 */
export async function handleCheckoutSessionExpired(
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

  // Mark order as cancelled due to payment timeout — but ONLY if the expiring
  // session is still the order's CURRENT session. A retry issues a fresh session
  // and re-points the order at it; the prior session's later expiry (natural, or
  // a manual expire during retry) must NOT cancel an order that has moved on, or
  // the customer pays the retry session into a cancelled order (charged +
  // cancelled — the stranding this guards against). `.select("id")` lets us tell
  // "cancelled" from "skipped because the order moved on".
  const { data: cancelledRows, error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .eq("stripe_checkout_session_id", session.id)
    .select("id");

  if (error) {
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "checkout" });
    throw error;
  }

  if (!cancelledRows || cancelledRows.length === 0) {
    logger.info(`Expired session for order ${orderId} skipped (not the current session)`, {
      orderId,
      sessionId: session.id,
      api: "stripe-webhook",
      flowId: "checkout",
    });
    return;
  }

  logger.info(`Order ${orderId} cancelled due to expired checkout session`, {
    orderId,
    api: "stripe-webhook",
    flowId: "checkout",
  });
}
