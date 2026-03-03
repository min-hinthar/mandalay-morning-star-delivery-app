import { describe, expect, it } from "vitest";
import {
  calculateLineTotal,
  calculateDeliveryFee,
  calculateTax,
  calculateOrderTotals,
  createStripeLineItems,
  validateCartItems,
  type ModifierGroupWithItems,
} from "../order";
import {
  createMockMenuItem,
  createMockModifierOption,
  createValidatedCartItem,
} from "@/test/factories";
import type { ModifierGroupsRow, ModifierOptionsRow } from "@/types/database";

/** Helper to create a mock modifier group */
function createMockModifierGroup(
  overrides?: Partial<ModifierGroupsRow>
): ModifierGroupsRow {
  return {
    id: "group-uuid",
    slug: "test-group",
    name: "Test Group",
    selection_type: "multiple",
    min_select: 0,
    max_select: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Default fee values matching old constants
const DELIVERY_FEE = 1500;
const FREE_THRESHOLD = 10000;

describe("calculateLineTotal", () => {
  it("calculates base price with no modifiers", () => {
    const result = calculateLineTotal(1500, [], 1);
    expect(result).toBe(1500);
  });

  it("adds positive modifier price deltas", () => {
    const modifiers: ModifierOptionsRow[] = [createMockModifierOption({ price_delta_cents: 200 })];
    const result = calculateLineTotal(1500, modifiers, 1);
    expect(result).toBe(1700);
  });

  it("handles multiple modifiers", () => {
    const modifiers: ModifierOptionsRow[] = [
      createMockModifierOption({ id: "mod-1", price_delta_cents: 100 }),
      createMockModifierOption({ id: "mod-2", price_delta_cents: 200 }),
      createMockModifierOption({ id: "mod-3", price_delta_cents: 50 }),
    ];
    const result = calculateLineTotal(1500, modifiers, 1);
    expect(result).toBe(1850); // 1500 + 100 + 200 + 50
  });

  it("multiplies by quantity correctly", () => {
    const modifiers: ModifierOptionsRow[] = [createMockModifierOption({ price_delta_cents: 100 })];
    const result = calculateLineTotal(1500, modifiers, 3);
    expect(result).toBe(4800); // (1500 + 100) * 3
  });

  it("handles zero quantity", () => {
    const result = calculateLineTotal(1500, [], 0);
    expect(result).toBe(0);
  });

  it("handles zero base price with modifiers", () => {
    const modifiers: ModifierOptionsRow[] = [createMockModifierOption({ price_delta_cents: 500 })];
    const result = calculateLineTotal(0, modifiers, 2);
    expect(result).toBe(1000); // (0 + 500) * 2
  });
});

describe("calculateDeliveryFee", () => {
  it("returns fee when subtotal is below threshold", () => {
    const result = calculateDeliveryFee(9999, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(DELIVERY_FEE);
  });

  it("returns $0 when subtotal equals threshold exactly", () => {
    const result = calculateDeliveryFee(FREE_THRESHOLD, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(0);
  });

  it("returns $0 when subtotal exceeds threshold", () => {
    const result = calculateDeliveryFee(15000, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(0);
  });

  it("returns fee for zero subtotal", () => {
    const result = calculateDeliveryFee(0, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(DELIVERY_FEE);
  });

  it("returns fee for $1 below threshold", () => {
    const result = calculateDeliveryFee(FREE_THRESHOLD - 1, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(DELIVERY_FEE);
  });

  it("returns $0 for $1 above threshold", () => {
    const result = calculateDeliveryFee(FREE_THRESHOLD + 1, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result).toBe(0);
  });

  it("works with custom fee and threshold", () => {
    expect(calculateDeliveryFee(5000, 2000, 8000)).toBe(2000);
    expect(calculateDeliveryFee(9000, 2000, 8000)).toBe(0);
  });
});

describe("calculateTax", () => {
  it("returns 0 for V1 (placeholder)", () => {
    const result = calculateTax(10000);
    expect(result).toBe(0);
  });

  it("returns 0 regardless of subtotal", () => {
    expect(calculateTax(0)).toBe(0);
    expect(calculateTax(50000)).toBe(0);
    expect(calculateTax(100000)).toBe(0);
  });
});

describe("calculateOrderTotals", () => {
  it("calculates subtotal from single item", () => {
    const items = [createValidatedCartItem({ base_price_cents: 1500 })];
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.subtotalCents).toBe(1500);
  });

  it("sums line totals from multiple items", () => {
    const items = [
      createValidatedCartItem({ base_price_cents: 1500 }),
      createValidatedCartItem({ base_price_cents: 2000 }),
      createValidatedCartItem({ base_price_cents: 1000 }),
    ];
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.subtotalCents).toBe(4500);
  });

  it("applies delivery fee when below threshold", () => {
    const items = [createValidatedCartItem({ base_price_cents: 5000 })]; // $50
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.deliveryFeeCents).toBe(DELIVERY_FEE);
    expect(result.totalCents).toBe(5000 + DELIVERY_FEE);
  });

  it("waives delivery fee when at or above threshold", () => {
    const items = [createValidatedCartItem({ base_price_cents: 10000 })]; // $100
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.deliveryFeeCents).toBe(0);
    expect(result.totalCents).toBe(10000);
  });

  it("returns correct totals object", () => {
    const items = [createValidatedCartItem({ base_price_cents: 3000 })];
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);

    expect(result).toEqual({
      subtotalCents: 3000,
      deliveryFeeCents: DELIVERY_FEE,
      taxCents: 0,
      totalCents: 3000 + DELIVERY_FEE,
    });
  });

  it("handles empty items array", () => {
    const result = calculateOrderTotals([], DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.subtotalCents).toBe(0);
    expect(result.deliveryFeeCents).toBe(DELIVERY_FEE);
    expect(result.totalCents).toBe(DELIVERY_FEE);
  });

  it("handles items with modifiers", () => {
    const items = [
      createValidatedCartItem({ base_price_cents: 1500 }, [{ price_delta_cents: 200 }], 2),
    ];
    // lineTotalCents = (1500 + 200) * 2 = 3400
    const result = calculateOrderTotals(items, DELIVERY_FEE, FREE_THRESHOLD);
    expect(result.subtotalCents).toBe(3400);
  });
});

describe("createStripeLineItems", () => {
  it("creates line items with correct unit amounts", () => {
    const items = [
      {
        menuItem: createMockMenuItem({ name_en: "Mohinga", base_price_cents: 1500 }),
        modifiers: [],
        quantity: 2,
        notes: "",
        lineTotalCents: 3000,
      },
    ];

    const result = createStripeLineItems(items, 0);

    expect(result).toHaveLength(1);
    expect(result[0].price_data.unit_amount).toBe(1500);
    expect(result[0].price_data.product_data.name).toBe("Mohinga");
    expect(result[0].quantity).toBe(2);
  });

  it("includes modifier names in description", () => {
    const items = [
      {
        menuItem: createMockMenuItem({ base_price_cents: 1500 }),
        modifiers: [
          createMockModifierOption({ name: "Extra Spicy", price_delta_cents: 100 }),
          createMockModifierOption({ name: "No Onion", price_delta_cents: 0 }),
        ],
        quantity: 1,
        notes: "",
        lineTotalCents: 1600,
      },
    ];

    const result = createStripeLineItems(items, 0);

    expect(result[0].price_data.product_data.description).toBe("Extra Spicy, No Onion");
    expect(result[0].price_data.unit_amount).toBe(1600); // 1500 + 100 + 0
  });

  it("adds delivery fee line item when > 0", () => {
    const items = [
      {
        menuItem: createMockMenuItem({ base_price_cents: 1500 }),
        modifiers: [],
        quantity: 1,
        notes: "",
        lineTotalCents: 1500,
      },
    ];

    const result = createStripeLineItems(items, DELIVERY_FEE);

    expect(result).toHaveLength(2);
    expect(result[1].price_data.unit_amount).toBe(DELIVERY_FEE);
    expect(result[1].price_data.product_data.name).toBe("Delivery Fee");
    expect(result[1].quantity).toBe(1);
  });

  it("omits delivery fee line item when 0", () => {
    const items = [
      {
        menuItem: createMockMenuItem({ base_price_cents: 15000 }),
        modifiers: [],
        quantity: 1,
        notes: "",
        lineTotalCents: 15000,
      },
    ];

    const result = createStripeLineItems(items, 0);

    expect(result).toHaveLength(1);
    expect(
      result.find((item) => item.price_data.product_data.name === "Delivery Fee")
    ).toBeUndefined();
  });

  it("handles items with no modifiers", () => {
    const items = [
      {
        menuItem: createMockMenuItem({ base_price_cents: 2000 }),
        modifiers: [],
        quantity: 1,
        notes: "",
        lineTotalCents: 2000,
      },
    ];

    const result = createStripeLineItems(items, 0);

    expect(result[0].price_data.product_data.description).toBeUndefined();
  });
});

describe("validateCartItems", () => {
  it("returns valid items with calculated line totals", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
    ]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [{ menuItemId: "item-1", quantity: 2, basePriceCents: 1500, modifiers: [], notes: "" }],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].lineTotalCents).toBe(3000); // 1500 * 2
    expect(result.errors).toHaveLength(0);
  });

  it("rejects items not found in menu", async () => {
    const menuItems = new Map();
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [{ menuItemId: "nonexistent", quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("ITEM_UNAVAILABLE");
    expect(result.errors[0].itemIndex).toBe(0);
  });

  it("rejects inactive menu items with ITEM_UNAVAILABLE", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", is_active: false, name_en: "Inactive Item" })],
    ]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [{ menuItemId: "item-1", quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("ITEM_UNAVAILABLE");
    expect(result.errors[0].message).toContain("no longer available");
  });

  it("rejects sold out items with ITEM_SOLD_OUT", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", is_sold_out: true, name_en: "Sold Out Item" })],
    ]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [{ menuItemId: "item-1", quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("ITEM_SOLD_OUT");
    expect(result.errors[0].message).toContain("sold out");
  });

  it("validates modifier options exist", async () => {
    const menuItems = new Map([["item-1", createMockMenuItem({ id: "item-1" })]]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [
        {
          menuItemId: "item-1",
          quantity: 1,
          basePriceCents: 1500,
          modifiers: [{ optionId: "nonexistent", priceDeltaCents: 0 }],
          notes: "",
        },
      ],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MODIFIER_UNAVAILABLE");
  });

  it("rejects inactive modifier options", async () => {
    const menuItems = new Map([["item-1", createMockMenuItem({ id: "item-1" })]]);
    const modifierOptions = new Map([
      ["mod-1", createMockModifierOption({ id: "mod-1", is_active: false, name: "Inactive Mod" })],
    ]);

    const result = await validateCartItems(
      [
        {
          menuItemId: "item-1",
          quantity: 1,
          basePriceCents: 1500,
          modifiers: [{ optionId: "mod-1", priceDeltaCents: 100 }],
          notes: "",
        },
      ],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MODIFIER_UNAVAILABLE");
    expect(result.errors[0].message).toContain("no longer available");
  });

  it("calculates correct line totals with modifiers", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
    ]);
    const modifierOptions = new Map([
      ["mod-1", createMockModifierOption({ id: "mod-1", price_delta_cents: 200 })],
      ["mod-2", createMockModifierOption({ id: "mod-2", price_delta_cents: 100 })],
    ]);

    const result = await validateCartItems(
      [
        {
          menuItemId: "item-1",
          quantity: 2,
          basePriceCents: 1500,
          modifiers: [
            { optionId: "mod-1", priceDeltaCents: 200 },
            { optionId: "mod-2", priceDeltaCents: 100 },
          ],
          notes: "extra sauce",
        },
      ],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(true);
    expect(result.items[0].lineTotalCents).toBe(3600); // (1500 + 200 + 100) * 2
    expect(result.items[0].notes).toBe("extra sauce");
  });

  it("handles items with empty modifiers array", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 2000 })],
    ]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [{ menuItemId: "item-1", quantity: 1, basePriceCents: 2000, modifiers: [], notes: "" }],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(true);
    expect(result.items[0].modifiers).toHaveLength(0);
    expect(result.items[0].lineTotalCents).toBe(2000);
  });

  it("validates multiple items in cart", async () => {
    const menuItems = new Map([
      ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
      ["item-2", createMockMenuItem({ id: "item-2", base_price_cents: 2000, is_sold_out: true })],
      ["item-3", createMockMenuItem({ id: "item-3", base_price_cents: 1000 })],
    ]);
    const modifierOptions = new Map<string, ModifierOptionsRow>();

    const result = await validateCartItems(
      [
        { menuItemId: "item-1", quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" },
        { menuItemId: "item-2", quantity: 1, basePriceCents: 2000, modifiers: [], notes: "" },
        { menuItemId: "item-3", quantity: 2, basePriceCents: 1000, modifiers: [], notes: "" },
      ],
      menuItems,
      modifierOptions
    );

    expect(result.valid).toBe(false);
    expect(result.items).toHaveLength(2); // item-1 and item-3 are valid
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].itemIndex).toBe(1); // item-2 is sold out
  });

  describe("BUG-02: modifier group constraint validation", () => {
    const itemId = "item-1";
    const groupId = "group-spice";

    it("rejects when fewer modifiers than min_select", async () => {
      const menuItems = new Map([
        [itemId, createMockMenuItem({ id: itemId })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();
      const modifierGroups = new Map<string, ModifierGroupWithItems>([
        [groupId, {
          group: createMockModifierGroup({
            id: groupId,
            name: "Spice Level",
            min_select: 1,
            max_select: 3,
          }),
          itemIds: [itemId],
        }],
      ]);

      const result = await validateCartItems(
        [{ menuItemId: itemId, quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions,
        modifierGroups
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("MODIFIER_GROUP_CONSTRAINT");
      expect(result.errors[0].message).toContain("Spice Level");
      expect(result.errors[0].message).toContain("at least 1");
      expect(result.errors[0].message).toContain("got 0");
    });

    it("rejects when more modifiers than max_select", async () => {
      const menuItems = new Map([
        [itemId, createMockMenuItem({ id: itemId })],
      ]);
      const mod1 = createMockModifierOption({ id: "mod-1", group_id: groupId });
      const mod2 = createMockModifierOption({ id: "mod-2", group_id: groupId });
      const mod3 = createMockModifierOption({ id: "mod-3", group_id: groupId });
      const mod4 = createMockModifierOption({ id: "mod-4", group_id: groupId });
      const modifierOptions = new Map([
        ["mod-1", mod1], ["mod-2", mod2], ["mod-3", mod3], ["mod-4", mod4],
      ]);
      const modifierGroups = new Map<string, ModifierGroupWithItems>([
        [groupId, {
          group: createMockModifierGroup({
            id: groupId,
            name: "Toppings",
            min_select: 0,
            max_select: 3,
          }),
          itemIds: [itemId],
        }],
      ]);

      const result = await validateCartItems(
        [{
          menuItemId: itemId,
          quantity: 1,
          basePriceCents: 1500,
          modifiers: [
            { optionId: "mod-1", priceDeltaCents: 100 },
            { optionId: "mod-2", priceDeltaCents: 100 },
            { optionId: "mod-3", priceDeltaCents: 100 },
            { optionId: "mod-4", priceDeltaCents: 100 },
          ],
          notes: "",
        }],
        menuItems,
        modifierOptions,
        modifierGroups
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("MODIFIER_GROUP_CONSTRAINT");
      expect(result.errors[0].message).toContain("Toppings");
      expect(result.errors[0].message).toContain("at most 3");
      expect(result.errors[0].message).toContain("got 4");
    });

    it("passes when selections are within min/max range", async () => {
      const menuItems = new Map([
        [itemId, createMockMenuItem({ id: itemId })],
      ]);
      const mod1 = createMockModifierOption({ id: "mod-1", group_id: groupId });
      const mod2 = createMockModifierOption({ id: "mod-2", group_id: groupId });
      const modifierOptions = new Map([["mod-1", mod1], ["mod-2", mod2]]);
      const modifierGroups = new Map<string, ModifierGroupWithItems>([
        [groupId, {
          group: createMockModifierGroup({
            id: groupId,
            name: "Spice Level",
            min_select: 1,
            max_select: 3,
          }),
          itemIds: [itemId],
        }],
      ]);

      const result = await validateCartItems(
        [{
          menuItemId: itemId,
          quantity: 1,
          basePriceCents: 1500,
          modifiers: [
            { optionId: "mod-1", priceDeltaCents: 100 },
            { optionId: "mod-2", priceDeltaCents: 100 },
          ],
          notes: "",
        }],
        menuItems,
        modifierOptions,
        modifierGroups
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("passes without modifier groups (backward compatible)", async () => {
      const menuItems = new Map([
        [itemId, createMockMenuItem({ id: itemId })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();

      const result = await validateCartItems(
        [{ menuItemId: itemId, quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions
        // No modifierGroups parameter
      );

      expect(result.valid).toBe(true);
    });

    it("ignores groups not associated with the item", async () => {
      const menuItems = new Map([
        [itemId, createMockMenuItem({ id: itemId })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();
      const modifierGroups = new Map<string, ModifierGroupWithItems>([
        [groupId, {
          group: createMockModifierGroup({
            id: groupId,
            name: "Unrelated Group",
            min_select: 1,
            max_select: 3,
          }),
          itemIds: ["other-item-id"], // Not our item
        }],
      ]);

      const result = await validateCartItems(
        [{ menuItemId: itemId, quantity: 1, basePriceCents: 1500, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions,
        modifierGroups
      );

      expect(result.valid).toBe(true);
    });
  });
});
