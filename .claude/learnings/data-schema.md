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

**Context:** Multiple cases of PostgREST FK ambiguity in this project.

**Learning:** When a table has multiple FKs to the same target, PostgREST requires explicit FK hints. Known ambiguous joins:

| Source Table | Target | FK Hint |
|-------------|--------|---------|
| `orders` | `profiles` | `profiles!orders_user_id_fkey` |
| `orders` | `addresses` | `addresses!orders_address_id_fkey` |
| `routes` | `drivers` | `drivers!routes_driver_id_fkey` (main), `drivers!routes_declined_by_fkey` (declined) |

**Critical: adding a 2nd FK breaks ALL existing queries.** When `declined_by` FK was added to `routes→drivers` (migration 20260316), every existing unqualified `drivers (` join on the `routes` table failed with PGRST201. Fixed in 4 files: `api/admin/routes/route.ts`, `api/admin/routes/[id]/route.ts`, `api/admin/analytics/delivery/route.ts`, `api/admin/ops/routes-progress/route.ts`.

**FK to `auth.users` ≠ FK to `profiles`:** `customer_feedback.user_id → auth.users(id)` does NOT allow joining `profiles` table. PostgREST returns PGRST200 ("no relationship found") because no FK path exists from `customer_feedback` to `profiles`. Must query `*` only and use `contact_email` for display.

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

---

## Kitchen Coordinates: Single Canonical Source

**Context:** Originally three different lat/lng coordinates hardcoded across the codebase. Consolidated in 2026-03-10 to `KITCHEN_ORIGIN` in route-optimization/types.ts. Unified again in 2026-03-11 to eliminate the `KITCHEN_LOCATION` / `KITCHEN_ORIGIN` duplication (different property names: `lat/lng` vs `latitude/longitude`).

**Learning:** `KITCHEN_COORDS` in `src/lib/constants/kitchen.ts` is the single source of truth (750 Terrado Plaza, Covina CA: `34.0894, -117.8897`). Uses `{ lat, lng }` shape. Zero imports — safe for client bundles.

```typescript
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";
```

Legacy re-exports exist for backward compat:
- `KITCHEN_LOCATION` re-exported from `src/types/address.ts` (same object, aliased name)

**Note:** `KITCHEN_COORDS` uses `as const`, which narrows `lat`/`lng` to literal types. When assigning to mutable variables, annotate explicitly: `let currentLat: number = KITCHEN_COORDS.lat`.

**Supersedes:** Previous entry about importing `KITCHEN_ORIGIN` from `route-optimization/types.ts`.

**Apply when:** Adding any code that references the kitchen/restaurant location (maps, clustering, tracking, ETA calculations, coverage checks).

---

## Orders: Denormalized Contact Info

**Context:** `customer_phone` and `customer_name` added to `orders` table (migration `20260310`). Previously contact info only lived in `profiles` table, requiring a join. Admin/driver APIs now prefer order-level fields over profile fields.

**Learning:** Order contact fields are denormalized snapshots captured at checkout time:
- `orders.customer_phone` / `orders.customer_name` — from checkout form input
- `profiles.phone` / `profiles.full_name` — canonical profile (may be updated later)

Query pattern for display:
```typescript
customerName: order.customer_name ?? order.profiles?.full_name ?? null,
customerPhone: order.customer_phone ?? order.profiles?.phone ?? null,
```

The `create_order_with_items` RPC reads these from `p_order->>'customer_phone'` / `p_order->>'customer_name'`.

**Apply when:** Querying customer contact info for orders, or modifying the checkout RPC payload.

---

## Delivery Zones: Bearing-Based Direction Routing

**Context:** Direction-based delivery implemented (2026-03-11). Delivery days have optional `direction` column (`east`/`west`/`south`/`all`). `delivery_zones` table stores bearing ranges from kitchen origin. `distance_miles` stored on `addresses` and `orders` for fee tier calculation.

**Learning:** Key schema additions:
- `delivery_days.direction` — which compass zone that day serves (`all` = Saturday)
- `delivery_zones` — bearing ranges per direction (e.g., East = 350°-80°), admin-editable
- `addresses.distance_miles` / `orders.distance_miles` — cached driving distance from kitchen
- `app_settings`: `long_distance_fee_cents` (2000), `long_distance_threshold_miles` (25)

Zone logic in `src/lib/utils/delivery-zones.ts`: `calculateBearing()` → `getDirectionsForCoords()` → `filterDaysByDirection()`. Gap zones (between defined bearing ranges) match both adjacent directions.

**Nearby radius bypass (2026-03-13):** Addresses within 15mi (`NEARBY_RADIUS_KM = 24.14`) of kitchen skip direction filtering entirely — `getDirectionsForCoords()` returns `[]`. Both consumers handle `[]` correctly: `TimeStepV8` shows all 4 days, `DeliveryZoneInfoCard` hides (no misleading "Route: East"). Direction filtering only applies to distant addresses where route logistics matter.

**Apply when:** Modifying delivery day logic, fee calculation, or zone configuration.

---

## Supabase Generated Types: New RPC Functions Need Manual Type Entries

**Context:** Added 3 SQL RPC functions (`batch_update_stop_indices`, `reindex_route_stops`, `update_route_stats`) via migration. `supabase.rpc("fn_name")` failed typecheck because `database.ts` Functions block didn't include them.

**Learning:** When adding SQL functions via migration, manually add type entries to `src/types/database.ts` under the `Functions:` block (alphabetically sorted). Format:

```typescript
function_name: {
  Args: { param_name: type };
  Returns: return_type; // use `undefined` for void functions, `Json` for jsonb
};
```

For `void` SQL returns, use `Returns: undefined`. For `jsonb`, use `Returns: Json`. Array params map to `type[]` (e.g., `uuid[]` → `string[]`).

**Apply when:** Adding new SQL functions/RPCs before regenerating Supabase types.

---

## Route Pipeline: Cross-Table Uniqueness via Trigger (Not Partial Index)

**Context:** `route_stops` needed to prevent an order from being in multiple active (non-completed) routes. Tried a partial unique index with a SQL function referencing the parent `routes` table — failed because PostgreSQL index predicates must be IMMUTABLE, and any function querying another table is inherently STABLE.

**Learning:** Cross-table uniqueness constraints cannot use partial unique indexes. Use a `BEFORE INSERT` trigger instead:

```sql
CREATE FUNCTION prevent_duplicate_active_assignment() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM route_stops rs JOIN routes r ON r.id = rs.route_id
    WHERE rs.order_id = NEW.order_id AND r.status != 'completed'
      AND rs.route_id != NEW.route_id
  ) THEN
    RAISE EXCEPTION 'Order % is already assigned to an active route', NEW.order_id
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Also added: `batch_update_stop_indices` RPC (array params for bulk index updates), `reindex_route_stops` RPC (CTE-based atomic reindex), `update_route_stats` RPC (single aggregate query replacing N+1 pattern).

**Apply when:** Needing cross-table uniqueness constraints, or replacing N+1 query patterns in route stats/reindexing.

---

## UNIQUE Constraints Block Batch Reorder — Use DEFERRABLE

**Context:** `route_stops` has `UNIQUE(route_id, stop_index)`. The `batch_update_stop_indices` RPC swaps indices (e.g., stop A: 0→2, stop C: 2→0) in a single UPDATE. PostgreSQL checks unique constraints per-row during UPDATE, so intermediate states violate uniqueness.

**Learning:** When a unique constraint covers a column that gets batch-reordered, make it `DEFERRABLE INITIALLY IMMEDIATE`. Then defer it in the RPC:

```sql
ALTER TABLE route_stops
  ADD CONSTRAINT route_stops_route_id_stop_index_key
  UNIQUE (route_id, stop_index)
  DEFERRABLE INITIALLY IMMEDIATE;

-- In the RPC:
SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;
UPDATE route_stops rs SET stop_index = data.new_index ...
```

`INITIALLY IMMEDIATE` means normal inserts/updates still check instantly. Only the RPC explicitly defers when doing batch swaps.

**Apply when:** Batch-updating columns involved in unique constraints (sortable lists, reorderable items, index swaps).

---

## Idempotent PostgreSQL Enum Creation

**Context:** Migration `20260314_customer_feedback.sql` used `CREATE TYPE feedback_category AS ENUM (...)`. Applying to a database where the type already existed failed with `ERROR: 42710: type "feedback_category" already exists`.

**Learning:** PostgreSQL `CREATE TYPE` has no `IF NOT EXISTS` clause. Use `DO/EXCEPTION` block for idempotent enum creation:

```sql
DO $$ BEGIN
  CREATE TYPE feedback_category AS ENUM ('bug_report', 'order_issue', 'suggestion', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Also pair with `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for full idempotency.

**Apply when:** Writing migrations that create custom enum types, especially for tables that may be partially applied or re-run.

---

## Supabase Generated Types: New Tables Require Interim Cast

**Context:** Added `delivery_zones` table via migration. Supabase generated types (`src/types/database.ts`) don't include it until `pnpm supabase gen types` is re-run. TypeScript rejects `.from("delivery_zones")`.

**Learning:** When a migration adds a new table before types are regenerated, use:
```typescript
supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .from("delivery_zones" as any)
  .select("...")
  .returns<MyRowType[]>();
```
The `.returns<T>()` provides type safety on the output. Remember to regenerate types and remove the cast after migration is applied.

**Apply when:** Adding new tables or columns via migration before regenerating Supabase types.
