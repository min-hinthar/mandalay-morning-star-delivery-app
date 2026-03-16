---
phase: 103-tech-debt-nyquist
plan: 01
subsystem: ui, api
tags: [error-handling, toast, optimistic-revert, email-guard, delivery-instructions]

# Dependency graph
requires:
  - phase: 99-admin-order-detail
    provides: OrderDetailPanel, CustomerContactCard, DeliveryInfoCard, order details API
  - phase: 100-route-operations
    provides: useReorderStops, useStopMutations, RouteDetailClient
provides:
  - Guarded email link in CustomerContactCard (no broken mailto on empty email)
  - delivery_instructions visible for unrouted orders via fallback deliveryInfo object
  - Type-annotated routeStop query with .returns<>()
  - Toast feedback on all mutation error catch blocks (StopDetail, useStopMutations)
  - Correct optimistic revert in useReorderStops using pre-mutation stops
affects: [admin-orders, admin-routes, driver-stops]

# Tech tracking
tech-stack:
  added: []
  patterns: [toast-on-every-catch, previousStops-optimistic-revert]

key-files:
  created: []
  modified:
    - src/components/ui/admin/orders/OrderDetailPanel/CustomerContactCard.tsx
    - src/app/api/admin/orders/[id]/details/route.ts
    - src/components/ui/driver/StopDetail.tsx
    - src/lib/hooks/useReorderStops.ts
    - src/components/ui/admin/routes/RouteDetailClient/useStopMutations.ts
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx

key-decisions:
  - "routeStop query uses inline .returns<>() type annotation instead of separate interface"
  - "Fallback deliveryInfo for unrouted orders uses null for all non-instruction fields"
  - "useReorderStops previousStops passed as second parameter (not closure capture) for explicitness"

patterns-established:
  - "Every catch block in mutation hooks must show toast.error — no silent swallows"
  - "Optimistic revert callbacks receive pre-mutation data via explicit parameter"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 103 Plan 01: Error Handling & UX Feedback Gaps Summary

**Fixed 6 silent-error and broken-UI gaps: email guard, unrouted delivery instructions, toast on all mutation errors, correct optimistic revert with pre-mutation stops**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-16T23:21:51Z
- **Completed:** 2026-03-16T23:32:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- GAP-99-01: CustomerContactCard now guards empty email with conditional render
- GAP-99-02: API route returns fallback deliveryInfo for unrouted orders with delivery_instructions
- GAP-99-05: StopDetail saveNotes catch block shows toast error
- GAP-99-06: routeStop query has .returns<>() type annotation
- GAP-100-01: useReorderStops passes pre-mutation stops (not post-mutation) to onError
- GAP-100-04: useStopMutations handleStatusChange and handleStopStatusChange show toast on error

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix CustomerContactCard email guard, DeliveryInfoCard unrouted orders, and order details API** - `ed7dff4e` (fix)
2. **Task 2: Fix silent catch blocks in StopDetail, useReorderStops, and useStopMutations** - `f8d9311b` (fix)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components/ui/admin/orders/OrderDetailPanel/CustomerContactCard.tsx` - Added email truthiness guard around mailto link
- `src/app/api/admin/orders/[id]/details/route.ts` - Added .returns<>() to routeStop query, fallback deliveryInfo for unrouted orders
- `src/components/ui/driver/StopDetail.tsx` - Added toast import and error toast in saveNotes catch
- `src/lib/hooks/useReorderStops.ts` - Added previousStops parameter, passed to onError instead of reorderedStops
- `src/components/ui/admin/routes/RouteDetailClient/useStopMutations.ts` - Added toast to handleStatusChange and handleStopStatusChange catch blocks
- `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx` - Captures localStops before optimistic update, passes as previousStops

## Decisions Made
- routeStop query uses inline .returns<>() type annotation instead of separate interface (matches existing patterns in the file)
- Fallback deliveryInfo for unrouted orders uses null for all non-instruction fields (routeId, routeStatus, timestamps all null)
- useReorderStops previousStops passed as second parameter rather than closure capture for explicitness and testability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated existing test file for new handleReorder signature**
- **Found during:** Task 2 (useReorderStops parameter change)
- **Issue:** Existing tests in `useReorderStops.test.ts` called `handleReorder` with 1 argument; new signature requires 2
- **Fix:** Updated all 6 test call sites to pass `STOPS` as second argument; updated error assertion to expect previousStops
- **Files modified:** `src/lib/hooks/__tests__/useReorderStops.test.ts`
- **Verification:** `pnpm typecheck` passes, all 771 tests pass
- **Committed in:** Already committed in prior plan execution (d39caf33)

---

**Total deviations:** 1 auto-fixed (blocking test update)
**Impact on plan:** Necessary for type safety. No scope creep.

## Issues Encountered
- Lint-staged hook reverted unstaged changes during Task 1 commit, requiring re-application of Task 2 edits (resolved by re-reading and re-editing)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 error handling gaps from v2.1 audit closed
- Ready for Plan 02 (structural gaps) and Plan 03 (test coverage)

## Self-Check: PASSED

- All 7 files verified present on disk
- Commit ed7dff4e verified in git log
- Commit f8d9311b verified in git log

---
*Phase: 103-tech-debt-nyquist*
*Completed: 2026-03-16*
