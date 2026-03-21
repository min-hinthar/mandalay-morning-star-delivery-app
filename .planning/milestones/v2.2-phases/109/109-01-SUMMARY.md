---
phase: 109-quality-maintenance
plan: 01
subsystem: testing
tags: [vitest, integration-tests, driver-lifecycle, supabase-mocks, factories]

requires:
  - phase: 107-data-integrity
    provides: promote_next_stop RPC with FOR UPDATE SKIP LOCKED
  - phase: 105-route-lifecycle-guards
    provides: VALID_ROUTE_TRANSITIONS, VALID_STOP_TRANSITIONS, isValidStatusTransition

provides:
  - createMockRoute, createMockStop, createMockRouteWithStops test factories
  - Driver route lifecycle integration tests (12 test cases)
  - fromMock Supabase chain mock pattern with thenable terminals

affects: [driver-routes, test-infrastructure]

tech-stack:
  added: []
  patterns: [mutable-shared-state sequential tests, thenable chain terminals for Supabase mocks]

key-files:
  created:
    - src/app/api/driver/routes/__tests__/lifecycle.test.ts
  modified:
    - src/test/factories/index.ts

key-decisions:
  - "Thenable chain terminals for Supabase mock chains that resolve without .single()"
  - "Mutable shared state approach for sequential lifecycle test -- routeState/stopStates mutated by mock update calls"

patterns-established:
  - "fromMock dispatch on table name with call counting for multi-chain handlers"
  - "createChainTerminal with .then() method for await-able non-single chains"

requirements-completed: [QUAL-01]

duration: 5min
completed: 2026-03-21
---

# Phase 109 Plan 01: Driver Route Lifecycle Tests Summary

**12 integration tests covering full driver route lifecycle with mocked Supabase chains, route/stop factories, and edge case coverage for skip, concurrency, badges, and error paths**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-21T10:17:10Z
- **Completed:** 2026-03-21T10:21:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Route/stop test factories (createMockRoute, createMockStop, createMockRouteWithStops) added to shared factory file
- Full lifecycle integration test: accept -> start -> arrive -> deliver -> complete in single sequential test
- Coverage for stop skip promotion, SKIP LOCKED concurrency, badge failure resilience, no-stops edge case
- Error path coverage: 401 auth, 403 wrong driver, 404 not found, 400 invalid transition, 500 DB error
- 851 total tests passing, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add route/stop factories** - `b0945309` (test)
2. **Task 2: Create lifecycle integration tests** - `01b6ad8a` (test)

## Files Created/Modified
- `src/test/factories/index.ts` - Added createMockRoute, createMockStop, createMockRouteWithStops with RoutesRow/RouteStopsRow imports
- `src/app/api/driver/routes/__tests__/lifecycle.test.ts` - 12 integration tests for full driver route lifecycle

## Decisions Made
- Made chain terminal objects thenable (added `.then()` method) so `await supabase.from().select().eq()` resolves correctly for chains without `.single()` -- the start handler's route_stops select and orders update chains use this pattern
- Used mutable shared state (`routeState`, `stopStates`) mutated by mock `update()` calls so sequential handler calls see evolved state within a single `it()` block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Chain terminal missing thenable interface**
- **Found during:** Task 2 (lifecycle integration tests)
- **Issue:** `createChainTerminal` returned a plain object that wasn't thenable. Start handler's `await supabase.from("route_stops").select("order_id").eq(...)` resolved to the chain object instead of `{ data, error }`, causing `ordersTransitioned` to be 0
- **Fix:** Added `.then()` method to chain terminal so `await` resolves the value without needing `.single()`
- **Files modified:** `src/app/api/driver/routes/__tests__/lifecycle.test.ts`
- **Verification:** All 12 tests pass, `ordersTransitioned` correctly returns 2
- **Committed in:** `01b6ad8a`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for mock accuracy. No scope creep.

## Issues Encountered
None beyond the chain terminal fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route/stop factories available for any future driver route tests
- fromMock pattern documented for extending to new handler tests
- Ready for Plan 02 (webhook handler split)

---
*Phase: 109-quality-maintenance*
*Completed: 2026-03-21*
