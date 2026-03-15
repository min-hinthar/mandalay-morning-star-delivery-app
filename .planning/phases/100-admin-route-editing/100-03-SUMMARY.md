---
phase: 100-admin-route-editing
plan: 03
subsystem: ui
tags: [drag-reorder, move-buttons, driver-reassignment, optimistic-ui, hooks]

# Dependency graph
requires: [100-01]
provides:
  - "useReorderStops hook with optimistic reorder and error revert"
  - "useReassignDriver hook with in_progress confirmation dialog"
  - "StopsList with DragReorderList integration and mobile move buttons"
  - "RouteStopCard drag handle and move button slots"
  - "DriverInfoCard with reassignment confirmation dialog"
affects: [100-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Optimistic reorder with error callback revert", "Confirmation gate for in_progress mutations", "SortableItem render-function children for handle-only drag"]

key-files:
  created:
    - src/lib/hooks/useReorderStops.ts
    - src/lib/hooks/useReassignDriver.ts
    - src/lib/hooks/__tests__/useReorderStops.test.ts
    - src/lib/hooks/__tests__/useReassignDriver.test.ts
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailSkeleton.tsx
  modified:
    - src/components/ui/admin/routes/StopsList.tsx
    - src/components/ui/admin/routes/RouteStopCard/RouteStopCard.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
    - src/components/ui/admin/routes/RouteDetailClient/DriverInfoCard.tsx
    - src/components/ui/DragReorderList/SortableItem.tsx
    - src/components/ui/DragReorderList/DragHandle.tsx
    - src/components/ui/DragReorderList/index.tsx

key-decisions:
  - "useReassignDriver hook lives in RouteDetailClient, passes confirmation state down to DriverInfoCard"
  - "SortableItem refactored to render-function children pattern for handle-only drag activation"
  - "Extracted RouteDetailSkeleton to keep RouteDetailClient under 400-line ESLint limit"
  - "Used project toast (useToastV8) not sonner for consistency with codebase"

patterns-established:
  - "SortableItem render-function children: ({ listeners, attributes, isDragging }) => ReactNode"
  - "RouteStopCard slot pattern: optional dragHandle/moveButtons ReactNode props"

requirements-completed: [ROUTE-01, ROUTE-02, ROUTE-05]

# Metrics
duration: 13min
completed: 2026-03-15
---

# Phase 100 Plan 03: Drag Reorder, Move Buttons & Driver Reassignment Summary

**Optimistic drag-reorder with DragReorderList wiring, mobile move buttons, and driver reassignment with in_progress confirmation dialog**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-15T07:50:46Z
- **Completed:** 2026-03-15T08:03:43Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Built useReorderStops hook: fires PATCH with stopOrder payload, includes forceOverride for in_progress, calls onError for revert
- Built useReassignDriver hook: confirmation gate for in_progress routes, immediate fire for planned, success/error toasts
- Wrote 12 unit tests (6 per hook) covering success, error, state tracking, forceOverride
- Wired DragReorderList to StopsList with SortableItem render-function children for handle-only drag
- Added DragHandle (desktop, hidden below md) and MoveButtons (mobile, hidden above md) to RouteStopCard via slot props
- Connected RouteDetailClient with optimistic local stops state and reorder/move handlers
- Added confirmation dialog to DriverInfoCard for in_progress driver reassignment
- Refactored SortableItem from spread-all-listeners to render-function pattern for handle-only drag

## Task Commits

1. **Task 1: useReorderStops and useReassignDriver hooks with tests** - `0b3f4987` (feat, TDD)
2. **Task 2: Wire DragReorderList to StopsList, connect RouteDetailClient** - `d0eb288a` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed toast import from sonner to useToastV8**
- **Found during:** Task 1 GREEN phase
- **Issue:** Plan referenced `sonner` toast, but project uses custom `@/lib/hooks/useToastV8`
- **Fix:** Changed both hooks to use project toast API
- **Files modified:** useReorderStops.ts, useReassignDriver.ts

**2. [Rule 3 - Blocking] Fixed SortableAttributes type mismatch**
- **Found during:** Task 2 typecheck
- **Issue:** `Record<string, unknown>` not assignable from `DraggableAttributes` (missing index signature)
- **Fix:** Used `DraggableAttributes` type from @dnd-kit/core directly
- **Files modified:** SortableItem.tsx, DragHandle.tsx

**3. [Rule 2 - Missing] Extracted RouteDetailSkeleton to stay under 400-line limit**
- **Found during:** Task 2 lint
- **Issue:** RouteDetailClient grew to 464 lines with new hook wiring, exceeding max-lines warning
- **Fix:** Extracted skeleton and error state into RouteDetailSkeleton.tsx, compacted handlers
- **Files modified:** RouteDetailClient.tsx, RouteDetailSkeleton.tsx (new)

**4. [Rule 2 - Missing] Added onSuccess callback to useReassignDriver**
- **Found during:** Task 2 wiring
- **Issue:** Hook needed to trigger fetchRoute on successful reassignment
- **Fix:** Added optional onSuccess callback to hook options
- **Files modified:** useReassignDriver.ts

## Issues Encountered
None beyond deviations listed above.

## User Setup Required
None.

## Next Phase Readiness
- Drag-reorder and move buttons fully functional for Plan 100-04 (split/merge UI)
- Driver reassignment confirmation dialog ready
- localStops state pattern established for future optimistic updates

---
*Phase: 100-admin-route-editing*
*Completed: 2026-03-15*
