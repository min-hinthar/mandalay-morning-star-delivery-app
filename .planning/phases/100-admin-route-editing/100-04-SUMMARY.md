---
phase: 100-admin-route-editing
plan: 04
subsystem: ui
tags: [split-route, merge-route, selection-mode, modals, hooks, checkbox-selection]

# Dependency graph
requires:
  - phase: 100-01
    provides: RouteActionsMenu shell, RouteStopCard subfolder, DragReorderList
  - phase: 100-02
    provides: split_route and merge_routes RPCs, API endpoints
  - phase: 100-03
    provides: useReorderStops, useReassignDriver, StopsList with DragReorderList
provides:
  - "useSplitRoute hook for split route API mutation"
  - "useMergeRoutes hook for merge routes API mutation"
  - "useRouteActions hook for split/merge/delete state management"
  - "route-selection-utils: 5 pure functions for stop selection logic"
  - "SplitRouteModal with driver picker and selected stop summary"
  - "MergeRouteModal with radio route picker"
  - "RouteStopCard inline checkbox selection mode"
  - "StopsList selection mode with Select All/Deselect All"
  - "Floating split toolbar in RouteDetailClient"
  - "Delete route confirmation dialog"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["Inline checkbox selection mode on cards", "Floating bottom toolbar for batch actions", "useStopMutations extraction for file size management"]

key-files:
  created:
    - src/components/ui/admin/routes/route-selection-utils.ts
    - src/components/ui/admin/routes/__tests__/route-selection.test.ts
    - src/lib/hooks/useSplitRoute.ts
    - src/lib/hooks/useMergeRoutes.ts
    - src/lib/hooks/__tests__/useSplitRoute.test.ts
    - src/lib/hooks/__tests__/useMergeRoutes.test.ts
    - src/lib/hooks/useRouteActions.ts
    - src/components/ui/admin/routes/RouteDetailClient/SplitRouteModal.tsx
    - src/components/ui/admin/routes/RouteDetailClient/MergeRouteModal.tsx
    - src/components/ui/admin/routes/RouteDetailClient/useStopMutations.ts
  modified:
    - src/components/ui/admin/routes/RouteStopCard/RouteStopCard.tsx
    - src/components/ui/admin/routes/StopsList.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx

key-decisions:
  - "Extracted useStopMutations from RouteDetailClient to stay under 400-line ESLint limit"
  - "Selection mode renders simplified card layout with checkbox + stop number + customer name + address"
  - "Floating bottom toolbar for split confirmation instead of inline button"
  - "ConfirmDialog from admin/settings reused for delete confirmation"

patterns-established:
  - "Inline selection mode: selectionMode prop toggles simplified card rendering with checkboxes"
  - "useRouteActions: centralized split/merge/delete state management hook"
  - "Floating toolbar pattern: fixed bottom bar for batch action confirmation"

requirements-completed: [ROUTE-03, ROUTE-04]

# Metrics
duration: 12min
completed: 2026-03-15
---

# Phase 100 Plan 04: Split & Merge Route UI Summary

**Inline checkbox selection mode on stop cards, SplitRouteModal with driver picker, MergeRouteModal with route picker, and useRouteActions state management extraction**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-15T08:06:52Z
- **Completed:** 2026-03-15T08:19:49Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Built 5 pure selection utility functions with 13 tests covering toggle, selectAll, validate, getSelectable
- Built useSplitRoute and useMergeRoutes hooks with toast feedback, 9 tests covering API calls, error handling, state tracking
- Created SplitRouteModal with driver picker dropdown and selected stop summary list
- Created MergeRouteModal with radio button route picker for same-date planned routes
- Built useRouteActions hook encapsulating all split/merge/delete state management (~149 lines)
- Added inline checkbox selection mode to RouteStopCard with simplified layout
- Added Select All/Deselect All toggle and selection count to StopsList
- Wired floating split toolbar, all modals, and delete confirmation to RouteDetailClient
- RouteDetailClient stays at 373 lines (under 400 limit) via useStopMutations extraction

## Task Commits

Each task was committed atomically:

1. **Task 1: useSplitRoute, useMergeRoutes, route-selection-utils, and tests (TDD)** - `8600d7fc` (feat)
2. **Task 2: Selection mode, modals, useRouteActions, wire to RouteDetailClient** - `2824d2ee` (feat)

## Files Created/Modified
- `src/components/ui/admin/routes/route-selection-utils.ts` - 5 pure selection logic functions
- `src/components/ui/admin/routes/__tests__/route-selection.test.ts` - 13 tests for selection utils
- `src/lib/hooks/useSplitRoute.ts` - Split route mutation hook with toast feedback
- `src/lib/hooks/useMergeRoutes.ts` - Merge routes mutation hook with toast feedback
- `src/lib/hooks/__tests__/useSplitRoute.test.ts` - 5 tests for split hook
- `src/lib/hooks/__tests__/useMergeRoutes.test.ts` - 4 tests for merge hook
- `src/lib/hooks/useRouteActions.ts` - Split/merge/delete state management (149 lines)
- `src/components/ui/admin/routes/RouteDetailClient/SplitRouteModal.tsx` - Split confirmation modal
- `src/components/ui/admin/routes/RouteDetailClient/MergeRouteModal.tsx` - Merge route picker modal
- `src/components/ui/admin/routes/RouteDetailClient/useStopMutations.ts` - Extracted stop mutation handlers
- `src/components/ui/admin/routes/RouteStopCard/RouteStopCard.tsx` - Added selection mode rendering
- `src/components/ui/admin/routes/StopsList.tsx` - Added selection mode with Select All toggle
- `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx` - Wired all flows

## Decisions Made
- Extracted useStopMutations from RouteDetailClient to stay under 400-line ESLint limit (Rule 2 - missing, needed for correctness)
- Reused existing ConfirmDialog from admin/settings for delete confirmation instead of creating new component
- Selection mode renders simplified card with checkbox + stop number + customer name + address (per locked user decision)
- Floating bottom toolbar for split action instead of inline button for better mobile UX

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extracted useStopMutations to stay under 400-line limit**
- **Found during:** Task 2 (after wiring RouteDetailClient)
- **Issue:** RouteDetailClient grew to 462 lines with new modal/toolbar JSX, exceeding 400-line ESLint warning
- **Fix:** Extracted handleStatusChange, handleStopStatusChange, handleRemoveStop, handleReassign into useStopMutations.ts co-located hook
- **Files modified:** RouteDetailClient.tsx (reduced to 373 lines), useStopMutations.ts (new, 130 lines)
- **Verification:** pnpm lint passes with 0 errors/warnings on modified files
- **Committed in:** 2824d2ee (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary extraction to satisfy ESLint max-lines rule. No scope creep.

## Issues Encountered
- Pre-existing Prettier format issues in 20 files from prior plans -- out of scope, not caused by this plan's changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All route editing operations complete (ROUTE-01 through ROUTE-05)
- Phase 100 fully complete -- ready for phase 101

---
*Phase: 100-admin-route-editing*
*Completed: 2026-03-15*

## Self-Check: PASSED
All 10 created files found. Both commits (8600d7fc, 2824d2ee) verified in git log.
