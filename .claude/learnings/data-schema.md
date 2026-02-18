# Data Schema Learnings

## Menu Items: Allergen Data Duplication

**Context:** SearchResultCard was showing `contains_egg`, `contains_peanuts` as tag badges, duplicating allergen info.

**Learning:** The `menu_items` table stores allergen info in **two columns**:

- `allergens`: Clean keys matching `ALLERGEN_MAP` — `['egg', 'fish', 'peanuts']`
- `tags`: Includes `contains_*` prefixed duplicates — `['contains_egg', 'contains_fish', 'popular']`

When rendering `item.tags` as UI badges, always filter out `contains_*`:

```ts
const dietaryTags = item.tags.filter(
  (t) => t !== "popular" && t !== "featured" && !t.startsWith("contains_")
);
```

Use `item.allergens` + `ALLERGEN_MAP` (`src/lib/constants/allergens.ts`) for allergen display.

**Apply when:** Rendering menu item tags in any new component.

---

## Fuse.js Search Tuning for Menu Dataset

**Context:** Fuse.js with threshold 0.4 / score filter 0.7 returned too many loose matches for ~78 menu items.

**Learning:** For this menu dataset (short Burmese dish names, ~78 items):

- `threshold: 0.2` — strict, near-exact only. "mohiga" still matches "Mohinga"
- `distance: 100` — focused match window
- `SCORE_THRESHOLD: 0.35` — filters weak matches aggressively
- Don't search on `allergens` key — noise, no user value

Config: `src/lib/search/search-config.ts`

**Apply when:** Adjusting search behavior or adding new search fields.
