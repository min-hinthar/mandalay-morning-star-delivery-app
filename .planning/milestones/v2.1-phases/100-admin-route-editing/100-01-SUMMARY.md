---
phase: 100-admin-route-editing
plan: 01
subsystem: ui
tags: [dnd-kit, drag-reorder, route-editing, component-extraction, radix-dropdown]

# Dependency graph
requires: []
provides:
  - "DragReorderList generic component (DndContext + SortableContext + DragOverlay)"
  - "DragHandle desktop drag initiator (6-dot grip, hidden below md)"
  - "MoveButtons mobile reorder (up/down chevrons, 44px touch targets)"
  - "RouteStopCard subfolder extraction (StopCardContent + StopCardActions)"
  - "RouteActionsMenu three-dot dropdown shell (Split/Merge/Delete items)"
affects: [100-02, 100-03, 100-04]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: ["Generic drag-reorder list with responsive handle/buttons", "Contextually filtered dropdown menu items"]

key-files:
  created:
    - src/components/ui/DragReorderList/DragReorderList.tsx
    - src/components/ui/DragReorderList/SortableItem.tsx
    - src/components/ui/DragReorderList/DragHandle.tsx
    - src/components/ui/DragReorderList/MoveButtons.tsx
    - src/components/ui/DragReorderList/index.tsx
    - src/components/ui/admin/routes/RouteStopCard/RouteStopCard.tsx
    - src/components/ui/admin/routes/RouteStopCard/StopCardContent.tsx
    - src/components/ui/admin/routes/RouteStopCard/StopCardActions.tsx
    - src/components/ui/admin/routes/RouteStopCard/index.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteActionsMenu.tsx
  modified:
    - src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "SortableItem passes listeners to all children (handle-only drag to be enforced in Plan 100-02 when wiring)"
  - "RouteActionsMenu hides entirely on completed routes rather than showing disabled items"
  - "hasSameDatePlannedRoutes hardcoded false until Plan 100-04 wires actual route data"

patterns-established:
  - "DragReorderList<T> generic: items + renderItem + renderOverlay + getItemId pattern"
  - "Component subfolder extraction: Orchestrator + Content + Actions split"
  - "Contextual menu filtering: compute show* booleans, return null if none visible"

requirements-completed: [ROUTE-01, ROUTE-02]

# Metrics
duration: 13min
completed: 2026-03-15
---

# Phase 100 Plan 01: Infrastructure Components Summary

**@dnd-kit installed with generic DragReorderList component, RouteStopCard extracted into subfolder, and RouteActionsMenu three-dot dropdown shell added to RouteHeader**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-15T07:32:10Z
- **Completed:** 2026-03-15T07:45:20Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities for drag-reorder infrastructure
- Built generic DragReorderList component with DragHandle (desktop), MoveButtons (mobile), SortableItem, and DragOverlay
- Extracted RouteStopCard (317 lines) into subfolder with StopCardContent + StopCardActions, preserving all behavior
- Added RouteActionsMenu dropdown shell with contextually filtered Split/Merge/Delete items

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @dnd-kit, extract RouteStopCard, build DragReorderList** - `f1235d52` (feat)
2. **Task 2: Add RouteActionsMenu dropdown shell to RouteHeader** - `1ad9d181` (feat)

## Files Created/Modified
- `src/components/ui/DragReorderList/DragReorderList.tsx` - Generic drag-reorder list with DndContext, sensors, DragOverlay
- `src/components/ui/DragReorderList/SortableItem.tsx` - useSortable wrapper with ghost effect and dashed placeholder
- `src/components/ui/DragReorderList/DragHandle.tsx` - 6-dot grip icon, hidden below md breakpoint, touch-none
- `src/components/ui/DragReorderList/MoveButtons.tsx` - Up/down chevrons for mobile, 44px touch targets
- `src/components/ui/DragReorderList/index.tsx` - Barrel exports
- `src/components/ui/admin/routes/RouteStopCard/RouteStopCard.tsx` - Orchestrator: renders Content + Actions in animated card
- `src/components/ui/admin/routes/RouteStopCard/StopCardContent.tsx` - Display-only: customer info, order summary, timestamps, photos, exceptions
- `src/components/ui/admin/routes/RouteStopCard/StopCardActions.tsx` - Status dropdown, reassign dropdown, remove button with confirm dialog
- `src/components/ui/admin/routes/RouteStopCard/index.tsx` - Barrel export with type
- `src/components/ui/admin/routes/RouteDetailClient/RouteActionsMenu.tsx` - Three-dot dropdown with Split/Merge/Delete items
- `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` - Added RouteActionsMenu and new props
- `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx` - Wired no-op callbacks for actions menu
- `package.json` - Added @dnd-kit dependencies
- `pnpm-lock.yaml` - Lock file updated

## Decisions Made
- Used inline type `Record<string, Function>` for DragHandle listeners instead of deep @dnd-kit import path (not publicly exported as module)
- RouteActionsMenu returns null when no items would show (completed routes), matching CONTEXT.md "hide unavailable" directive
- RouteStopCard split preserves exact JSX and behavior -- pure structural refactor with no visual/functional changes

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Next.js build lock file conflict (stale .next/lock from concurrent process) -- resolved by cleaning .next directory
- lint-staged in pre-commit hook restored original file state on first commit attempt for Task 2 -- re-applied changes and committed successfully

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DragReorderList ready for wiring in Plan 100-02 (drag-reorder stops)
- RouteStopCard subfolder ready for selection mode additions in Plan 100-03 (split route)
- RouteActionsMenu shell ready for callback wiring in Plan 100-04

---
*Phase: 100-admin-route-editing*
*Completed: 2026-03-15*
