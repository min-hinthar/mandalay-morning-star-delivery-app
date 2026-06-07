import { describe, it, expect } from "vitest";
import {
  MENU_DIETARY_FILTERS,
  itemMatchesDietaryFilter,
  itemMatchesDietaryFilters,
  countMatchingItems,
  availableDietaryFilters,
  hasFreeFromSelected,
  ALLERGEN_REVIEWED_TAG,
} from "./dietary-filters";
import type { MenuItem } from "@/types/menu";

// Only tags + allergens are read by the filter functions.
const mk = (tags: string[], allergens: string[]) => ({ tags, allergens }) as unknown as MenuItem;
const def = (id: string) => {
  const d = MENU_DIETARY_FILTERS.find((f) => f.id === id);
  if (!d) throw new Error(`no filter ${id}`);
  return d;
};

describe("free-from fail-safe", () => {
  const glutenFree = def("gluten-free");

  it("matches when a declared allergen list omits the excluded one", () => {
    expect(itemMatchesDietaryFilter(mk([], ["shellfish"]), glutenFree)).toBe(true);
  });

  it("excludes when the declared allergens include the excluded one", () => {
    expect(itemMatchesDietaryFilter(mk([], ["gluten_wheat"]), glutenFree)).toBe(false);
  });

  it("EXCLUDES an item with no declared allergens (unknown ≠ free-from)", () => {
    expect(itemMatchesDietaryFilter(mk([], []), glutenFree)).toBe(false);
  });

  it("includes an empty-allergen item only when allergen-reviewed", () => {
    expect(itemMatchesDietaryFilter(mk([ALLERGEN_REVIEWED_TAG], []), glutenFree)).toBe(true);
  });

  it("the allergen-reviewed gate is case-insensitive", () => {
    expect(itemMatchesDietaryFilter(mk(["Allergen-Reviewed"], []), glutenFree)).toBe(true);
  });

  it("a reviewed item with a declared allergen still respects it", () => {
    expect(
      itemMatchesDietaryFilter(mk([ALLERGEN_REVIEWED_TAG], ["peanuts"]), def("nut-free"))
    ).toBe(false);
  });
});

describe("tag filters", () => {
  it("vegan matches vegan + vegan-optional, not vegetarian", () => {
    expect(itemMatchesDietaryFilter(mk(["vegan"], []), def("vegan"))).toBe(true);
    expect(itemMatchesDietaryFilter(mk(["vegan-optional"], []), def("vegan"))).toBe(true);
    expect(itemMatchesDietaryFilter(mk(["vegetarian"], []), def("vegan"))).toBe(false);
  });

  it("vegetarian matches vegetarian + vegan, not vegan-optional", () => {
    expect(itemMatchesDietaryFilter(mk(["vegan"], []), def("vegetarian"))).toBe(true);
    expect(itemMatchesDietaryFilter(mk(["vegan-optional"], []), def("vegetarian"))).toBe(false);
  });
});

describe("itemMatchesDietaryFilters (AND)", () => {
  it("requires every selected filter to pass", () => {
    const reviewedVegan = mk(["vegan", ALLERGEN_REVIEWED_TAG], []);
    expect(itemMatchesDietaryFilters(reviewedVegan, ["vegan", "gluten-free"])).toBe(true);
    // vegan but NOT allergen-reviewed → not gluten-free → fails the AND
    expect(itemMatchesDietaryFilters(mk(["vegan"], []), ["vegan", "gluten-free"])).toBe(false);
  });

  it("no filters selected = matches everything", () => {
    expect(itemMatchesDietaryFilters(mk([], []), [])).toBe(true);
  });
});

describe("counts + availability + hasFreeFromSelected", () => {
  const items = [mk([ALLERGEN_REVIEWED_TAG], []), mk([], ["peanuts"])];

  it("counts only matching items (peanut dish excluded from nut-free)", () => {
    expect(countMatchingItems(items, def("nut-free"))).toBe(1);
  });

  it("availableDietaryFilters surfaces filters with ≥1 match", () => {
    const ids = availableDietaryFilters(items).map((f) => f.def.id);
    expect(ids).toContain("nut-free");
    expect(ids).not.toContain("vegan"); // neither item is vegan
  });

  it("hasFreeFromSelected flags allergen filters only", () => {
    expect(hasFreeFromSelected(["vegan"])).toBe(false);
    expect(hasFreeFromSelected(["gluten-free"])).toBe(true);
  });
});
