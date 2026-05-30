import { z } from "zod";

import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from "@/types/cart";

const MAX_PRICE_CENTS = 1_000_000; // $10k ceiling — defensive cap, not a business rule

const modifierSchema = z.object({
  groupId: z.string().max(100),
  groupName: z.string().max(200),
  optionId: z.string().max(100),
  optionName: z.string().max(200),
  priceDeltaCents: z.number().int().min(0).max(MAX_PRICE_CENTS),
});

/** A cart item as persisted server-side (display snapshot; never trusted for payment). */
export const serverCartItemSchema = z.object({
  cartItemId: z.string().max(100),
  menuItemId: z.string().max(100),
  menuItemSlug: z.string().max(200),
  nameEn: z.string().max(300),
  nameMy: z.string().max(300).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  basePriceCents: z.number().int().min(0).max(MAX_PRICE_CENTS),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
  modifiers: z.array(modifierSchema).max(50),
  notes: z.string().max(1000),
  addedAt: z.string().max(40),
  categoryId: z.string().max(100).optional(),
  pendingSync: z.boolean().optional(),
});

export const cartUpsertSchema = z.object({
  items: z.array(serverCartItemSchema).max(MAX_CART_ITEMS),
});

export type ServerCartItem = z.infer<typeof serverCartItemSchema>;

/** Subtotal (cents) and total item count for a set of cart items. */
export function computeCartTotals(items: ServerCartItem[]): {
  subtotalCents: number;
  itemCount: number;
} {
  let subtotalCents = 0;
  let itemCount = 0;
  for (const item of items) {
    const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0);
    subtotalCents += (item.basePriceCents + modifierTotal) * item.quantity;
    itemCount += item.quantity;
  }
  return { subtotalCents, itemCount };
}
