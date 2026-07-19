import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus } from "@/types/database";

import { sendPushToUser } from "./send";

/**
 * Web-push companion to the status EMAIL sender (`sendOrderStatusEmail`). The
 * admin status route historically fired both an email and this push, but the
 * DRIVER flow (route start → out_for_delivery; stop → delivered) and the admin
 * route-UI stop routes sent neither push nor email. Now that the email is wired
 * into those surfaces, this gives the push the same reach so the customer's
 * phone buzzes no matter which surface moved the order.
 *
 * Best-effort + fail-soft: no-op when the status has no push, the order/user
 * can't be resolved, or VAPID keys aren't configured (`sendPushToUser` returns
 * `{sent:0}`) — so callers can fire it unconditionally. Reads use the SERVICE
 * client so it never depends on the caller's RLS scope (a driver can't read the
 * customer's push subscriptions).
 */

// Live order updates worth a phone buzz.
const STATUS_PUSH: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  confirmed: {
    title: "Order confirmed ✅",
    body: "We've got your order — we'll ping you when it's on the way.",
  },
  out_for_delivery: {
    title: "Your order is on its way! 🚗",
    body: "Your Mandalay Morning Star feast is out for delivery.",
  },
  delivered: { title: "Delivered! 🍜", body: "Your order has arrived — enjoy your meal!" },
};

export interface SendOrderStatusPushOptions {
  /** Customer's user id, if the caller already has it — skips a lookup. */
  userId?: string;
}

/**
 * Fire the status web-push for confirmed / out_for_delivery / delivered.
 *
 * The `order-<orderId>` coalescing tag means successive updates for one order
 * replace each other on the device — and a duplicate fire from two surfaces
 * (driver stop + admin route UI) collapses to a single visible notification —
 * so this needs no idempotency key the way the email path does.
 */
export async function sendOrderStatusPush(
  orderId: string,
  newStatus: OrderStatus,
  options: SendOrderStatusPushOptions = {}
): Promise<void> {
  const message = STATUS_PUSH[newStatus];
  if (!message) return;

  const supabase = createServiceClient();

  let userId = options.userId;
  if (!userId) {
    const { data: order } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!order?.user_id) {
      logger.warn("Status push: order/user not found", { orderId, newStatus });
      return;
    }
    userId = order.user_id;
  }

  await sendPushToUser(supabase, userId, {
    title: message.title,
    body: message.body,
    url: `/orders/${orderId}/tracking`,
    tag: `order-${orderId}`,
  });
}
