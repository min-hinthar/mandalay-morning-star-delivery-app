# Codebase Concerns

**Analysis Date:** 2026-03-19

---

## AREA 1: Customer Checkout Delivery Window Flow

### Issue A: `scheduledDate` parsed as local time — potential off-by-one day

**Files:** `src/app/api/checkout/session/route.ts:53`

**Problem:**
```ts
const scheduledDate = new Date(input.scheduledDate + "T12:00:00");
```
`new Date("2026-03-19T12:00:00")` is parsed as **local server time**, not LA time. On Vercel (UTC), `"T12:00:00"` is noon UTC. This is used only for `getZonedDayOfWeek()` and `isPastCutoffForDay()`. Because `getZonedParts()` then converts to LA anyway, the resulting day-of-week is correct for midday UTC. However, this implicit assumption breaks if the server ever runs in a different timezone or if the input date is parsed near midnight. The `T12:00:00` hard-code is a fragile workaround for what should be explicit timezone construction.

**Fix:** Construct with explicit LA offset via `toISOWithTimezone(input.scheduledDate, "12:00")`.

---

### Issue B: COD email sends naive ISO strings for delivery window — no timezone offset

**Files:** `src/app/api/checkout/session/helpers.ts:119-120`, `src/app/api/checkout/session/helpers.ts:158-159`

**Problem:**
The `sendCODOrderEmail` call and `AdminNewOrderAlert` receive:
```ts
deliveryWindowStart: `${opts.scheduledDate}T${opts.timeWindowStart}:00`,
deliveryWindowEnd:   `${opts.scheduledDate}T${opts.timeWindowEnd}:00`,
```
These are **bare ISO strings without timezone**. The DB stores the properly timezone-offset version via `toISOWithTimezone()`, but the email template receives a naive string. If the email template formats this as-is, it may display an incorrect time to customers depending on how their client interprets it. The Stripe checkout path stores correct timezone-aware strings in the DB; COD email construction is inconsistent.

**Fix:** Use `toISOWithTimezone(opts.scheduledDate, opts.timeWindowStart)` when building email props.

---

### Issue C: `getAvailableDeliveryDatesMultiDay` includes cutoff-passed dates for driver-filtered list

**Files:** `src/lib/utils/delivery-dates.ts:283-312`, `src/components/ui/checkout/TimeStepV8.tsx:111-115`

**Problem:**
`getAvailableDeliveryDatesMultiDay` adds all candidates from 3 weeks of offsets **without pre-filtering cutoff-passed ones**. It marks `cutoffPassed: true` on the returned object, and the `TimeSlotPicker` respects that and disables those pills. However, the auto-select `useEffect` in `TimeStepV8` (line 134) uses `availableDates.find((d) => !d.cutoffPassed)` to pick the first non-passed date. If `getAvailableDeliveryDatesMultiDay` returns a cutoff-passed date as the first candidate in the sorted list (possible if cutoff passed today for a same-day delivery), the auto-select skips it correctly — but downstream the `delivery` store state may briefly be `null` until the effect fires, causing the payment step's "Continue" button to flash disabled.

---

### Issue D: Time windows are global — not per-day

**Files:** `src/app/(customer)/checkout/page.tsx:6-10`, `src/app/api/checkout/session/route.ts:43-52`

**Problem:**
`generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour, rules.prepTimeBufferMinutes)` generates a **single set of time windows** for all delivery days. If different delivery days have different operating hours (e.g., Saturday deliveries run 11–15, weekday deliveries run 11–19), there is no per-`DeliveryDayConfig` time window override — all days show the same windows. The checkout server also validates windows against this same global list. No bug currently since the app uses uniform hours, but this will break if per-day hours are needed.

---

### Issue E: Server-side cutoff validation uses `scheduledDate + T12:00:00` and no date future-bound

**Files:** `src/app/api/checkout/session/route.ts:53-81`

**Problem:**
The checkout API validates the scheduled date is not past cutoff, but does **not validate that the date is not too far in the future**. A customer can submit any future `scheduledDate` string. The `createCheckoutSessionSchema` only validates the regex `^\d{4}-\d{2}-\d{2}$`. An order could be placed for a date 2 years from now. No upper bound on schedulable dates.

**Fix:** Add a 30-day (or configurable) upper bound check: reject `scheduledDate` more than N days in the future.

---

## AREA 2: Driver Route Start/Proceed Flow

### Issue F: `active/route` query accepts `assigned` status — driver sees route before accepting

**Files:** `src/app/api/driver/routes/active/route.ts:168`

**Problem:**
```ts
.in("status", ["assigned", "accepted", "planned", "in_progress"])
```
The active route query returns routes in `assigned` status (not yet accepted by driver). The driver's `/driver/route` page SSR also uses the same status list (line 77 of `src/app/(driver)/driver/route/page.tsx`). This means a driver sees a route in their dashboard before they have accepted it. The driver UI must handle this state correctly (shows "Accept Route" CTA). However, if the UI doesn't gate actions correctly, a driver could attempt to `start` a route that is `assigned` (not yet `accepted`). The `start` endpoint allows both `planned` and `accepted` statuses:

```ts
// src/app/api/driver/routes/[routeId]/start/route.ts:57
if (route.status !== "planned" && route.status !== "accepted") {
```

**A route in `assigned` status cannot be started** — but the driver's active route view shows it. If the UI start button is visible for `assigned` status without first requiring acceptance, the driver gets a 400 error. This is likely the main cause of "driver cannot start route."

**Impact:** Driver sees route, taps "Start", gets error, thinks app is broken.

**Fix:** Ensure the driver route UI distinguishes `assigned` vs `accepted`/`planned` and shows "Accept Route" CTA for `assigned`, not "Start Route."

---

### Issue G: Route `planned` status can be seen by driver via `active` endpoint

**Files:** `src/app/api/driver/routes/active/route.ts:168`

**Problem:**
`planned` status (no driver assigned) is included in the active route query filter. A route with no `driver_id` would fail the `driver_id = driverId` equality check and not appear. But a route that is `planned` with a `driver_id` set (legacy behavior before the backfill migration) could appear in the driver's view. The backfill migration (`20260316_route_status_backfill.sql`) correctly updated old `planned` + `driver_id` rows to `assigned`. However, admin can manually assign status `planned` via PATCH `/api/admin/routes/[id]` when setting `status: "planned"` directly (line 341 of `src/app/api/admin/routes/[id]/route.ts`). This bypasses the lifecycle: admin could set a route to `planned` with a driver still attached, creating a confusing state.

---

### Issue H: Stop progression skips `enroute` status for the current stop after start

**Files:** `src/app/api/driver/routes/[routeId]/start/route.ts:89-91`

**Problem:**
On route start, only the **first stop** is set to `enroute`. After the driver marks stop 1 as `delivered`, the next-stop logic sets the following stop to `enroute`:
```ts
// stops/[stopId]/route.ts:180
await supabase.from("route_stops").update({ status: "enroute" }).eq("id", nextStopData.id);
```
This is correct for sequential flow. However, the query for "next stop" only looks for `pending` stops:
```ts
.eq("status", "pending")
```
If a stop was manually set to `skipped` by admin while the driver is in-progress, a subsequent stop that is already `enroute` would be skipped by this query. The `pending` filter is correct for normal flow but does not account for admin-manipulated stops.

---

### Issue I: `updateRouteStats` counts `enroute` as `pending` — misleading dashboard

**Files:** `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts:218-222`

```ts
pending_stops: stops.filter((s) => s.status === "pending" || s.status === "enroute").length,
```
The current stop (`enroute`) is counted as pending in stats, not as "in progress." The completion rate denominator is correct, but the admin operations dashboard shows `pending_stops` as if no stop is currently being served. Minor UX issue, not a blocker.

---

### Issue J: Route complete endpoint silently ignores missing `increment_driver_deliveries` RPC

**Files:** `src/app/api/driver/routes/[routeId]/complete/route.ts:109-118`

```ts
try {
  await supabase.rpc("increment_driver_deliveries", { ... });
} catch {
  // RPC might not exist yet, ignore
}
```
The `increment_driver_deliveries` RPC is **not present in any migration file** (confirmed by grep). This means driver delivery counts are never incremented from route completion. Badge eligibility (`checkAndAwardBadges`) reads `driverRecord?.deliveries_count` which is always 0 + `stats.delivered_stops`, making badge thresholds calculated from a single route's deliveries, not career totals. `calculate_driver_streak` exists in migrations but `increment_driver_deliveries` does not.

**Impact:** Driver gamification metrics (delivery count, badges) are partially broken. `deliveries_count` in the `drivers` table is never updated.

**Fix:** Create `increment_driver_deliveries` RPC migration or replace with a direct `UPDATE drivers SET deliveries_count = deliveries_count + $count WHERE id = $driver_id`.

---

## AREA 3: Rate Limiting — Completely Non-Functional in Production

**Files:** `src/lib/rate-limit/client.ts`

**Problem:**
```ts
// All limiters are null — in-memory fallback handles rate limiting
export const authSignInLimiter: Ratelimit | null = null;
export const checkoutLimiter: Ratelimit | null = null;
// ... all 13 limiters are null
```
Every rate limiter is null. The in-memory fallback (`IN_MEMORY_MAX_REQUESTS = 15` per minute) applies, but it is **per serverless function instance** — not distributed. On Vercel with multiple concurrent instances, each instance has its own bucket. A burst attacker can make 15 requests per instance × N instances = effectively unlimited.

**Impact:** Auth endpoints, checkout, and refunds have no effective distributed rate limiting. The fallback comment in `MEMORY.md` confirms this is a known issue: "Redis Cloud URL incompatible with @upstash/redis."

**Fix:** Provision Upstash REST-compatible Redis and restore `Ratelimit` constructors, or replace with Vercel KV.

---

## AREA 4: `delivery_zones` Table Missing from Supabase TypeScript Types

**Files:** `src/lib/settings/business-rules.ts:125`, `src/app/api/admin/delivery-zones/route.ts:59,103`

**Problem:**
```ts
.from("delivery_zones" as any)
```
The `delivery_zones` table exists in the DB (migration `20260312_delivery_direction_zones.sql`) but is **not in the generated `@/types/database` types**. Three files suppress TypeScript using `as any`. This means no type safety for delivery zone queries — wrong column names or missing fields would silently return incorrect data.

**Fix:** Regenerate Supabase types (`npx supabase gen types typescript`) to include `delivery_zones`.

---

## AREA 5: `revalidateTag` Called with Invalid `{ expire: 0 }` Option

**Files:**
- `src/app/api/admin/delivery-days/route.ts:122`
- `src/app/api/admin/delivery-zones/route.ts:116`
- `src/app/api/admin/settings/route.ts:221`
- `src/app/api/admin/settings/restore/route.ts:121`

**Problem:**
```ts
revalidateTag("business-rules", { expire: 0 });
```
`revalidateTag` in Next.js does **not accept an options object**. The signature is `revalidateTag(tag: string): void`. The `{ expire: 0 }` argument is silently ignored. This means the intent (expire immediately) is not being expressed correctly. The actual effect is the same as `revalidateTag("business-rules")` — which still invalidates the cache correctly — so this is not a functional bug today, but it suggests the `expire` semantics were confused with `unstable_cache`'s `revalidate` option.

**Fix:** Remove the second argument: `revalidateTag("business-rules")`.

---

## AREA 6: Delivery Reminder Cron Uses UTC Date, Not LA Date

**Files:** `src/app/api/cron/delivery-reminders/route.ts:60`

**Problem:**
```ts
const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
```
This computes **UTC "today"**, not LA today. Delivery window timestamps in the DB are stored as LA-offset ISO strings (via `toISOWithTimezone`). The comparison:
```ts
.gte("delivery_window_start", `${today}T00:00:00`)
.lt("delivery_window_start", `${today}T23:59:59`)
```
uses a naive string comparison against timezone-aware DB timestamps. PostgreSQL will compare the raw string, so a delivery window like `2026-03-19T11:00:00-07:00` would be treated as UTC `2026-03-19T11:00:00` for the string filter — which is **wrong**. Between midnight UTC and 7–8 AM LA, the cron would query for the wrong date's orders, potentially sending no reminders or yesterday's reminders.

**Fix:** Use LA timezone for `today`:
```ts
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
```
Then use proper timestamptz comparison with LA offset.

---

## AREA 7: `active/route` Driver API — `customer_name` Not Fetched

**Files:** `src/app/api/driver/routes/active/route.ts:193-204`

**Problem:**
The active route API returns customer info from `profiles!orders_user_id_fkey` but does **not fetch `customer_name` or `customer_phone`** from the `orders` table itself. Meanwhile, the route-detail endpoint (`/api/driver/routes/[routeId]/route.ts:201`) correctly falls back:
```ts
fullName: stop.orders!.customer_name ?? stop.orders!.profiles?.full_name ?? null,
phone:    stop.orders!.customer_phone ?? stop.orders!.profiles?.phone ?? null,
```
The `active` endpoint (`route.ts`) only reads from `profiles`, missing the `customer_name`/`customer_phone` columns added in migration `20260310_order_contact_info.sql`. For COD orders, the profile may have no phone but `customer_phone` on the order does. Driver sees no phone number for some COD customers.

**Impact:** Driver cannot call certain COD customers for delivery coordination.

**Fix:** Add `customer_name` and `customer_phone` to the `orders (...)` select in the active route query.

---

## AREA 8: Business Rules Cache — 5-Minute Stale Window During Operations

**Files:** `src/lib/settings/business-rules.ts:190-193`

```ts
export const getBusinessRules = unstable_cache(fetchBusinessRules, ["business-rules"], {
  tags: ["business-rules"],
  revalidate: 300,
});
```
The cache TTL is 5 minutes. Admin changes to delivery days, zones, or settings may not reflect for up to 5 minutes. `revalidateTag("business-rules")` is called on PATCH but **only affects the server instance that handles the PATCH request** in serverless deployments unless Vercel's data cache is properly configured. In development or single-instance deploys this works. Under production multi-instance load, stale cache entries on other instances persist for up to 5 minutes.

**Impact:** Admin changes cutoff time close to actual cutoff; customers on other instances can still place orders for a closed window for up to 5 minutes.

---

## AREA 9: Race Condition in Route Stop Next-Stop Promotion

**Files:** `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts:167-186`

**Problem:**
After marking a stop `delivered`, the API fetches the next `pending` stop and sets it to `enroute`. This is two separate DB operations (query + update) with no transaction or locking. If the driver rapidly marks two stops (e.g., offline queue drains fast), two parallel requests could both find the same `pending` stop as "next" and both set it to `enroute`. The idempotency comment in the code is incorrect — the duplicate request returns 400 (`Cannot transition from enroute to enroute`) for the second stop update, but the next-stop promotion is unprotected.

**Fix:** Wrap the next-stop promotion in a DB function or use `WHERE status = 'pending'` UPDATE (single atomic update returning the row) instead of SELECT + UPDATE.

---

## AREA 10: `ContactInfoSection` eslint-disable-next-line on fetchProfile Dependencies

**Files:** `src/components/ui/checkout/ContactInfoSection.tsx:63,75`

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```
`fetchProfile` reads `customerName` and `customerPhone` from store but is memoized via `useCallback` with an empty dep array. The second `useEffect` (line 66) depends on `fetchProfile` which is stable — this is correct pattern. However, the inner `fetchProfile` function closes over `customerName` and `customerPhone` from the outer scope of the component. Since `useCallback` has empty deps, stale closures could prevent auto-fill if the store already has values from a previous session. The practical effect is benign (user already has their data), but the `eslint-disable` hides a real stale-closure situation.

---

## Tech Debt

### `delivery_zones` Type Missing from DB Types
- Issue: `as any` casts in 3 locations
- Files: `src/lib/settings/business-rules.ts`, `src/app/api/admin/delivery-zones/route.ts`
- Fix: Run `npx supabase gen types typescript`

### Deprecated Legacy Gate Still in Use
- `useDeliveryGate` (Saturday-only) and `computeDeliveryGate` are marked `@deprecated` but still instantiated in `CheckoutClient.tsx` as the fallback when `deliveryDays.length === 0`
- Files: `src/app/(customer)/checkout/CheckoutClient.tsx:91-93`, `src/lib/hooks/useDeliveryGate.ts`
- Impact: If `delivery_days` table is empty (e.g., misconfiguration), checkout silently falls back to legacy Saturday-only logic

### `handlers.ts` Exceeds Line Limit with eslint-disable
- File: `src/app/api/webhooks/stripe/handlers.ts:1` (`/* eslint-disable max-lines */`)
- 529 lines — needs split into separate handler files per event type

### Per-Day Time Window Configuration Not Implemented
- `DeliveryDayConfig` has no `startHour`/`endHour` fields
- All delivery days share global `deliveryStartHour`/`deliveryEndHour` from `app_settings`
- Adding different hours per day requires schema change + `generateTimeWindows` refactor

### No Stripe Webhook Signature Secret Validation Failure Logging
- File: `src/app/api/webhooks/stripe/route.ts`
- Stripe signature verification failures should be logged with the raw event for debugging; currently just returns 400

### `increment_driver_deliveries` RPC Does Not Exist
- Referenced in `src/app/api/driver/routes/[routeId]/complete/route.ts:109`
- Silently swallowed with `// RPC might not exist yet, ignore`
- Driver `deliveries_count` is never incremented from route completion

---

## Security Considerations

### No Future Date Upper Bound on Checkout
- Risk: Orders can be placed for any future date
- Files: `src/app/api/checkout/session/route.ts`, `src/lib/validations/checkout.ts`
- Current mitigation: None
- Recommendation: Validate `scheduledDate <= today + 30 days`

### Rate Limiting Bypass via Multiple Serverless Instances
- Risk: In-memory fallback is per-instance; brute force auth/checkout possible
- Files: `src/lib/rate-limit/client.ts`
- Current mitigation: 15 req/min per instance (not distributed)
- Recommendation: Provision Upstash REST Redis

### CRON_SECRET Must Be Configured
- File: `src/app/api/cron/delivery-reminders/route.ts:26-35`
- The cron endpoint fails CLOSED if `CRON_SECRET` is unset — this is correct behavior and well-guarded

---

## Performance Bottlenecks

### `getDeliveryPhotoSignedUrl` in `Promise.all` Per Stop
- Problem: Signed URL generation is called for every stop in parallel on route detail fetch
- Files: `src/app/api/driver/routes/[routeId]/route.ts:181-214`, `src/app/api/driver/routes/active/route.ts:181-215`
- Cause: `Promise.all(route.route_stops.map(async (stop) => ({ deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(...) })))`
- With 10 stops, 10 parallel signed URL calls on every route detail fetch
- Improvement: Cache signed URLs or batch generate

### Business Rules Fetched on Every Page Render
- `getBusinessRules()` is called in multiple layout and page components, each triggering its own cache entry lookup
- Files: Layout files `src/app/(customer)/layout.tsx`, `src/app/(public)/layout.tsx`, checkout page, order pages
- The `unstable_cache` with 5-min TTL mitigates DB hits but not cache lookup overhead

---

## Fragile Areas

### Admin Manual Route Status Override Bypasses Lifecycle
- Files: `src/app/api/admin/routes/[id]/route.ts:340-366`
- Admin PATCH can set `status: "in_progress"` or `status: "completed"` directly without going through driver accept flow
- `check_route_completion` DB trigger guards against completing with non-terminal stops, but `in_progress` can be set on a `planned`/`assigned` route without driver action
- Safe modification: Any admin status override should log an audit event

### `ignoreDuplicates` on Profile Upsert Won't Fill Null Columns
- File: `src/app/api/checkout/session/route.ts:174-192`
- `onConflict: "id", ignoreDuplicates: true` will not update `email` or `role` if the row exists with null values
- The `CLAUDE.md` gotcha documents this: use `DO UPDATE WHERE col IS NULL`
- Low risk since `ensureProfile` runs first and handles the primary path

### `getAvailableDeliveryDatesMultiDay` Does Not Pre-Filter Cutoff-Passed Dates from Candidates
- File: `src/lib/utils/delivery-dates.ts:283-312`
- Cutoff-passed dates from the first week of iteration are included in results with `cutoffPassed: true`
- Client respects this flag; however, if `count` is small (6), past-cutoff dates consume slots that could show future available dates
- Impact: Customer may see fewer available dates than expected if multiple days have passed cutoff

### Route Stop `enroute` → `delivered` Direct Transition (Simple Mode)
- File: `src/lib/validations/driver-api.ts:50-56`
- `pending → delivered` and `enroute → delivered` are valid to support "simple mode" drivers
- This means a driver can skip the `arrived` step. The next-stop promotion in `stops/[stopId]/route.ts:167` only triggers on `delivered` or `skipped`, not on `enroute`, so the `arrived` → `delivered` path correctly does not double-promote
- Correct behavior, but subtle interaction worth noting

### `getAvailableDeliveryDates` (Legacy) Uses `date.date.getTime()` for Week Offset
- File: `src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx:54-61`
- `weekOffsets` computed using `Date.getTime()` difference / ms per day. If server and client have clock skew, the offset could be wrong by 1 day, incorrectly showing "Next Week" badge on today's date

---

## Test Coverage Gaps

### No Integration Test for Driver Route Start → Stop Complete Flow
- What's not tested: The full E2E sequence: route `assigned` → driver accept → route start → stop mark arrived → stop mark delivered → next stop promoted → route complete
- Files: `src/app/api/driver/routes/[routeId]/start/route.ts`, `stops/[stopId]/route.ts`, `complete/route.ts`
- Risk: Status state machine bugs (like Issue F above) would not be caught
- Priority: High

### No Test for COD Email Timezone Bug (Issue B)
- What's not tested: That `sendCODOrderEmail` passes timezone-aware delivery window strings
- Files: `src/app/api/checkout/session/helpers.ts:119-120`
- Priority: Medium

### No Test for Delivery Reminder Cron UTC vs LA Date Bug (Issue 6)
- What's not tested: That the cron computes today in LA timezone, not UTC
- Files: `src/app/api/cron/delivery-reminders/route.ts:60`
- Priority: Medium

### `increment_driver_deliveries` Silently Not Tested
- The `try/catch` swallow means no test would catch if the RPC was later removed or renamed
- Files: `src/app/api/driver/routes/[routeId]/complete/route.ts:109-118`
- Priority: Medium

---

*Concerns audit: 2026-03-19*
