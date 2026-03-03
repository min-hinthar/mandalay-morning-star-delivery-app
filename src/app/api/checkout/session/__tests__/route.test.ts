import { describe, expect, it } from "vitest";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { createMockMenuItem, createMockModifierOption } from "@/test/factories";
import { validateCartItems, calculateOrderTotals, createStripeLineItems } from "@/lib/utils/order";
import type { MenuItemsRow, ModifierOptionsRow } from "@/types/database";

/**
 * Integration tests for checkout session validation logic
 *
 * Note: Full API route testing with mocked Supabase/Stripe is complex.
 * These tests focus on the validation and business logic that the route uses.
 * Full flow testing is covered by E2E tests.
 */

describe("Checkout Session Validation", () => {
  describe("createCheckoutSessionSchema", () => {
    const validBody = {
      addressId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      scheduledDate: "2026-01-18",
      timeWindowStart: "11:00",
      timeWindowEnd: "12:00",
      items: [
        {
          menuItemId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          quantity: 2,
          modifiers: [],
          notes: "",
        },
      ],
      customerNotes: "Ring doorbell",
    };

    it("accepts valid checkout body", () => {
      const result = createCheckoutSessionSchema.safeParse(validBody);
      expect(result.success).toBe(true);
    });

    it("rejects missing addressId", () => {
      const { addressId: _addressId, ...body } = validBody;
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects invalid addressId format (not UUID)", () => {
      const body = { ...validBody, addressId: "not-a-uuid" };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects empty items array", () => {
      const body = { ...validBody, items: [] };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 items", () => {
      const manyItems = Array(51).fill(validBody.items[0]);
      const body = { ...validBody, items: manyItems };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format (MM-DD-YYYY)", () => {
      const body = { ...validBody, scheduledDate: "01-18-2026" };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format (HH:MM AM)", () => {
      const body = { ...validBody, timeWindowStart: "11:00 AM" };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects quantity below 1", () => {
      const body = {
        ...validBody,
        items: [{ ...validBody.items[0], quantity: 0 }],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects quantity above 50", () => {
      const body = {
        ...validBody,
        items: [{ ...validBody.items[0], quantity: 51 }],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects notes exceeding 500 characters", () => {
      const body = {
        ...validBody,
        items: [{ ...validBody.items[0], notes: "a".repeat(501) }],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects customerNotes exceeding 1000 characters", () => {
      const body = { ...validBody, customerNotes: "a".repeat(1001) };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("allows optional customerNotes", () => {
      const { customerNotes: _customerNotes, ...body } = validBody;
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("allows optional item notes", () => {
      const body = {
        ...validBody,
        items: [{ ...validBody.items[0], notes: undefined }],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("validates modifier optionId as UUID", () => {
      const body = {
        ...validBody,
        items: [
          {
            ...validBody.items[0],
            modifiers: [{ optionId: "not-a-uuid" }],
          },
        ],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    // CHKT-01: Server-authoritative pricing — schema no longer accepts price fields
    it("strips basePriceCents from items (server-authoritative pricing)", () => {
      const body = {
        ...validBody,
        items: [{ ...validBody.items[0], basePriceCents: 9999 }],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("basePriceCents" in result.data.items[0]).toBe(false);
      }
    });

    it("strips priceDeltaCents from modifiers (server-authoritative pricing)", () => {
      const body = {
        ...validBody,
        items: [
          {
            ...validBody.items[0],
            modifiers: [
              {
                optionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                priceDeltaCents: 500,
              },
            ],
          },
        ],
      };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("priceDeltaCents" in result.data.items[0].modifiers[0]).toBe(false);
      }
    });

    // New optional fields
    it("accepts optional tipCents", () => {
      const body = { ...validBody, tipCents: 500 };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("rejects negative tipCents", () => {
      const body = { ...validBody, tipCents: -100 };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects tipCents over $1000", () => {
      const body = { ...validBody, tipCents: 100_001 };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("accepts optional promoCode", () => {
      const body = { ...validBody, promoCode: "SAVE10" };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("rejects promoCode over 50 chars", () => {
      const body = { ...validBody, promoCode: "a".repeat(51) };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("accepts optional deliveryInstructions", () => {
      const body = { ...validBody, deliveryInstructions: "Leave at gate" };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("rejects deliveryInstructions over 500 chars", () => {
      const body = { ...validBody, deliveryInstructions: "a".repeat(501) };
      const result = createCheckoutSessionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });

  describe("Cart Validation Logic", () => {
    it("validates items against menu database", async () => {
      const menuItems = new Map<string, MenuItemsRow>([
        ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();

      const result = await validateCartItems(
        [{ menuItemId: "item-1", quantity: 2, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions
      );

      expect(result.valid).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].lineTotalCents).toBe(3000);
    });

    it("rejects items not in menu", async () => {
      const menuItems = new Map<string, MenuItemsRow>();
      const modifierOptions = new Map<string, ModifierOptionsRow>();

      const result = await validateCartItems(
        [{ menuItemId: "nonexistent", quantity: 1, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("ITEM_UNAVAILABLE");
    });

    it("rejects inactive items", async () => {
      const menuItems = new Map<string, MenuItemsRow>([
        ["item-1", createMockMenuItem({ id: "item-1", is_active: false })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();

      const result = await validateCartItems(
        [{ menuItemId: "item-1", quantity: 1, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("ITEM_UNAVAILABLE");
    });

    it("rejects sold out items", async () => {
      const menuItems = new Map<string, MenuItemsRow>([
        ["item-1", createMockMenuItem({ id: "item-1", is_sold_out: true })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>();

      const result = await validateCartItems(
        [{ menuItemId: "item-1", quantity: 1, modifiers: [], notes: "" }],
        menuItems,
        modifierOptions
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("ITEM_SOLD_OUT");
    });

    it("validates modifiers exist and are active", async () => {
      const menuItems = new Map<string, MenuItemsRow>([
        ["item-1", createMockMenuItem({ id: "item-1" })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>([
        ["mod-1", createMockModifierOption({ id: "mod-1", is_active: true })],
        ["mod-2", createMockModifierOption({ id: "mod-2", is_active: false })],
      ]);

      // Valid modifier
      const validResult = await validateCartItems(
        [
          {
            menuItemId: "item-1",
            quantity: 1,
            modifiers: [{ optionId: "mod-1" }],
            notes: "",
          },
        ],
        menuItems,
        modifierOptions
      );
      expect(validResult.valid).toBe(true);

      // Inactive modifier
      const inactiveResult = await validateCartItems(
        [
          {
            menuItemId: "item-1",
            quantity: 1,
            modifiers: [{ optionId: "mod-2" }],
            notes: "",
          },
        ],
        menuItems,
        modifierOptions
      );
      expect(inactiveResult.valid).toBe(false);
      expect(inactiveResult.errors[0].code).toBe("MODIFIER_UNAVAILABLE");
    });
  });

  describe("Order Totals Calculation", () => {
    it("calculates correct totals with delivery fee", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 2000 }),
          modifiers: [],
          quantity: 2,
          notes: "",
          lineTotalCents: 4000,
        },
      ];

      const totals = calculateOrderTotals(items);

      expect(totals.subtotalCents).toBe(4000);
      expect(totals.deliveryFeeCents).toBe(1500); // Below $100 threshold
      expect(totals.taxCents).toBe(0);
      expect(totals.tipCents).toBe(0);
      expect(totals.discountCents).toBe(0);
      expect(totals.totalCents).toBe(5500);
    });

    it("waives delivery fee at $100 threshold", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 10000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 10000,
        },
      ];

      const totals = calculateOrderTotals(items);

      expect(totals.subtotalCents).toBe(10000);
      expect(totals.deliveryFeeCents).toBe(0);
      expect(totals.totalCents).toBe(10000);
    });

    it("includes tip in total", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 5000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 5000,
        },
      ];

      const totals = calculateOrderTotals(items, 1500, 10000, 500);

      expect(totals.subtotalCents).toBe(5000);
      expect(totals.deliveryFeeCents).toBe(1500);
      expect(totals.tipCents).toBe(500);
      expect(totals.discountCents).toBe(0);
      // 5000 + 1500 + 0 + 500 - 0 = 7000
      expect(totals.totalCents).toBe(7000);
    });

    it("subtracts discount from total", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 5000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 5000,
        },
      ];

      const totals = calculateOrderTotals(items, 1500, 10000, 0, 2000);

      expect(totals.subtotalCents).toBe(5000);
      expect(totals.discountCents).toBe(2000);
      // 5000 + 1500 + 0 + 0 - 2000 = 4500
      expect(totals.totalCents).toBe(4500);
    });

    it("includes tip and discount together", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 5000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 5000,
        },
      ];

      const totals = calculateOrderTotals(items, 1500, 10000, 500, 2000);

      // 5000 + 1500 + 0 + 500 - 2000 = 5000
      expect(totals.totalCents).toBe(5000);
    });

    it("clamps total to 0 when discount exceeds subtotal", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 1000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 1000,
        },
      ];

      const totals = calculateOrderTotals(items, 0, 10000, 0, 50000);

      expect(totals.totalCents).toBe(0);
    });
  });

  describe("Stripe Line Items", () => {
    it("creates correct line items for Stripe", () => {
      const items = [
        {
          menuItem: createMockMenuItem({
            name_en: "Mohinga",
            base_price_cents: 1500,
          }),
          modifiers: [createMockModifierOption({ name: "Extra Fish", price_delta_cents: 200 })],
          quantity: 2,
          notes: "",
          lineTotalCents: 3400,
        },
      ];

      const lineItems = createStripeLineItems(items, 1500);

      expect(lineItems).toHaveLength(2); // Item + delivery fee
      expect(lineItems[0].price_data.unit_amount).toBe(1700); // 1500 + 200
      expect(lineItems[0].price_data.product_data.name).toBe("Mohinga");
      expect(lineItems[0].price_data.product_data.description).toBe("Extra Fish");
      expect(lineItems[0].quantity).toBe(2);
      expect(lineItems[1].price_data.unit_amount).toBe(1500);
      expect(lineItems[1].price_data.product_data.name).toBe("Delivery Fee");
    });

    it("omits delivery fee line item when free", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 10000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 10000,
        },
      ];

      const lineItems = createStripeLineItems(items, 0);

      expect(lineItems).toHaveLength(1);
      expect(
        lineItems.find((i) => i.price_data.product_data.name === "Delivery Fee")
      ).toBeUndefined();
    });

    it("adds tip as Stripe line item when tipCents > 0", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 1500 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 1500,
        },
      ];

      const lineItems = createStripeLineItems(items, 1500, 300);

      expect(lineItems).toHaveLength(3); // Item + delivery + tip
      const tipItem = lineItems.find((i) => i.price_data.product_data.name === "Tip");
      expect(tipItem).toBeDefined();
      expect(tipItem!.price_data.unit_amount).toBe(300);
      expect(tipItem!.quantity).toBe(1);
    });

    it("omits tip line item when tipCents is 0", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 1500 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 1500,
        },
      ];

      const lineItems = createStripeLineItems(items, 1500, 0);

      expect(lineItems).toHaveLength(2); // Item + delivery
      expect(lineItems.find((i) => i.price_data.product_data.name === "Tip")).toBeUndefined();
    });
  });
});

describe("Checkout Session Business Rules", () => {
  describe("Price Calculation Security", () => {
    it("server calculates prices from DB - not from client input", async () => {
      const menuItems = new Map<string, MenuItemsRow>([
        ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
      ]);
      const modifierOptions = new Map<string, ModifierOptionsRow>([
        ["mod-1", createMockModifierOption({ id: "mod-1", price_delta_cents: 200 })],
      ]);

      // Client sends no prices — server resolves from DB
      const result = await validateCartItems(
        [
          {
            menuItemId: "item-1",
            quantity: 3,
            modifiers: [{ optionId: "mod-1" }],
            notes: "",
          },
        ],
        menuItems,
        modifierOptions
      );

      // Line total is calculated from DB prices: (1500 + 200) * 3 = 5100
      expect(result.items[0].lineTotalCents).toBe(5100);
    });
  });

  describe("Delivery Fee Threshold", () => {
    it("charges $15 below $100 subtotal", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 9999 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 9999,
        },
      ];

      const totals = calculateOrderTotals(items);
      expect(totals.deliveryFeeCents).toBe(1500);
    });

    it("free delivery at exactly $100", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 10000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 10000,
        },
      ];

      const totals = calculateOrderTotals(items);
      expect(totals.deliveryFeeCents).toBe(0);
    });

    it("free delivery above $100", () => {
      const items = [
        {
          menuItem: createMockMenuItem({ base_price_cents: 15000 }),
          modifiers: [],
          quantity: 1,
          notes: "",
          lineTotalCents: 15000,
        },
      ];

      const totals = calculateOrderTotals(items);
      expect(totals.deliveryFeeCents).toBe(0);
    });
  });
});
