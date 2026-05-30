import { describe, expect, it } from "vitest";

import { cartUpsertSchema, computeCartTotals, type ServerCartItem } from "../schemas";

function item(overrides: Partial<ServerCartItem> = {}): ServerCartItem {
  return {
    cartItemId: "c1",
    menuItemId: "m1",
    menuItemSlug: "mohinga",
    nameEn: "Mohinga",
    nameMy: "မုန့်ဟင်းခါး",
    imageUrl: null,
    basePriceCents: 1200,
    quantity: 2,
    modifiers: [
      {
        groupId: "g",
        groupName: "Add-ons",
        optionId: "o",
        optionName: "Egg",
        priceDeltaCents: 150,
      },
    ],
    notes: "",
    addedAt: "2026-05-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("cart schema", () => {
  it("accepts a valid cart payload", () => {
    const result = cartUpsertSchema.safeParse({ items: [item()] });
    expect(result.success).toBe(true);
  });

  it("rejects quantity above the per-item cap", () => {
    const result = cartUpsertSchema.safeParse({ items: [item({ quantity: 999 })] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-array items payload", () => {
    expect(cartUpsertSchema.safeParse({ items: "nope" }).success).toBe(false);
  });
});

describe("computeCartTotals", () => {
  it("sums (base + modifiers) * quantity and counts items", () => {
    const totals = computeCartTotals([
      item({
        basePriceCents: 1200,
        quantity: 2,
        modifiers: [
          { groupId: "g", groupName: "x", optionId: "o", optionName: "Egg", priceDeltaCents: 150 },
        ],
      }),
      item({ cartItemId: "c2", basePriceCents: 1000, quantity: 1, modifiers: [] }),
    ]);
    // (1200 + 150) * 2 + 1000 * 1 = 3700
    expect(totals.subtotalCents).toBe(3700);
    expect(totals.itemCount).toBe(3);
  });

  it("returns zeros for an empty cart", () => {
    expect(computeCartTotals([])).toEqual({ subtotalCents: 0, itemCount: 0 });
  });
});
