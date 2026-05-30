import { FREE_DELIVERY_PROMO_DEFAULTS } from "@/lib/utils/delivery-promo";
import type { ServerCartItem } from "@/app/api/cart/schemas";

export interface AbandonedCartEmailItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  modifiers?: { name: string; priceDelta?: number }[];
  notes?: string | null;
}

/** Map persisted cart items to the shape OrderItemsTable expects. */
export function mapCartItemsToEmail(items: ServerCartItem[]): AbandonedCartEmailItem[] {
  return items.map((item) => {
    const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0);
    return {
      name: item.nameEn,
      nameMy: item.nameMy ?? null,
      quantity: item.quantity,
      lineTotalCents: (item.basePriceCents + modifierTotal) * item.quantity,
      modifiers: item.modifiers.map((m) => ({ name: m.optionName, priceDelta: m.priceDeltaCents })),
      notes: item.notes || null,
    };
  });
}

/** Cents remaining until the free-delivery threshold (0 once reached). */
export function amountToFreeDelivery(
  subtotalCents: number,
  thresholdCents: number = FREE_DELIVERY_PROMO_DEFAULTS.freeDeliveryThresholdCents
): number {
  return Math.max(0, thresholdCents - subtotalCents);
}
