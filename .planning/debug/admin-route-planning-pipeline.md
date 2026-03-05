---
status: awaiting_human_verify
trigger: "Admin route planning pipelines not working completely — partial success, stops missing/wrong, routes don't save/create, date selectors not accurate/efficient."
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:02:00Z
---

## Current Focus

hypothesis: All 6 identified bugs have been fixed
test: Typecheck + lint pass; need human verification of end-to-end flow
expecting: Route planning pipeline works end to end
next_action: Await human verification

## Symptoms

expected: Route planning pipeline should allow admin to select a delivery date, see all orders for that date as stops, optimize routes, assign drivers, and save the route — end to end.
actual: Pipeline partially works but some steps don't complete. Stops are missing or wrong. Routes don't save/create properly. Date selectors are not accurate or efficient.
errors: No specific error messages — partial success behavior.
reproduction: Go to admin route planning, try to create a route for a delivery date.
started: Current state of the feature — built incrementally across phases.

## Eliminated

## Evidence

- timestamp: 2026-03-04T00:00:30Z
  checked: RouteDetailClient.tsx fetchRoute() — parsing allRoutes response
  found: Line 69 treats API response as array directly (`allRoutes.filter(...)`) but GET /api/admin/routes returns `{ data, pagination }`. Should be `allRoutes.data.filter(...)`. This silently fails — reassign routes dropdown never populates.
  implication: Reassign stop between routes never works on RouteDetail page.

- timestamp: 2026-03-04T00:00:35Z
  checked: CreateRouteModal.tsx fetchOrders() — parsing admin orders response
  found: API returns `{ data, pagination }` but code does `data.filter(...)` on the JSON object — orders list broken.
  implication: CreateRouteModal order list is broken — orders won't load properly.

- timestamp: 2026-03-04T00:00:38Z
  checked: CreateRouteModal.tsx fetchDrivers() — parsing admin drivers response
  found: Same issue — API returns `{ data, pagination }` but code treats response as array directly.
  implication: CreateRouteModal driver list is broken.

- timestamp: 2026-03-04T00:00:45Z
  checked: helpers.ts getNextSaturday() — date selector logic
  found: `isSaturday(today) ? nextSaturday(today) : nextSaturday(today)` — both branches identical! If today IS Saturday, it returns NEXT Saturday instead of today.
  implication: Route builder always skips current Saturday, can't plan same-day deliveries.

- timestamp: 2026-03-04T00:00:50Z
  checked: Routes list page date navigation
  found: Uses subDays/addDays cycling through ALL days. Saturday-only business means 6 out of 7 clicks show empty results.
  implication: Inefficient date navigation for admin workflow.

- timestamp: 2026-03-04T00:00:55Z
  checked: Admin orders API status filter
  found: `/api/admin/orders?status=confirmed,preparing` is called by CreateRouteModal but the API ignores the status param entirely — no `searchParams.get("status")` parsing.
  implication: Returns all orders, relying on client-side filtering (wasteful, potentially returns too many results for paginated endpoint).

## Resolution

root_cause: 6 bugs across the route planning pipeline:
  1. RouteDetailClient parses GET /api/admin/routes response as array instead of { data } — reassign dropdown broken
  2. CreateRouteModal parses GET /api/admin/orders response as array instead of { data } — order list broken
  3. CreateRouteModal parses GET /api/admin/drivers response as array instead of { data } — driver list broken
  4. getNextSaturday() has identical ternary branches — always skips current Saturday
  5. Routes list date navigation cycles through all days instead of Saturdays only
  6. Admin orders API ignores status query param

fix: |
  1. RouteDetailClient.tsx: Unwrap `allRoutesJson.data ?? allRoutesJson` before filtering
  2. CreateRouteModal.tsx (orders): Unwrap `json.data ?? json` before filtering, added Array.isArray guard
  3. CreateRouteModal.tsx (drivers): Unwrap `json.data ?? json` before filtering
  4. helpers.ts: Changed `isSaturday(today) ? nextSaturday(today)` to `isSaturday(today) ? today`
  5. Routes page: Replaced subDays/addDays with previousSaturday/nextSaturday, added "This Sat" button
  6. Admin orders API: Added `searchParams.get("status")` parsing with comma-separated `.in()` filter

verification: Typecheck passes (0 new errors), ESLint passes on all changed files
files_changed:
  - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
  - src/components/ui/admin/routes/CreateRouteModal/CreateRouteModal.tsx
  - src/components/ui/admin/routes/RouteBuilder/helpers.ts
  - src/app/(admin)/admin/routes/page.tsx
  - src/app/api/admin/orders/route.ts
