---
phase: 100-admin-route-editing
plan: 02
subsystem: api, database
tags: [postgres, rpc, zod, supabase, next-api, route-split, route-merge]

requires:
  - phase: 80-route-driver-assignment
    provides: batch_update_stop_indices RPC, reindex_route_stops, update_route_stats, route API patterns
provides:
  - split_route PostgreSQL RPC (atomic route splitting)
  - merge_routes PostgreSQL RPC (atomic route merging)
  - POST /api/admin/routes/[id]/split endpoint
  - POST /api/admin/routes/[id]/merge endpoint
  - splitRouteSchema and mergeRouteSchema Zod validators
  - database.ts type entries for split_route and merge_routes
affects: [100-03-mutation-hooks, 100-04-ui-components]

tech-stack:
  added: []
  patterns: [UPDATE-based stop moves to avoid trigger, SECURITY DEFINER RPCs with DEFERRED constraints]

key-files:
  created:
    - supabase/migrations/20260315_route_editing_rpcs.sql
    - src/app/api/admin/routes/[id]/split/route.ts
    - src/app/api/admin/routes/[id]/merge/route.ts
  modified:
    - src/lib/validations/route.ts
    - src/types/database.ts
    - src/lib/validations/__tests__/route.test.ts

key-decisions:
  - "Used UPDATE route_id (not DELETE+INSERT) to avoid prevent_duplicate_active_assignment trigger"
  - "Used user-scoped supabase client for RPC calls since functions are SECURITY DEFINER"
  - "Conditionally include p_new_driver_id param instead of passing null to satisfy TypeScript optional type"

patterns-established:
  - "RPC endpoint pattern: requireAdmin + Zod validation + supabase.rpc() + error forwarding"
  - "Atomic route operations via SECURITY DEFINER RPCs with SET CONSTRAINTS DEFERRED"

requirements-completed: [ROUTE-03, ROUTE-04]

duration: 8min
completed: 2026-03-15
---

# Phase 100 Plan 02: Route Split/Merge RPCs & API Summary

**Atomic split_route and merge_routes PostgreSQL RPCs with REST API endpoints and Zod validation schemas**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T07:32:12Z
- **Completed:** 2026-03-15T07:40:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- split_route RPC atomically moves selected stops to a new route, reindexes both, returns new route ID
- merge_routes RPC atomically absorbs source route stops into destination, deletes source, returns total stop count
- POST /api/admin/routes/[id]/split validates input and calls split_route RPC
- POST /api/admin/routes/[id]/merge validates input and calls merge_routes RPC
- 8 new Zod schema tests covering edge cases (empty arrays, invalid UUIDs, optional fields)

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase migration, Zod schemas, database.ts types, and schema tests** - `fac078c6` (feat, TDD)
2. **Task 2: API endpoints for split and merge** - `1ff2d0d8` (feat)

## Files Created/Modified
- `supabase/migrations/20260315_route_editing_rpcs.sql` - split_route and merge_routes PostgreSQL functions
- `src/app/api/admin/routes/[id]/split/route.ts` - POST handler for route splitting (63 lines)
- `src/app/api/admin/routes/[id]/merge/route.ts` - POST handler for route merging (57 lines)
- `src/lib/validations/route.ts` - Added splitRouteSchema, mergeRouteSchema, SplitRouteInput, MergeRouteInput
- `src/types/database.ts` - Added split_route and merge_routes function type entries
- `src/lib/validations/__tests__/route.test.ts` - 8 new tests for split/merge schema validation

## Decisions Made
- Used UPDATE route_id (not DELETE+INSERT) to avoid prevent_duplicate_active_assignment trigger firing on INSERT
- Used user-scoped supabase client (from requireAdmin) since RPCs are SECURITY DEFINER -- no need for service client
- Conditionally include p_new_driver_id in RPC args only when driverId is present, to satisfy TypeScript optional type constraint
- Added destination route existence validation in merge_routes RPC (not in plan, Rule 2 - missing validation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch for optional RPC parameter**
- **Found during:** Task 2 (API endpoints)
- **Issue:** Passing `null` for `p_new_driver_id` when database.ts types expect `string | undefined` (optional)
- **Fix:** Conditionally include the parameter only when driverId is present
- **Files modified:** src/app/api/admin/routes/[id]/split/route.ts
- **Verification:** pnpm typecheck passes with no errors in split/merge files
- **Committed in:** 1ff2d0d8 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added destination route existence validation in merge_routes RPC**
- **Found during:** Task 1 (Migration file)
- **Issue:** Research SQL only validated source route status, not destination existence
- **Fix:** Added PERFORM + NOT FOUND check for destination route
- **Files modified:** supabase/migrations/20260315_route_editing_rpcs.sql
- **Verification:** RPC raises exception if destination route not found
- **Committed in:** fac078c6 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Pre-existing uncommitted changes from plan 100-01 (RouteStopCard refactor, DragReorderList) cause typecheck and build failures in RouteDetailClient/RouteHeader files -- not related to this plan's changes. Logged as out-of-scope.

## User Setup Required
None - no external service configuration required. Migration must be applied to Supabase (already tracked in pending todos).

## Next Phase Readiness
- RPCs and API endpoints ready for mutation hooks (plan 100-03)
- Zod schemas ready for frontend form validation
- database.ts types enable type-safe RPC calls

---
*Phase: 100-admin-route-editing*
*Completed: 2026-03-15*

## Self-Check: PASSED
All 6 files found. Both commits (fac078c6, 1ff2d0d8) verified in git log.
