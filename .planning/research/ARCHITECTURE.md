# Architecture Patterns

**Domain:** Stability & correctness fixes for existing delivery app (v2.2)
**Researched:** 2026-03-19
**Confidence:** HIGH -- all findings verified against source code

## Fix Integration Map

This document maps each v2.2 fix to its integration points in the existing architecture, identifies what code gets modified vs. created, and establishes fix ordering based on dependencies.

---

## Component Boundaries

| Component | Responsibility | Fixed By |
|-----------|---------------|----------|
| `src/lib/utils/delivery-timezone.ts` | LA timezone ISO string construction | Extended: new `getLAToday()` helper |
| `src/app/api/checkout/session/route.ts` | Checkout validation + order creation | Modified: timezone-safe date, future bound |
| `src/app/api/checkout/session/helpers.ts` | COD email + address distance | Modified: timezone-aware delivery window strings |
| `src/app/api/driver/routes/active/route.ts` | Driver's today route fetch | Modified: add `customer_name`/`customer_phone` to select |
| `src/app/api/driver/routes/[routeId]/start/route.ts` | Route start transition | Modified: accept `accepted` status (already does), gate `assigned` |
| `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` | Stop status transitions + next-stop promotion | Modified: atomic promotion, fix `updateRouteStats` |
| `src/app/api/driver/routes/[routeId]/complete/route.ts` | Route completion + badges | Modified: call new RPC |
| `src/app/api/cron/delivery-reminders/route.ts` | Daily reminder emails | Modified: LA timezone for `today` |
| `src/app/api/admin/routes/[id]/route.ts` | Admin route PATCH | Modified: lifecycle guard on status override |
| `src/app/api/admin/settings/route.ts` | Admin settings PATCH | Modified: remove `{ expire: 0 }` arg |
| `src/app/api/admin/delivery-days/route.ts` | Admin delivery days PATCH | Modified: remove `{ expire: 0 }` arg |
| `src/app/api/admin/delivery-zones/route.ts` | Admin delivery zones CRUD | Modified: remove `{ expire: 0 }` arg, remove `as any` |
| `src/app/api/admin/settings/restore/route.ts` | Admin settings restore | Modified: remove `{ expire: 0 }` arg |
| `src/lib/settings/business-rules.ts` | Cached business rules fetch | Modified: remove `as any` |
| `src/lib/rate-limit/client.ts` | Rate limiter exports | Modified: restore `Ratelimit` constructors |
| `src/lib/utils/delivery-dates.ts` | Delivery date computation | Modified: pre-filter cutoff-passed candidates |
| `supabase/migrations/` | DB functions + triggers | New: `increment_driver_deliveries` RPC, `promote_next_stop` RPC |
| `src/types/database.ts` | Generated Supabase types | Regenerated: includes `delivery_zones` |

---

## Fix-by-Fix Integration Analysis

### Fix 1: Timezone-Safe Date Construction (Issues A, B, 6)

**Problem:** Three locations construct dates or "today" strings using naive UTC or server-local time instead of LA timezone.

**Integration Points:**

| Location | Current Code | Fix |
|----------|-------------|-----|
| `checkout/session/route.ts:53` | `new Date(input.scheduledDate + "T12:00:00")` | `toISOWithTimezone(input.scheduledDate, "12:00")` then parse |
| `checkout/session/helpers.ts:119-120,158-159` | `` `${opts.scheduledDate}T${opts.timeWindowStart}:00` `` | `toISOWithTimezone(opts.scheduledDate, opts.timeWindowStart)` |
| `cron/delivery-reminders/route.ts:60` | `new Date().toISOString().split("T")[0]` | Use `getLAToday()` from shared utility |

**New Code:**

Add `getLAToday()` to `src/lib/utils/delivery-timezone.ts` -- the existing `toISOWithTimezone()` lives there. This is the canonical location for LA timezone operations.

```typescript
// src/lib/utils/delivery-timezone.ts -- ADD:
export function getLAToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}
```

Note: `active/route.ts` already has a correct `getTodayInTimezone()` using this same pattern. Consolidate into the shared utility so all consumers use one function.

**Cron query also needs fix:** The `.gte()` / `.lt()` string comparison against timezone-aware DB timestamps must use proper LA-offset boundaries:
```typescript
const today = getLAToday();
const startOfDay = toISOWithTimezone(today, "00:00");
const endOfDay = toISOWithTimezone(today, "23:59");
```

**Modified files:** 3 (checkout route, checkout helpers, cron route)
**New code in:** 1 (delivery-timezone.ts -- add `getLAToday`)
**Risk:** LOW -- `toISOWithTimezone` already proven; just extending usage

---

### Fix 2: Route Status Machine Guards (Issues F, G)

**Problem:** Driver sees route with `assigned` status but "Start Route" button produces 400 error because `start` endpoint requires `planned` or `accepted`.

**Current Flow (verified in code):**
```
assigned → AcceptDeclineBar shown (DriverRouteSwitch.tsx:44)
            → POST /accept → status becomes "accepted"
accepted → Start button shown (ActiveRouteView)
            → POST /start → status becomes "in_progress"
```

The UI is already correct: `AcceptDeclineBar` renders for `assigned`/`accepted`, and `ActiveRouteView` shows "Start" for `accepted`/`planned`. The actual bug is the `start` endpoint accepting `planned` -- a `planned` route with a `driver_id` set (pre-backfill legacy, or admin manipulation per Issue G) should not be startable without acceptance.

**Integration Points:**

| Location | Change |
|----------|--------|
| `start/route.ts:57` | Change from `planned && accepted` to `accepted` only |
| `admin/routes/[id]/route.ts:340` | Add lifecycle guard: reject `in_progress` if current status is `planned`/`assigned` |
| `active/route.ts:168` | Remove `planned` from status filter (driver should not see unassigned routes) |
| `driver/route/page.tsx:77` | Same -- remove `planned` from SSR query |

**Admin lifecycle guard (Issue G):**
```typescript
// admin/routes/[id]/route.ts -- ADD before routeUpdate:
if (status !== undefined) {
  const { data: currentRoute } = await supabase.from("routes").select("status, driver_id").eq("id", id).single();
  const VALID_ADMIN_TRANSITIONS: Record<string, string[]> = {
    planned: ["assigned"],  // only via driverId assignment
    assigned: ["planned", "accepted"],
    accepted: ["assigned", "in_progress"],
    in_progress: ["completed"],
    completed: [],
  };
  if (currentRoute && !VALID_ADMIN_TRANSITIONS[currentRoute.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentRoute.status} to ${status}` },
      { status: 400 }
    );
  }
}
```

**Modified files:** 4 (start, admin PATCH, active route API, driver page SSR)
**New code:** Transition map constant (inline in admin route)
**Risk:** LOW -- straightening existing logic, UI already handles correctly

---

### Fix 3: Atomic Next-Stop Promotion (Issue 9)

**Problem:** After marking a stop `delivered`, two separate queries (SELECT next pending + UPDATE to enroute) create a race condition if two stops complete rapidly.

**Current code in `stops/[stopId]/route.ts:167-186`:**
```typescript
// SELECT next pending stop
const { data: nextStopData } = await supabase
  .from("route_stops")
  .select("id, stop_index")
  .eq("route_id", routeId)
  .eq("status", "pending")
  .order("stop_index", { ascending: true })
  .limit(1)
  .single();
// Then UPDATE it to enroute -- RACE WINDOW HERE
```

**Fix:** Replace with a PostgreSQL RPC that does the SELECT + UPDATE atomically:

```sql
-- New migration: promote_next_stop RPC
CREATE OR REPLACE FUNCTION promote_next_stop(p_route_id uuid)
RETURNS TABLE(stop_id uuid, stop_index int) AS $$
BEGIN
  RETURN QUERY
  UPDATE route_stops
  SET status = 'enroute'
  WHERE id = (
    SELECT id FROM route_stops
    WHERE route_id = p_route_id AND status = 'pending'
    ORDER BY stop_index ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING route_stops.id AS stop_id, route_stops.stop_index;
END;
$$ LANGUAGE plpgsql;
```

**Integration:** Replace the SELECT+UPDATE in `stops/[stopId]/route.ts:167-186` with:
```typescript
const { data: promoted } = await supabase.rpc("promote_next_stop", { p_route_id: routeId });
const nextStop = promoted?.[0] ? { id: promoted[0].stop_id, stopIndex: promoted[0].stop_index } : null;
```

Same pattern applies in `exception/route.ts` which has a duplicate `updateRouteStats` + next-stop logic.

**Modified files:** 2 (stop status route, exception route)
**New code:** 1 migration file
**Risk:** LOW -- `FOR UPDATE SKIP LOCKED` is standard Postgres concurrency

---

### Fix 4: Fix `updateRouteStats` Counting Bug (Issue I)

**Problem:** JS-side `updateRouteStats` counts `enroute` as `pending`. The SQL RPC `update_route_stats` (from `20260312_route_pipeline_hardening.sql`) counts correctly -- but the API uses the JS version.

**Current state:**
- SQL RPC `update_route_stats(p_route_id)` exists and counts `pending` correctly (no `enroute` conflation)
- JS `updateRouteStats` in `stops/[stopId]/route.ts:206-235` has the bug
- Same JS function duplicated in `exception/route.ts:263+`

**Fix:** Replace both JS `updateRouteStats` calls with the existing SQL RPC:
```typescript
await supabase.rpc("update_route_stats", { p_route_id: routeId });
```

This eliminates the bug AND the code duplication. The SQL RPC already does the `UPDATE routes SET stats_json = ...` so no additional step needed.

**Modified files:** 2 (stop status route, exception route) -- remove ~30 lines each
**New code:** None -- SQL RPC already exists
**Risk:** NONE -- SQL RPC is already used by `split_route` and `merge_routes`

---

### Fix 5: `increment_driver_deliveries` RPC (Issue J)

**Problem:** `route complete` endpoint calls `supabase.rpc("increment_driver_deliveries", ...)` but the RPC does not exist in any migration. `deliveries_count` is never updated.

**Fix:** Create migration with the RPC:
```sql
CREATE OR REPLACE FUNCTION increment_driver_deliveries(
  p_driver_id uuid,
  p_count int
) RETURNS void AS $$
BEGIN
  UPDATE drivers
  SET deliveries_count = deliveries_count + p_count
  WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Integration:** The call site in `complete/route.ts:108-118` already exists with the correct parameters (`p_driver_id`, `p_count`). Remove the try/catch swallow and let it propagate (non-blocking -- badge failure already has its own try/catch).

Actually, keep the try/catch but log at `warn` level instead of `info`, and remove the "might not exist yet" comment since the RPC will now exist.

**Modified files:** 1 (complete route -- clean up try/catch comment)
**New code:** 1 migration file
**Risk:** NONE -- simple atomic UPDATE

---

### Fix 6: Active Route Missing Customer Contact (Issue 7)

**Problem:** `active/route.ts` selects from `profiles!orders_user_id_fkey` for customer data but does not include `customer_name` / `customer_phone` from `orders` table. The `[routeId]/route.ts` detail endpoint correctly uses fallback.

**Diff between endpoints:**

| Field | `active/route.ts` | `[routeId]/route.ts` |
|-------|-------------------|---------------------|
| `customer_name` | NOT selected | Selected from `orders` |
| `customer_phone` | NOT selected | Selected from `orders` |
| Fallback logic | `profiles.full_name` only | `customer_name ?? profiles.full_name` |

**Fix:**
1. Add `customer_name, customer_phone` to the orders select in `active/route.ts:141`
2. Update the `OrderData` interface to include these fields
3. Update the response transform at line 199-203 to use fallback:
```typescript
fullName: stop.orders!.customer_name ?? stop.orders!.profiles?.full_name ?? null,
phone: stop.orders!.customer_phone ?? stop.orders!.profiles?.phone ?? null,
```

**Modified files:** 1 (active route)
**Risk:** NONE -- adding fields to select, no schema change

---

### Fix 7: `revalidateTag` Invalid Second Argument (Issue 5)

**Problem:** `revalidateTag("business-rules", { expire: 0 })` -- second arg is silently ignored. Not a functional bug (tag is still invalidated) but indicates confusion about the API.

**Integration Points:**
- `admin/settings/route.ts:221`
- `admin/settings/restore/route.ts:121`
- `admin/delivery-zones/route.ts:116`
- `admin/delivery-days/route.ts:122`

**Fix:** Remove second argument from all 4 locations. Pure find-and-replace.

**Modified files:** 4
**Risk:** NONE -- removing dead code

---

### Fix 8: Regenerate Supabase Types (Issue 4)

**Problem:** `delivery_zones` table exists (migration `20260312`) but `src/types/database.ts` was not regenerated. Three files use `as any` cast.

**Fix:**
```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

Then remove `as any` from:
- `src/lib/settings/business-rules.ts:125`
- `src/app/api/admin/delivery-zones/route.ts:59,103`

**Modified files:** 3 (remove casts) + 1 regenerated (`database.ts`)
**Depends on:** All new migrations (Fixes 3, 5) should be applied BEFORE type regeneration
**Risk:** LOW -- may surface new type errors if generated types reveal mismatches

---

### Fix 9: Rate Limiting Restoration (Issue 3)

**Problem:** All 13 rate limiters in `client.ts` are `null`. In-memory fallback is per-instance, not distributed.

**Architecture decision needed:** Upstash REST Redis vs Vercel KV

| Option | Pros | Cons |
|--------|------|------|
| **Upstash REST Redis** | Already in `package.json` (`@upstash/redis`, `@upstash/ratelimit`). Config infrastructure exists (`config.ts`). Just needs credentials. | Requires Upstash account/provisioning |
| **Vercel KV** | Native Vercel integration. Same REST protocol as Upstash (Vercel KV IS Upstash under the hood). | Different import path (`@vercel/kv`), new dependency |

**Recommendation:** Upstash REST Redis. Zero code changes to `check.ts` or any consumer. Only `client.ts` changes:

```typescript
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { RATE_LIMITS } from "./config";

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedisClient();

function limiter(tier: keyof typeof RATE_LIMITS): Ratelimit | null {
  if (!redis) return null;
  const cfg = RATE_LIMITS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.max, cfg.window as `${number} ${"s" | "m" | "h"}`),
    prefix: `rl:${tier}`,
  });
}

export const authSignInLimiter = limiter("auth-signin");
export const authSignUpLimiter = limiter("auth-signup");
// ... all 13 limiters
```

**Modified files:** 1 (`client.ts`)
**New env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
**Risk:** LOW -- existing infrastructure, just credentials. Fail-open fallback already in `check.ts`

---

### Fix 10: Checkout Future Date Bound (Issue E)

**Problem:** No upper bound on `scheduledDate`. Customer could order for 2 years from now.

**Fix:** Add validation in `checkout/session/route.ts` after line 53:
```typescript
const maxFutureDays = 30;
const daysFromNow = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
if (daysFromNow > maxFutureDays) {
  return errorResponse("VALIDATION_ERROR", "Cannot schedule more than 30 days in advance", 400);
}
```

**Modified files:** 1
**Risk:** NONE

---

### Fix 11: Pre-filter Cutoff-Passed Dates (Issue C)

**Problem:** `getAvailableDeliveryDatesMultiDay` includes cutoff-passed dates in results, consuming slots in the `count` limit.

**Fix:** In `delivery-dates.ts:296-311`, filter before adding to results:
```typescript
// Before: adds all candidates, marks cutoffPassed
// After: skip cutoff-passed candidates from week 0 (current week)
.forEach(({ date, dayConfig }) => {
  const dateStr = formatDateString(date);
  if (seen.has(dateStr) || results.length >= count) return;
  const cutoffPassed = isPastCutoffForDay(date, dayConfig, now);
  if (cutoffPassed) return; // Skip instead of including with flag
  seen.add(dateStr);
  // ...
});
```

**Modified files:** 1
**Risk:** LOW -- verify that no consumer depends on cutoff-passed entries being present. `TimeStepV8` already skips them via `availableDates.find((d) => !d.cutoffPassed)`, so removing them is safe.

---

### Fix 12: Split Oversized `handlers.ts` (Tech Debt)

**Problem:** `src/app/api/webhooks/stripe/handlers.ts` is 529 lines with `/* eslint-disable max-lines */`.

**Fix:** Extract into per-event handler files:
```
src/app/api/webhooks/stripe/
  handlers/
    index.ts           # Re-exports handler map
    checkout.ts        # handleCheckoutSessionCompleted
    expired.ts         # handleCheckoutSessionExpired
    refund.ts          # handleChargeRefunded, handleRefundUpdated
  route.ts             # Unchanged -- imports from handlers/
```

**Modified files:** 1 split into 4-5
**Risk:** LOW -- pure refactor, barrel re-exports preserve all imports

---

### Fix 13: Integration Tests for Driver Route Lifecycle

**Problem:** No test covers the full sequence: `assigned` -> `accept` -> `start` -> stop transitions -> `complete`.

**Architecture for tests:**

Existing test pattern (from `__tests__/route.test.ts` files): Vitest with mocked Supabase client.

**Test file location:** `src/app/api/driver/routes/__tests__/lifecycle.test.ts`

**Test structure:**
```typescript
describe("Driver Route Lifecycle", () => {
  it("rejects start on assigned route (must accept first)");
  it("accepts assigned route -> status becomes accepted");
  it("starts accepted route -> status becomes in_progress, first stop enroute");
  it("marks stop delivered -> order status updated, next stop promoted");
  it("completes route -> stats calculated, deliveries incremented");
  it("rejects double-accept");
  it("rejects start on already in_progress route");
});
```

**Depends on:** Fixes 2, 3, 4, 5 (tests should validate the fixed behavior)
**New files:** 1 test file

---

## Data Flow Changes

### New RPCs (Migrations)

| RPC | Purpose | Called By | Security |
|-----|---------|-----------|----------|
| `increment_driver_deliveries(p_driver_id, p_count)` | Atomically increment `drivers.deliveries_count` | `complete/route.ts` | SECURITY DEFINER |
| `promote_next_stop(p_route_id)` | Atomically find+promote next pending stop to enroute | `stops/[stopId]/route.ts`, `exception/route.ts` | SECURITY DEFINER |

### Type Regeneration

After both migrations are applied, run `supabase gen types typescript` to update `src/types/database.ts`. This also picks up `delivery_zones` table (existing migration `20260312`).

### Env Vars

| Variable | Purpose | Required For |
|----------|---------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint | Rate limiting (Fix 9) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST auth token | Rate limiting (Fix 9) |

---

## Suggested Fix Order (Dependencies)

Fixes fall into three independent tracks that can be parallelized within each track:

### Track A: Database Layer (must go first)

```
Phase 1: Migrations
  - increment_driver_deliveries RPC (Fix 5)
  - promote_next_stop RPC (Fix 3)
  - Regenerate Supabase types (Fix 8) -- AFTER migrations applied

Rationale: API code changes depend on these RPCs existing.
Type regeneration must happen after all schema changes.
```

### Track B: API Correctness (depends on Track A)

```
Phase 2: Route lifecycle fixes
  - Route status machine guards (Fix 2) -- critical blocker
  - Atomic next-stop promotion (Fix 3 API side) -- depends on RPC
  - Fix updateRouteStats counting (Fix 4) -- replace JS with existing SQL RPC
  - increment_driver_deliveries call cleanup (Fix 5 API side) -- depends on RPC
  - Active route customer contact (Fix 6)
  - Admin lifecycle guard (Fix 2 admin side)

Phase 3: Checkout + timezone fixes
  - Timezone-safe date construction (Fix 1) -- checkout, COD email, cron
  - Checkout future date bound (Fix 10)
  - Pre-filter cutoff-passed dates (Fix 11)
```

### Track C: Infrastructure + Cleanup (independent)

```
Phase 4: Infrastructure
  - Rate limiting restoration (Fix 9) -- requires Upstash provisioning
  - revalidateTag cleanup (Fix 7) -- trivial

Phase 5: Code quality
  - Split handlers.ts (Fix 12) -- pure refactor
  - Integration tests (Fix 13) -- depends on Fixes 2-5 being done
```

### Dependency Graph

```
                Fix 5 (RPC migration)
                Fix 3 (RPC migration)
                         |
                Fix 8 (type regen)
                    /          \
          Fix 3 (API)    Fix 5 (API)
          Fix 4 (API)    Fix 6 (API)
          Fix 2 (API)
               |
          Fix 13 (tests) -- validates all route fixes

  Fix 1 (timezone) -- independent
  Fix 7 (revalidateTag) -- independent
  Fix 9 (rate limit) -- independent (infra provisioning)
  Fix 10 (date bound) -- independent
  Fix 11 (cutoff filter) -- independent
  Fix 12 (split handlers) -- independent
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: JS Reimplementation of SQL Logic
**What:** `updateRouteStats` in JS duplicates the SQL `update_route_stats` RPC with a different formula (counts `enroute` as `pending`).
**Why bad:** Logic divergence between application and database layer. The SQL version is already used by `split_route` and `merge_routes`.
**Instead:** Always call the SQL RPC. Single source of truth in the database.

### Anti-Pattern 2: Swallowing RPC Errors with "Might Not Exist"
**What:** `try { await supabase.rpc(...) } catch { // might not exist }`
**Why bad:** Silently hides all errors, not just "function not found." Once the RPC exists, legitimate errors (wrong params, constraint violations) are swallowed too.
**Instead:** Create the RPC via migration. Remove the defensive try/catch (or keep it but log at `warn` level for operational visibility).

### Anti-Pattern 3: Inline `getTodayInTimezone()` Per File
**What:** `active/route.ts` defines its own `getTodayInTimezone()`. Cron uses `new Date().toISOString().split("T")[0]`.
**Why bad:** Inconsistent timezone handling. Each file can independently get it wrong.
**Instead:** Export `getLAToday()` from `delivery-timezone.ts`. All consumers import from one place.

### Anti-Pattern 4: SELECT Then UPDATE Without Lock
**What:** `stops/[stopId]/route.ts` finds next pending stop via SELECT, then UPDATE it separately.
**Why bad:** Race condition when two requests execute concurrently.
**Instead:** Use atomic RPC with `FOR UPDATE SKIP LOCKED` or single UPDATE ... WHERE ... RETURNING.

---

## Scalability Considerations

| Concern | Current (20-50 orders) | At Scale |
|---------|----------------------|----------|
| Rate limiting | In-memory per-instance is fine | Distributed Redis required |
| Stop promotion race | Unlikely with 1-2 drivers | Guaranteed with concurrent drivers |
| `updateRouteStats` JS | Works but wrong count | SQL RPC is faster and correct |
| Signed URL generation | 10 parallel calls per route view | Batch or cache needed at 50+ stops |
| Business rules cache | 5-min stale window acceptable | Multi-instance stale window may need Vercel data cache |

---

## Sources

- All findings verified against source code in the repository
- `check_route_completion` trigger: `supabase/migrations/20260312_route_pipeline_hardening.sql`
- `update_route_stats` SQL RPC: same migration file
- `split_route`/`merge_routes` RPCs: `supabase/migrations/20260316_route_rpc_status_update.sql`
- `calculate_driver_streak` RPC: `supabase/migrations/021_driver_gamification.sql`
- Driver UI status handling: `src/app/(driver)/driver/route/DriverRouteSwitch.tsx`
- Rate limit architecture: `src/lib/rate-limit/check.ts`, `config.ts`, `client.ts`

---

*Architecture analysis: 2026-03-19*
