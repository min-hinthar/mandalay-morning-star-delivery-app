import React from "react";
import type { createClient } from "@/lib/supabase/server";
import type { ModifierGroupWithItems, ValidatedCartItem } from "@/lib/utils/order";
import type { ModifierGroupsRow } from "@/types/database";
import { logger } from "@/lib/utils/logger";
import { sendEmail } from "@/lib/email";
import { OrderConfirmation } from "@/emails/OrderConfirmation";

/**
 * BUG-03 FIX: Independent cleanup — each delete wrapped in try/catch
 * so partial cleanup failures are logged but don't crash the cleanup chain
 */
export async function cleanupOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  orderItemIds: string[]
) {
  try {
    await supabase.from("order_item_modifiers").delete().in("order_item_id", orderItemIds);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "order_item_modifiers", orderId });
  }
  try {
    await supabase.from("order_items").delete().eq("order_id", orderId);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "order_items", orderId });
  }
  try {
    await supabase.from("orders").delete().eq("id", orderId);
  } catch (e) {
    logger.exception(e, { api: "checkout-session", cleanup: "orders", orderId });
  }
}

/**
 * Build modifier group lookup from item_modifier_groups join data.
 * BUG-02: Required for min_select/max_select constraint validation.
 */
export function buildModifierGroupsMap(
  itemModifierGroupsData: Array<{ item_id: string; group_id: string }> | null
): Map<string, ModifierGroupWithItems> {
  const map = new Map<string, ModifierGroupWithItems>();
  if (!itemModifierGroupsData) return map;

  for (const row of itemModifierGroupsData) {
    const mg = (row as Record<string, unknown>).modifier_groups as ModifierGroupsRow | null;
    if (!mg) continue;
    const existing = map.get(mg.id);
    if (existing) {
      existing.itemIds.push(row.item_id);
    } else {
      map.set(mg.id, { group: mg, itemIds: [row.item_id] });
    }
  }

  return map;
}

export async function sendCODOrderEmail(opts: {
  orderId: string;
  userEmail: string;
  customerName: string;
  validatedItems: ValidatedCartItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  address: { line1: string; line2?: string; city: string; state: string; postalCode: string };
  customerNotes?: string;
  deliveryInstructions?: string;
}) {
  const shortId = opts.orderId.slice(0, 8).toUpperCase();
  try {
    await sendEmail({
      to: opts.userEmail,
      subject: `\uD83C\uDF5C Your order #${shortId} has been received`,
      type: "order_confirmation",
      orderId: opts.orderId,
      userId: opts.orderId,
      idempotencyKey: `cod-received-${opts.orderId}`,
      react: React.createElement(OrderConfirmation, {
        customerName: opts.customerName,
        orderId: opts.orderId,
        items: opts.validatedItems.map((item) => ({
          name: item.menuItem.name_en,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
          modifiers: item.modifiers?.map((m) => ({
            name: m.name,
            priceDelta: m.price_delta_cents,
          })),
        })),
        subtotalCents: opts.subtotalCents,
        deliveryFeeCents: opts.deliveryFeeCents,
        taxCents: opts.taxCents,
        tipCents: opts.tipCents,
        totalCents: opts.totalCents,
        deliveryWindowStart: `${opts.scheduledDate}T${opts.timeWindowStart}:00`,
        deliveryWindowEnd: `${opts.scheduledDate}T${opts.timeWindowEnd}:00`,
        address: opts.address,
        specialInstructions: opts.customerNotes,
        deliveryInstructions: opts.deliveryInstructions,
        paymentMethod: "cod",
        isPendingApproval: true,
        placedAt: new Date().toISOString(),
      }),
    });
  } catch (emailErr) {
    logger.error("Failed to send COD order email", {
      orderId: opts.orderId,
      error: emailErr instanceof Error ? emailErr.message : String(emailErr),
    });
  }
}
