import type { MenuItem } from "@/types/menu";

/**
 * Menu dietary filter model.
 *
 * Two kinds of filter:
 * - `free-from` — DERIVED from the restaurant's own per-item allergen
 *   declarations (`item.allergens`). Safe + accurate: an item passes when its
 *   declared allergens don't include the excluded one(s). (Empty allergens =
 *   "none declared" per the seed, so it passes.)
 * - `tag` — matches only items EXPLICITLY tagged (vegetarian/vegan/spicy…).
 *   These are NOT auto-derived; veg/vegan/halal stay hidden until the owner
 *   supplies ground truth (we never fabricate a dietary claim).
 *
 * The UI hides any filter with zero matching items, so unpopulated tag filters
 * simply don't appear yet.
 */

export type DietaryFilterKind = "free-from" | "tag";

export interface DietaryFilterDef {
  id: string;
  label: string;
  emoji: string;
  kind: DietaryFilterKind;
  /** free-from: allergen keys (ALLERGEN_MAP) the item must NOT contain */
  excludesAllergens?: string[];
  /** tag: any of these tag tokens marks the item */
  tagAny?: string[];
}

export const MENU_DIETARY_FILTERS: DietaryFilterDef[] = [
  // ---- Allergen-derived "free-from" (real, from declared allergen data) ----
  {
    id: "gluten-free",
    label: "Gluten-free",
    emoji: "🌾",
    kind: "free-from",
    excludesAllergens: ["gluten_wheat"],
  },
  {
    id: "nut-free",
    label: "Nut-free",
    emoji: "🥜",
    kind: "free-from",
    excludesAllergens: ["peanuts", "tree_nuts"],
  },
  {
    id: "dairy-free",
    label: "Dairy-free",
    emoji: "🥛",
    kind: "free-from",
    excludesAllergens: ["dairy"],
  },
  { id: "egg-free", label: "Egg-free", emoji: "🥚", kind: "free-from", excludesAllergens: ["egg"] },
  { id: "soy-free", label: "Soy-free", emoji: "🫛", kind: "free-from", excludesAllergens: ["soy"] },
  {
    id: "shellfish-free",
    label: "Shellfish-free",
    emoji: "🦐",
    kind: "free-from",
    excludesAllergens: ["shellfish"],
  },
  {
    id: "fish-free",
    label: "Fish-free",
    emoji: "🐟",
    kind: "free-from",
    excludesAllergens: ["fish"],
  },
  // ---- Tag-based (explicit owner-confirmed tags only) ----
  // Halal intentionally omitted: meat is depot-sourced but not halal-certified.
  // Vegan dishes also satisfy Vegetarian (a vegan dish is vegetarian).
  {
    id: "vegetarian",
    label: "Vegetarian",
    emoji: "🌱",
    kind: "tag",
    tagAny: ["vegetarian", "vegan"],
  },
  { id: "vegan", label: "Vegan", emoji: "🌿", kind: "tag", tagAny: ["vegan"] },
  {
    id: "spicy",
    label: "Spicy",
    emoji: "🌶️",
    kind: "tag",
    tagAny: ["spicy", "very-spicy", "extra-spicy"],
  },
];

const FILTER_BY_ID = new Map(MENU_DIETARY_FILTERS.map((f) => [f.id, f]));

/** Does a single item satisfy one dietary filter? */
export function itemMatchesDietaryFilter(item: MenuItem, def: DietaryFilterDef): boolean {
  if (def.kind === "free-from") {
    const declared = item.allergens.map((a) => a.toLowerCase());
    return !(def.excludesAllergens ?? []).some((a) => declared.includes(a));
  }
  const tags = item.tags.map((t) => t.toLowerCase());
  return (def.tagAny ?? []).some((t) => tags.includes(t));
}

/** AND logic across active filter ids (unknown ids are ignored). */
export function itemMatchesDietaryFilters(item: MenuItem, filterIds: string[]): boolean {
  if (filterIds.length === 0) return true;
  return filterIds.every((id) => {
    const def = FILTER_BY_ID.get(id);
    return def ? itemMatchesDietaryFilter(item, def) : true;
  });
}

/** Count how many of `items` satisfy a filter on its own. */
export function countMatchingItems(items: MenuItem[], def: DietaryFilterDef): number {
  return items.reduce((n, item) => n + (itemMatchesDietaryFilter(item, def) ? 1 : 0), 0);
}

/** Filters that have at least one matching item, with their counts. */
export function availableDietaryFilters(
  items: MenuItem[]
): { def: DietaryFilterDef; count: number }[] {
  return MENU_DIETARY_FILTERS.map((def) => ({ def, count: countMatchingItems(items, def) })).filter(
    (f) => f.count > 0
  );
}
