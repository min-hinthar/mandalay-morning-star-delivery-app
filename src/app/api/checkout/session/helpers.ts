import type { createClient } from "@/lib/supabase/server";
import type { ModifierGroupWithItems } from "@/lib/utils/order";
import type { ModifierGroupsRow } from "@/types/database";
import { logger } from "@/lib/utils/logger";

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
