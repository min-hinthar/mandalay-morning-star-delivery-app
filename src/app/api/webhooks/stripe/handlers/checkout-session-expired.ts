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

  logger.info(`Order ${orderId} cancelled due to expired checkout session`, {
    orderId,
    api: "stripe-webhook",
    flowId: "checkout",
  });
}
