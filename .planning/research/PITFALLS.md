# Domain Pitfalls

**Domain:** Stability and correctness fixes -- timezone migration, state machine guards, rate limiting restoration, race condition fixes, RPC/migration safety, integration testing for existing production Next.js 16 + Supabase delivery app
**Researched:** 2026-03-19
**Confidence:** HIGH (all findings verified against codebase inspection + CONCERNS.md audit)

---

## Critical Pitfalls

Mistakes that cause data corruption, production outages, or require rollbacks.

### Pitfall 1: Timezone Fix Creates Comparison Mismatch with Existing DB Data

**What goes wrong:** The cron endpoint (Issue 6) currently queries `delivery_window_start` with naive strings like `2026-03-19T00:00:00`. If you fix the cron to use LA-timezone-aware queries but **don't verify** how existing `delivery_window_start` values are stored, the fix breaks instead of fixing. The DB stores these as LA-offset ISO strings (e.g., `2026-03-19T11:00:00-07:00`) via `toISOWithTimezone()`. A "fixed" query using `${laToday}T00:00:00-07:00` would work during PDT but fail during PST (offset is `-08:00`), unless you use `timestamptz` comparison instead of string comparison.

**Why it happens:** Developers fix the "today" calculation to LA time but forget the **comparison format** must also change. PostgreSQL string comparison of `2026-03-19T00:00:00-07:00` against stored `2026-03-19T11:00:00-07:00` works only if offsets match. During DST transitions, stored offsets can differ from query offsets.

**Consequences:**
- Cron sends zero reminders on DST-transition days (2 days/year)
- Cron sends yesterday's reminders between midnight UTC and 7 AM PT during the ~2-week window around DST changes
- Silent failure: no error thrown, just wrong result set

**Prevention:**
- Use `timestamptz` column comparison, not string comparison: `delivery_window_start >= '2026-03-19'::date` (PostgreSQL casts date to timestamptz at midnight in the connection timezone)
- Or construct bounds using `toISOWithTimezone()` helper already in the codebase, ensuring both query bounds use the same helper
- Write a test that mocks `new Date()` to a DST transition day (March second Sunday, November first Sunday) and verifies correct date range

**Detection:** Sentry alerts for "0 reminders sent" on a delivery day. Add a check: if `orders.length === 0` on a known delivery day, log a warning.

**Phase relevance:** Timezone fixes phase -- every query touching `delivery_window_start`/`delivery_window_end` must be audited together.

---

### Pitfall 2: Fixing COD Email Timestamps Breaks Email Template Rendering

**What goes wrong:** Issue B's fix changes `deliveryWindowStart` from `"2026-03-19T11:00:00"` to `"2026-03-19T11:00:00-07:00"`. The `OrderConfirmation` and `AdminNewOrderAlert` email templates **parse or display** this string. If the template uses `new Date(deliveryWindowStart).toLocaleTimeString()`, adding the offset changes the displayed time. A naive string was being interpreted as local time by the email renderer; an offset string is interpreted as UTC-relative.

**Why it happens:** The email template's date formatting code is not checked when fixing the data source. The fix is correct at the API level but the consumer interprets it differently.

**Consequences:** Customers see wrong delivery time in confirmation email (e.g., "6:00 PM" instead of "11:00 AM" if template renders in UTC).

**Prevention:**
- Audit all email templates that consume `deliveryWindowStart`/`deliveryWindowEnd` before changing the format
- The template should format with explicit timezone: `new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', ... })`
- Add a unit test for each email template that passes a timezone-offset string and asserts the displayed time is in PT

**Detection:** Send a test COD order after the fix and visually check the confirmation email.

**Phase relevance:** Timezone fixes phase -- COD email fix and email template audit must be in the same plan.

---

### Pitfall 3: State Machine Guard Rejects Existing `assigned` Routes Mid-Operation

**What goes wrong:** Tightening the route start endpoint to require `status === "accepted"` (removing `"planned"` from the allowed list) is the correct fix for Issue F. But if existing routes in the DB are in `planned` status with a `driver_id` set (legacy data that the backfill migration missed, or routes created via admin PATCH after the backfill ran), those routes become permanently unstartable. The driver sees the route, cannot accept it (no accept endpoint for `planned`), cannot start it (guard rejects `planned`).

**Why it happens:** The backfill migration (`20260316_route_status_backfill.sql`) ran once. Routes created after the backfill but before the code fix can have `planned` + `driver_id` if created via admin direct PATCH.

**Consequences:** Driver is stuck; admin must manually SQL-update the route status. On a Saturday delivery day with a phone-only admin, this is a blocking operational failure.

**Prevention:**
- Run a **re-backfill** as part of the migration: `UPDATE routes SET status = 'assigned' WHERE driver_id IS NOT NULL AND status = 'planned'`
- Add a DB trigger or CHECK constraint: `planned` status must have `driver_id IS NULL`
- Admin PATCH endpoint (Issue G) must be fixed in the **same phase** as the start endpoint guard -- they are coupled

**Detection:** Query `SELECT count(*) FROM routes WHERE status = 'planned' AND driver_id IS NOT NULL` before deploying. If > 0, the backfill is needed.

**Phase relevance:** State machine fixes phase -- the start guard, admin PATCH guard, and re-backfill migration must ship together as one atomic deployment.

---

### Pitfall 4: Race Condition Fix Introduces Deadlocks or Excessive Locking

**What goes wrong:** The next-stop promotion race (Issue 9) requires making the SELECT + UPDATE atomic. The obvious fix is a PostgreSQL function with `SELECT ... FOR UPDATE`. But if the same route has concurrent requests (driver marking stop delivered + admin viewing route stats), `FOR UPDATE` on `route_stops` blocks the stats query. If the stats query also locks (e.g., `update_route_stats` RPC), you get a deadlock: stop update waits for stats lock, stats waits for stop lock.

**Why it happens:** The existing `updateRouteStats` function in `route_pipeline_hardening.sql` does `UPDATE routes SET stats_json = ...` and reads from `route_stops`. If the stop promotion function locks `route_stops` rows and then calls `updateRouteStats` which also reads `route_stops`, the lock ordering is consistent (route_stops first, routes second). But if an admin endpoint concurrently calls `update_route_stats` directly while a stop is being promoted, the lock ordering can conflict.

**Consequences:** 30-second query timeout on a delivery Saturday. Driver's "mark delivered" hangs, then fails. They tap again, creating more contention.

**Prevention:**
- Use `UPDATE route_stops SET status = 'enroute' WHERE id = (SELECT id FROM route_stops WHERE route_id = $1 AND status = 'pending' ORDER BY stop_index LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id` -- the `SKIP LOCKED` prevents deadlocks by skipping already-locked rows
- Or use a single `UPDATE ... WHERE status = 'pending'` with `LIMIT 1` (no SELECT needed) -- atomic by nature
- Do NOT wrap `updateRouteStats` inside the same transaction as the stop promotion
- Test with concurrent requests: 2 rapid stop completions on the same route

**Detection:** Monitor Supabase logs for `deadlock detected` or `lock timeout` errors after deployment.

**Phase relevance:** Race condition fixes phase.

---

### Pitfall 5: Rate Limiter Restoration Blocks Legitimate Traffic on First Deploy

**What goes wrong:** Switching from null limiters to live Upstash `Ratelimit` constructors means the in-memory fallback (15 req/min) is replaced by configured limits. If the configured limits are tighter than 15/min (e.g., `authSignInLimiter` at 5/min) **and** the app has been running with effectively no rate limiting, legitimate automated flows (e.g., admin bulk operations, cron health checks) may suddenly hit 429s.

**Why it happens:** The in-memory fallback was per-instance (so effectively unlimited under concurrency). Distributed rate limiting shares a single counter across all instances. Traffic patterns that worked before (admin making 20 rapid PATCH calls during Saturday ops) now exceed the limit.

**Consequences:** Admin locked out of their own dashboard during Saturday delivery operations. Rate limit errors on checkout for multiple simultaneous customers.

**Prevention:**
- Set initial limits **higher** than intended (2x the expected max), monitor for 1-2 weeks, then tighten
- `adminBulkLimiter` should be at least 60/min (bulk ops send sequential PATCHes with 100ms delay = up to 600/min theoretical)
- The `checkoutLimiter` should allow at least 10/min per user (customer may refresh checkout page, retry failed payment)
- Use Upstash's `slidingWindow` algorithm (not `fixedWindow`) to avoid burst rejection at window boundaries
- Add a kill-switch: if `UPSTASH_REDIS_REST_URL` is unset, fall back to in-memory (already implemented via null check in `check.ts`)

**Detection:** Monitor 429 response rate in Sentry for the first 24 hours after deployment. Alert if 429 rate exceeds 1% of requests.

**Phase relevance:** Rate limiting restoration phase.

---

## Moderate Pitfalls

### Pitfall 6: `increment_driver_deliveries` RPC Migration Conflicts with Existing `try/catch` Swallow

**What goes wrong:** Creating the `increment_driver_deliveries` RPC migration fixes Issue J. But the existing code has `try { await supabase.rpc(...) } catch { /* ignore */ }`. After deploying the migration, the RPC exists but could fail for other reasons (wrong parameter names, missing permissions). The `catch` block swallows ALL errors, including legitimate failures like "permission denied" or type mismatch.

**Prevention:**
- Remove the `try/catch` swallow after deploying the migration -- replace with proper error handling that logs but doesn't block route completion
- Verify parameter names match exactly: `p_driver_id` vs `driver_id`, `p_count` vs `count` -- PostgreSQL RPCs are strict on parameter naming
- Test the RPC manually via Supabase SQL Editor before deploying the application code that removes the catch

**Detection:** After deployment, check `SELECT deliveries_count FROM drivers WHERE id = $recent_driver` to verify it's incrementing.

**Phase relevance:** RPC/migration phase.

---

### Pitfall 7: `checkout scheduledDate` Fix Silently Breaks Cart Recovery from IndexedDB

**What goes wrong:** Issue A's fix changes `new Date(input.scheduledDate + "T12:00:00")` to use `toISOWithTimezone()`. But the Zustand cart store persists `scheduledDate` as a plain `YYYY-MM-DD` string to IndexedDB via `idb-keyval`. Carts saved before the fix contain the old format. If the new parsing code expects a different format from the persisted value, cart recovery fails and the customer loses their in-progress order.

**Prevention:**
- The fix should only change server-side parsing in `route.ts`, not the format stored in the cart
- Verify that `input.scheduledDate` from the Zod schema is always `YYYY-MM-DD` regardless of the parsing change
- Keep `toISOWithTimezone(input.scheduledDate, "12:00")` as the server-side construction -- the input format stays the same

**Detection:** Clear IndexedDB, add items to cart, refresh, verify cart survives. Then test with a cart saved before the fix.

**Phase relevance:** Timezone fixes phase.

---

### Pitfall 8: Admin Route Override Guard Breaks Emergency Operations

**What goes wrong:** Issue G's fix adds lifecycle guards to the admin PATCH endpoint (e.g., `in_progress` only allowed from `accepted` or `assigned`). But the admin uses direct status overrides as an **emergency escape hatch** -- e.g., force-completing a stuck route, skipping a misbehaving state. If the guard is too strict, the admin loses their only recovery tool and must resort to direct SQL.

**Prevention:**
- Guard transitions but allow admin to force-complete with a `force: true` parameter that logs an audit trail
- Required transitions: `planned -> assigned` (needs driver_id), `assigned -> accepted` (driver action only), `accepted/assigned -> in_progress` (start)
- Allowed admin overrides with logging: any status -> `completed` (with all-stops-terminal check), any status -> `planned` (unassign driver)
- Log every admin override to an `audit_log` table or Sentry event

**Detection:** Test all admin PATCH scenarios in integration tests before deploying the guard.

**Phase relevance:** State machine fixes phase -- must ship with the start endpoint guard (Pitfall 3).

---

### Pitfall 9: Integration Tests Create Cross-Test State Pollution

**What goes wrong:** The existing test setup (`src/test/setup.ts`) mocks environment variables but has no database state management. Adding integration tests for the driver route lifecycle requires creating routes, stops, orders, drivers, and profiles. If tests don't clean up, subsequent tests inherit polluted state. Vitest runs tests in parallel by default, so two test files creating routes with the same driver can conflict.

**Prevention:**
- Use `describe.sequential()` for tests that share database state
- Each test file should create **unique** UUIDs for all entities (use `crypto.randomUUID()`, not hardcoded UUIDs from factories)
- Implement `beforeEach`/`afterEach` cleanup that deletes test data by a marker (e.g., `delivery_date = '9999-12-31'` for test routes)
- Mock Supabase at the HTTP level (MSW) rather than hitting a real DB -- the existing tests already mock at the schema/validation level
- If testing against a real local Supabase instance: use a separate `test` schema or use transactions that roll back

**Detection:** Run `pnpm test -- --reporter=verbose` and look for test order dependencies (tests that pass alone but fail when run with others).

**Phase relevance:** Integration testing phase.

---

### Pitfall 10: `revalidateTag` Fix Seems Harmless but Masks a Cache Propagation Issue

**What goes wrong:** Issue 5's fix (removing `{ expire: 0 }` second argument) is trivial. But it draws attention away from the real problem: `revalidateTag` only invalidates the cache on the **instance that handles the request** in serverless deployments. The 5-minute `revalidate: 300` TTL on `unstable_cache` means other Vercel instances serve stale business rules for up to 5 minutes after an admin change.

**Prevention:**
- Fix Issue 5 as-is (remove the invalid argument)
- For the cache propagation issue: reduce `revalidate` to 60 seconds (1 minute max staleness) -- this is acceptable for a 20-50 order operation
- Do NOT attempt to solve multi-instance invalidation with a pub/sub pattern -- it adds complexity disproportionate to the scale
- Document the 60-second staleness window for the admin: "Changes take up to 1 minute to apply"

**Detection:** Admin changes cutoff time; verify on a different browser/device that the change reflects within 60 seconds.

**Phase relevance:** Can be a standalone fix, not blocked by other phases.

---

### Pitfall 11: Supabase Type Regeneration Breaks Existing `as any` Casts Unpredictably

**What goes wrong:** Regenerating Supabase types (Issue 4) to include `delivery_zones` adds the table to the `Database` type. This is good. But type regeneration also picks up any schema changes made since the last generation -- new columns, renamed fields, altered types. If the production schema has drifted from what the code expects (e.g., a migration was applied to production but the types were never regenerated), the new types may expose **dozens of type errors** in unrelated files.

**Prevention:**
- Before regenerating: `npx supabase db diff` to see what schema changes exist
- Regenerate against a local Supabase instance that has all migrations applied, not against production directly
- Run `pnpm typecheck` immediately after regeneration -- fix all new errors before committing
- This should be done **first** in the milestone since it may surface type errors that other fixes depend on

**Detection:** `pnpm typecheck` failure count comparison before and after regeneration.

**Phase relevance:** Should be Phase 1 of the milestone -- all other code changes benefit from accurate types.

---

## Minor Pitfalls

### Pitfall 12: Future Date Bound Validation Rejects Legitimate Advance Orders

**What goes wrong:** Issue E's fix adds a 30-day upper bound on `scheduledDate`. But multi-day delivery (Mon/Wed/Thu/Sat) means the next available date could be up to 6 days away. If the bound is too tight (e.g., 7 days for a single-day delivery model), it breaks when delivery days expand. If too loose (90 days), it doesn't meaningfully prevent abuse.

**Prevention:**
- Use the `getAvailableDeliveryDatesMultiDay` function's 3-week window as the bound: `scheduledDate` must be within the set of dates that function returns
- Or use 30 days as a simple upper bound (covers 4+ weeks of any delivery schedule)
- Make it configurable via `app_settings` if the operator wants to adjust

**Detection:** Attempt to order for the last available date shown in the picker. If rejected, the bound is too tight.

---

### Pitfall 13: `updateRouteStats` `enroute` Counting Fix Changes Dashboard Behavior

**What goes wrong:** Issue I's fix changes `enroute` from being counted as `pending` to a new `in_progress` category. Any admin dashboard component that renders `pending_stops` will now show a lower number. If the dashboard uses `pending_stops === 0` as a "route nearly complete" indicator, the behavior changes.

**Prevention:**
- Add `in_progress_stops` field to `RouteStats` type
- Update both the application-level `updateRouteStats` function AND the SQL `update_route_stats` RPC (they diverge currently)
- Check all dashboard components that read `stats_json.pending_stops`

**Detection:** Compare dashboard display before and after the fix on a route with an active `enroute` stop.

---

### Pitfall 14: `handlers.ts` Split Breaks Stripe Webhook Event Routing

**What goes wrong:** The 529-line `handlers.ts` needs splitting (tech debt item). Each handler function is imported and called from the main `route.ts` switch statement. If the split changes function signatures or export names, the switch statement silently falls through to the default case, returning a 200 with no processing.

**Prevention:**
- Keep barrel re-exports in the original `handlers.ts` path (or new `handlers/index.ts`)
- Test every Stripe event type after the split: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`
- Use TypeScript's `satisfies` to ensure all event types have handlers

**Detection:** Process a test Stripe webhook event via the CLI (`stripe trigger checkout.session.completed`) after the split.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Timezone fixes | DST transition breaks query comparisons (Pitfall 1) | Use `timestamptz` comparison, not string. Test on DST boundary dates |
| Timezone fixes | Email template renders wrong time after format change (Pitfall 2) | Audit all email template consumers before changing data format |
| State machine guards | Orphaned `planned` routes become unstartable (Pitfall 3) | Re-backfill migration + admin PATCH guard in same deploy |
| State machine guards | Admin loses emergency override capability (Pitfall 8) | Allow `force: true` admin overrides with audit logging |
| Race condition fixes | Deadlock from nested locking (Pitfall 4) | Use `SKIP LOCKED` or single atomic UPDATE, avoid nested transactions |
| Rate limiting restoration | Legitimate traffic blocked by tighter limits (Pitfall 5) | Start 2x higher than target, monitor, then tighten |
| RPC/migration changes | Swallowed catch hides new RPC failures (Pitfall 6) | Remove try/catch swallow when RPC exists, log errors |
| Supabase type regen | Exposes unrelated type errors from schema drift (Pitfall 11) | Do first, fix all type errors before other phases |
| Integration tests | Cross-test state pollution in parallel execution (Pitfall 9) | Unique UUIDs per test, cleanup hooks, sequential for DB tests |
| `handlers.ts` split | Webhook event routing silently breaks (Pitfall 14) | Barrel re-exports, test every event type |

## Migration Ordering Risks

The fixes in this milestone have **ordering dependencies**:

1. **Type regeneration first** (Pitfall 11) -- other fixes benefit from accurate types, and this may surface hidden issues
2. **State machine + admin guard together** (Pitfalls 3, 8) -- deploying start guard without admin guard creates a dead state
3. **Timezone fixes as a batch** (Pitfalls 1, 2, 7) -- all timezone-related code should be audited and fixed in one pass to avoid format inconsistency
4. **RPC migration before code change** (Pitfall 6) -- the RPC must exist in production before the code that removes the try/catch is deployed
5. **Rate limiting last** (Pitfall 5) -- this is the highest-risk operational change and should be deployed with monitoring, after all other fixes are stable

Deploying these out of order risks the fixes themselves becoming bugs.

---

## Sources

- Codebase: `src/app/api/driver/routes/active/route.ts`, `src/app/api/driver/routes/[routeId]/start/route.ts`, `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts`, `src/app/api/checkout/session/route.ts`, `src/app/api/checkout/session/helpers.ts`, `src/app/api/cron/delivery-reminders/route.ts`, `src/lib/rate-limit/client.ts`, `src/lib/rate-limit/check.ts`, `src/lib/utils/delivery-dates.ts`, `src/lib/validations/driver-api.ts`
- Migrations: `20260312_route_pipeline_hardening.sql`, `20260316_route_status_enum_extend.sql`, `20260316_route_status_backfill.sql`
- [Vercel serverless timezone discussion](https://github.com/vercel/vercel/discussions/4158) -- confirms Vercel runs in UTC, TZ env var behavior
- [Next.js hydration mismatch with dates](https://github.com/vercel/next.js/discussions/37877) -- server/client timezone divergence
- [PostgreSQL race conditions prevention](https://dev.to/mistval/winning-race-conditions-with-postgresql-54gn) -- SELECT FOR UPDATE SKIP LOCKED pattern
- [Supabase SERIALIZABLE isolation discussion](https://github.com/orgs/supabase/discussions/30334) -- SERIALIZABLE alone insufficient for high concurrency
- [PostgreSQL migration safety](https://medium.com/preply-engineering/postgresql-schema-change-gotchas-bf904e2d5bb7) -- ACCESS EXCLUSIVE lock risks
- [Upstash rate limiting for serverless](https://upstash.com/blog/upstash-ratelimit) -- slidingWindow algorithm, analytics completion in background
- [Upstash + Vercel KV rate limiting example](https://upstash.com/examples/ratelimitingwithvercelkv) -- integration pattern
