# Data Schema Learnings

## Menu Items: Allergen Data — Single Source of Truth

**Context:** Originally `tags[]` included `contains_*` duplicates of `allergens[]`. Phase 90 (2026-03-03) removed all 23 redundant `contains_*` tags from seed YAML and added allergen validation to the seed script.

**Learning:** After Phase 90, allergen data has a single source:

- `allergens[]`: Canonical keys from `allergens_enum` in seed YAML — `['egg', 'fish', 'peanuts']`
- `tags[]`: Dietary/marketing labels only — `['popular', 'spicy', 'vegetarian']` (no `contains_*`)

Use `item.allergens` + `ALLERGEN_MAP` (`src/lib/constants/allergens.ts`) for allergen display. Tags are safe to render as-is without filtering.

**Supersedes:** Previous entry about filtering `contains_*` from tags — no longer needed.

**Apply when:** Rendering allergens or tags on menu items.

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

---

## PostgREST Ambiguous FK Hints Required

**Context:** `orders` table has two FKs to `profiles`: `user_id` (customer) and `contacted_by` (admin who contacted). PostgREST failed on every un-hinted `profiles` join.

**Learning:** When a table has multiple FKs to the same target, PostgREST requires explicit FK hints in the select string. This project's known ambiguous joins:

| Source Table | Target | FK Hint |
|-------------|--------|---------|
| `orders` | `profiles` | `profiles!orders_user_id_fkey` |
| `orders` | `addresses` | `addresses!orders_address_id_fkey` |

**Affected routes (all fixed 2026-03-02):**
- `api/admin/orders`, `api/admin/orders/[id]/details`, `api/admin/ops/orders`
- `api/admin/routes/builder-orders`, `api/admin/routes/[id]`
- `api/admin/drivers/[id]/ratings`
- `(driver)/driver/route/page.tsx`, `(driver)/driver/route/[stopId]/page.tsx`

**Prevention:** When adding a new FK to any table, run:
```bash
grep -rn 'from.*TABLE_NAME' src/app/api/ --include='*.ts' | grep 'select'
```
Add FK hints to every query joining the target table.

**Apply when:** Adding new FK columns or writing Supabase queries that join tables with multiple FK relationships.
