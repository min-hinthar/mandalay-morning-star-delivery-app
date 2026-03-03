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

---

## PostgreSQL IMMUTABLE Required for Index Expressions

**Context:** Migration 035 created a unique partial index using `delivery_window_start::date` to prevent duplicate orders per user per Saturday. Failed with `ERROR: 42P17: functions in index expression must be marked IMMUTABLE`.

**Learning:** `timestamptz::date` is STABLE (depends on `timezone` session variable), not IMMUTABLE. PostgreSQL requires IMMUTABLE functions in index expressions. Wrap in an IMMUTABLE function that pins the timezone:

```sql
CREATE OR REPLACE FUNCTION public.delivery_date(ts TIMESTAMPTZ)
RETURNS DATE LANGUAGE SQL IMMUTABLE
AS $$ SELECT (ts AT TIME ZONE 'America/Los_Angeles')::date $$;

CREATE UNIQUE INDEX idx_orders_user_delivery_date
  ON orders (user_id, delivery_date(delivery_window_start))
  WHERE status != 'cancelled';
```

**Caveat:** Marking timezone conversion as IMMUTABLE is technically a lie (it pins to one timezone). Safe when the business operates in a single timezone. If timezone changes, the index must be rebuilt.

**Apply when:** Creating indexes on expressions involving `timestamptz` → `date`/`time` casts, or any timezone-dependent function.

---

## Modifier Option Slugs: Group-Prefixed for Uniqueness

**Context:** `modifier_options.slug` has a UNIQUE constraint. Multiple modifier groups can have options with the same base slug (e.g., "original" in both `goat_curry_cut` and `chicken_curry_style`).

**Learning:** The seed script (`scripts/seed-menu.ts`) uses `buildOptionSlug(groupSlug, optionSlug)` → `{groupSlug}__{optionSlug}` (double underscore separator). When writing raw SQL inserts for modifier options, always prefix:

```sql
-- WRONG: will collide
INSERT INTO modifier_options (slug) VALUES ('original');

-- RIGHT: group-prefixed
INSERT INTO modifier_options (slug) VALUES ('goat_curry_cut__original');
INSERT INTO modifier_options (slug) VALUES ('chicken_curry_style__original');
```

**Apply when:** Writing SQL seeds or migrations that insert modifier options directly.
