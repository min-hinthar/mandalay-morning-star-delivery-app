import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus } from "@/types/database";

import { buildEmailElement } from "./build";
import { getLoyaltyNudge, getNextDeliveryCutoffText } from "./nudges";
import { sendEmail } from "./send";
import type { EmailType } from "./types";

/**
 * Shared sender for the customer status-transition emails that BOTH the admin
 * status route AND the driver/route fulfillment flow need to fire. Centralizing
 * it here means a status email carries the identical full order detail (dish
 * photos, chosen options, per-item + delivery notes) no matter which surface
 * moved the order — admin dashboard, driver "start route", or a stop marked
 * delivered.
 *
 * Reads use the SERVICE client so the send never depends on the caller's RLS
 * scope (a driver can't read the customer's profile/address under RLS; an admin
 * can — this removes that coupling and works for cron too).
 *
 * Idempotency key is STABLE (`<status>-<orderId>`), not time-based. The driver
 * flows are retryable (offline at-least-once queue; idempotent route start), and
 * the same order can be marked delivered from two surfaces (driver stop + admin
 * route UI). A stable key lets Resend dedupe those into a single send instead of
 * emailing the customer twice.
 */

// Status → customer email template. Cancellation is intentionally excluded —
// it's sent by the dedicated cancel routes (with refund copy) and via the admin
// status route's own cancellation branch.
const STATUS_EMAIL_MAP: Partial<Record<OrderStatus, EmailType>> = {
  confirmed: "order_confirmation",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};

const SUBJECT_SUFFIX: Partial<Record<EmailType, string>> = {
  order_confirmation: "has been confirmed!",
  out_for_delivery: "is on its way!",
  delivered: "has been delivered!",
};

interface OrderItemRow {
  name_snapshot: string;
  name_my_snapshot: string | null;
  special_instructions: string | null;
  quantity: number;
  line_total_cents: number;
  menu_items: { image_url: string | null } | null;
  order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }> | null;
}

export interface SendOrderStatusEmailOptions {
  /** Driver display name for the out_for_delivery template (optional). */
  driverName?: string | null;
  /** Delivery timestamp for the delivered template (defaults to now). */
  deliveredAt?: string | null;
}

/**
 * Build + send the customer email for a status transition into
 * confirmed / out_for_delivery / delivered. Returns false (fail-soft) when the
 * status has no template, the order/customer can't be resolved, or the send
 * fails — a notification must never throw back into the caller's transaction.
 */
export async function sendOrderStatusEmail(
  orderId: string,
  newStatus: OrderStatus,
  options: SendOrderStatusEmailOptions = {}
): Promise<boolean> {
  const emailType = STATUS_EMAIL_MAP[newStatus];
  if (!emailType) return false;

  const supabase = createServiceClient();

  // Order data + delivery address needed by all three templates.
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      user_id, total_cents, subtotal_cents, delivery_fee_cents, tax_cents, tip_cents, discount_cents,
      special_instructions, delivery_instructions, delivery_window_start, delivery_window_end,
      addresses (line_1, line_2, city, state, postal_code)
    `
    )
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    logger.warn("Status email: order not found", { orderId, newStatus });
    return false;
  }

  const orderUserId = orderData.user_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", orderUserId)
    .single();

  if (!profile?.email) {
    logger.warn("Status email: no customer email", { orderId, userId: orderUserId });
    return false;
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      "name_snapshot, name_my_snapshot, special_instructions, quantity, line_total_cents, menu_items ( image_url ), order_item_modifiers ( name_snapshot, price_delta_snapshot )"
    )
    .eq("order_id", orderId);

  const items = ((orderItems || []) as OrderItemRow[]).map((item) => ({
    name: item.name_snapshot,
    nameMy: item.name_my_snapshot,
    quantity: item.quantity,
    lineTotalCents: item.line_total_cents,
    imageUrl: item.menu_items?.image_url ?? null,
    // Per-item kitchen note + chosen options, so every status email shows the
    // full detail (customers confirm their order; staff/drivers see specials).
    notes: item.special_instructions,
    modifiers: item.order_item_modifiers?.map((m) => ({
      name: m.name_snapshot,
      priceDelta: m.price_delta_snapshot,
    })),
  }));

  const address = orderData.addresses
    ? {
        line1: orderData.addresses.line_1,
        line2: orderData.addresses.line_2 ?? undefined,
        city: orderData.addresses.city,
        state: orderData.addresses.state,
        postalCode: orderData.addresses.postal_code,
      }
    : null;

  // Decorative nudges (fail-soft): real loyalty progress at send time; the
  // delivered email also teases the next live delivery window.
  const wantsLoyalty = emailType === "order_confirmation" || emailType === "delivered";
  const [loyalty, nextCutoff] = await Promise.all([
    wantsLoyalty ? getLoyaltyNudge(supabase, orderUserId) : Promise.resolve(null),
    emailType === "delivered" ? getNextDeliveryCutoffText() : Promise.resolve(null),
  ]);

  const shortId = orderId.slice(0, 8).toUpperCase();
  const subject = `Your order #${shortId} ${SUBJECT_SUFFIX[emailType] ?? "was updated"}`;

  const react = buildEmailElement(emailType, {
    customerName: profile.full_name || "Valued Customer",
    orderId,
    items,
    subtotalCents: orderData.subtotal_cents ?? 0,
    deliveryFeeCents: orderData.delivery_fee_cents ?? 0,
    taxCents: orderData.tax_cents ?? 0,
    tipCents: orderData.tip_cents ?? 0,
    discountCents: orderData.discount_cents ?? 0,
    totalCents: orderData.total_cents ?? 0,
    deliveryWindowStart: orderData.delivery_window_start ?? null,
    deliveryWindowEnd: orderData.delivery_window_end ?? null,
    address,
    specialInstructions: orderData.special_instructions ?? null,
    deliveryInstructions: orderData.delivery_instructions ?? null,
    driverName: options.driverName ?? undefined,
    itemCount: items.length,
    deliveredAt:
      newStatus === "delivered" ? (options.deliveredAt ?? new Date().toISOString()) : null,
    loyalty,
    nextDeliveryCutoffText: nextCutoff,
  });

  const result = await sendEmail({
    to: profile.email,
    subject,
    react,
    type: emailType,
    orderId,
    userId: orderUserId,
    // Stable key: retries + multi-surface delivers dedupe to one send.
    idempotencyKey: `${newStatus}-${orderId}`,
  });

  return result.success;
}
