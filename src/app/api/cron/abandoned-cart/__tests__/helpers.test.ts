import { describe, expect, it } from "vitest";

import type { ServerCartItem } from "@/app/api/cart/schemas";
import { amountToFreeDelivery, mapCartItemsToEmail } from "../helpers";

const baseItem: ServerCartItem = {
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
      optionName: "Extra Egg",
      priceDeltaCents: 150,
    },
  ],
  notes: "no cilantro",
  addedAt: "2026-05-30T00:00:00.000Z",
};

describe("mapCartItemsToEmail", () => {
  it("maps line totals (base + modifiers) * qty and modifier labels", () => {
    const [mapped] = mapCartItemsToEmail([baseItem]);
    expect(mapped.name).toBe("Mohinga");
    expect(mapped.nameMy).toBe("မုန့်ဟင်းခါး");
    expect(mapped.lineTotalCents).toBe((1200 + 150) * 2); // 2700
    expect(mapped.modifiers).toEqual([{ name: "Extra Egg", priceDelta: 150 }]);
    expect(mapped.notes).toBe("no cilantro");
  });

  it("nulls out empty notes", () => {
    const [mapped] = mapCartItemsToEmail([{ ...baseItem, notes: "" }]);
    expect(mapped.notes).toBeNull();
  });
});

describe("amountToFreeDelivery", () => {
  it("returns the remaining cents to the threshold", () => {
    expect(amountToFreeDelivery(6300, 10000)).toBe(3700);
  });
  it("clamps to 0 once the threshold is reached", () => {
    expect(amountToFreeDelivery(12000, 10000)).toBe(0);
  });
});
