# Phase 80 Plan 04: Driver API Ownership Enforcement Audit

**Requirement:** ROUTE-07 — Drivers can only access their own routes and stops.
**Audit date:** 2026-03-02
**Result: PASS — Defense-in-depth confirmed across all 9 endpoints and 4 RLS policies.**

---

## API Middleware Layer Audit

All endpoints call `requireDriver()` and extract `driverId` before any data access.

| # | Method | Endpoint | Ownership Mechanism | Query Filter / Check | Result |
|---|--------|----------|--------------------|-----------------------|--------|
| 1 | GET | `/api/driver/routes/active` | `.eq("driver_id", driverId)` in SELECT | Filters routes table by `driver_id` before returning | PASS |
| 2 | GET | `/api/driver/routes/upcoming` | `.eq("driver_id", driverId)` in SELECT | Filters routes table by `driver_id`; stop fetch is limited to those route IDs | PASS |
| 3 | GET | `/api/driver/routes/history` | `.eq("driver_id", driverId)` in both COUNT and SELECT | Filters routes table by `driver_id` for count and paginated list; drivers stats fetched via `.eq("id", driverId)` on drivers table | PASS |
| 4 | GET | `/api/driver/routes/[routeId]` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, then explicitly checks ownership before returning data | PASS |
| 5 | POST | `/api/driver/routes/[routeId]/start` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, ownership check before any mutation | PASS |
| 6 | POST | `/api/driver/routes/[routeId]/complete` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, ownership check before complete mutation and badge award | PASS |
| 7 | PATCH | `/api/driver/routes/[routeId]/stops/[stopId]` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, ownership check before stop update; stop fetched with `.eq("route_id", routeId)` double-binding | PASS |
| 8 | POST | `/api/driver/routes/[routeId]/stops/[stopId]/exception` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, ownership check before exception insert; stop fetched with `.eq("route_id", routeId)` double-binding | PASS |
| 9 | POST | `/api/driver/routes/[routeId]/stops/[stopId]/photo` | Post-fetch `route.driver_id !== driverId` check → 403 | Fetches route by `id`, ownership check before storage upload; stop fetched with `.eq("route_id", routeId)` double-binding | PASS |

**Pattern summary:**
- **List endpoints (1-3):** Filter applied in the Supabase query itself via `.eq("driver_id", driverId)`. A driver cannot retrieve rows belonging to another driver even if they supply a different identifier.
- **Single-resource endpoints (4-9):** Route fetched first (RLS also restricts this), then explicit `route.driver_id !== driverId` check returns 403 before any mutation or sub-resource access. Stop fetches for sub-resources additionally use `.eq("route_id", routeId)` to prevent stop-ID guessing across routes.

---

## RLS Policy Layer Audit

Source: `supabase/migrations/002_rls_policies.sql`

### routes table

| Policy Name | Operation | USING Clause | WITH CHECK | Result |
|-------------|-----------|-------------|------------|--------|
| `routes_select` | SELECT | `driver_id = public.get_my_driver_id() OR public.is_admin()` | — | PASS |
| `routes_update` | UPDATE | `driver_id = public.get_my_driver_id() OR public.is_admin()` | `driver_id = public.get_my_driver_id() OR public.is_admin()` | PASS |
| `routes_insert` | INSERT | — | `public.is_admin()` | PASS (drivers cannot INSERT routes) |
| `routes_delete` | DELETE | `public.is_admin()` | — | PASS (drivers cannot DELETE routes) |

### route_stops table

| Policy Name | Operation | USING Clause | WITH CHECK | Result |
|-------------|-----------|-------------|------------|--------|
| `route_stops_select` | SELECT | `EXISTS (SELECT 1 FROM routes r WHERE r.id = route_stops.route_id AND r.driver_id = public.get_my_driver_id()) OR EXISTS (SELECT 1 FROM orders o WHERE o.id = route_stops.order_id AND o.user_id = auth.uid())` | — | PASS |
| `route_stops_update` | UPDATE | `EXISTS (SELECT 1 FROM routes r WHERE r.id = route_stops.route_id AND r.driver_id = public.get_my_driver_id()) OR public.is_admin()` | — | PASS |
| `route_stops_insert` | INSERT | — | `public.is_admin()` | PASS (drivers cannot INSERT stops) |
| `route_stops_delete` | DELETE | `public.is_admin()` | — | PASS (drivers cannot DELETE stops) |

**Note:** `route_stops_select` also allows the customer who owns the order to see their own stop status (order tracking use case). This is correct and expected behavior — it does not expose other drivers' stops.

### delivery_exceptions table

| Policy Name | Operation | USING Clause | Result |
|-------------|-----------|-------------|--------|
| `delivery_exceptions_select` | SELECT | `EXISTS (SELECT 1 FROM route_stops rs JOIN routes r ON rs.route_id = r.id WHERE rs.id = delivery_exceptions.route_stop_id AND r.driver_id = public.get_my_driver_id()) OR public.is_admin()` | PASS |
| `delivery_exceptions_insert` | INSERT | — | Verified by JOIN to routes.driver_id | PASS |

---

## get_my_driver_id() Function

The RLS policies rely on `public.get_my_driver_id()`. This function is defined in `supabase/migrations/001_functions_triggers.sql` and returns the `drivers.id` for the currently authenticated `auth.uid()`. It returns `NULL` for unauthenticated users, causing all RLS checks to fail (returning no rows), which is the correct secure default.

---

## Defense-in-Depth Summary

| Layer | Mechanism | Coverage |
|-------|-----------|----------|
| API Middleware | `requireDriver()` extracts driverId; list endpoints filter in query; single-resource endpoints check `route.driver_id !== driverId` → 403 | All 9 endpoints |
| Database RLS | `routes_select`/`routes_update` use `driver_id = get_my_driver_id()`; `route_stops_select`/`route_stops_update` JOIN on routes.driver_id | All tables accessed by driver endpoints |

Two independent enforcement layers must both be bypassed for a driver to access another driver's data. This satisfies ROUTE-07.

**ROUTE-07 STATUS: VERIFIED COMPLETE**

No gaps found. No code changes required. All endpoints implement ownership enforcement as documented in the research phase (80-RESEARCH.md).
