import { describe, expect, it } from "vitest";
import { calculateItemPrice, validateModifierSelection } from "../price";
import type { MenuItem } from "@/types/menu";

const baseItem: MenuItem = {
  id: "item-1",
  slug: "kyay-o",
  nameEn: "Kyay-O",
  nameMy: null,
  descriptionEn: null,
  imageUrl: null,
  basePriceCents: 1500,
  isActive: true,
  isSoldOut: false,
  tags: [],
  allergens: [],
  modifierGroups: [],
};

describe("calculateItemPrice", () => {
  it("calculates base price correctly", () => {
    const result = calculateItemPrice(baseItem, [], 1);
    expect(result.totalCents).toBe(1500);
  });

  it("adds modifier price deltas", () => {
    const result = calculateItemPrice(
      baseItem,
      [
        {
          groupId: "g1",
          groupName: "Protein",
          optionId: "o1",
          optionName: "Chicken",
          priceDeltaCents: 200,
        },
      ],
      1
    );
    expect(result.totalCents).toBe(1700);
  });

  it("multiplies by quantity", () => {
    const result = calculateItemPrice(baseItem, [], 3);
    expect(result.totalCents).toBe(4500);
  });
});

describe("validateModifierSelection", () => {
  it("requires selection for required groups", () => {
    const item: MenuItem = {
      ...baseItem,
      modifierGroups: [
        {
          id: "g1",
          slug: "protein",
          name: "Protein",
          selectionType: "single",
          minSelect: 1,
          maxSelect: 1,
          options: [
            {
              id: "o1",
              slug: "chicken",
              name: "Chicken",
              priceDeltaCents: 0,
              isActive: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    const result = validateModifierSelection(item, []);
    expect(result.isValid).toBe(false);
  });

  it("enforces max selection", () => {
    const item: MenuItem = {
      ...baseItem,
      modifierGroups: [
        {
          id: "g1",
          slug: "toppings",
          name: "Toppings",
          selectionType: "multiple",
          minSelect: 0,
          maxSelect: 2,
          options: [
            {
              id: "o1",
              slug: "extra-chili",
              name: "Extra chili",
              priceDeltaCents: 0,
              isActive: true,
              sortOrder: 1,
            },
            {
              id: "o2",
              slug: "extra-garlic",
              name: "Extra garlic",
              priceDeltaCents: 0,
              isActive: true,
              sortOrder: 2,
            },
            {
              id: "o3",
              slug: "extra-onion",
              name: "Extra onion",
              priceDeltaCents: 0,
              isActive: true,
              sortOrder: 3,
            },
          ],
        },
      ],
    };

    const result = validateModifierSelection(item, [
      {
        groupId: "g1",
        groupName: "Toppings",
        optionId: "o1",
        optionName: "Extra chili",
        priceDeltaCents: 0,
      },
      {
        groupId: "g1",
        groupName: "Toppings",
        optionId: "o2",
        optionName: "Extra garlic",
        priceDeltaCents: 0,
      },
      {
        groupId: "g1",
        groupName: "Toppings",
        optionId: "o3",
        optionName: "Extra onion",
        priceDeltaCents: 0,
      },
    ]);

    expect(result.isValid).toBe(false);
  });
});
