---
phase: 66-backlog-cleanup
plan: 06
subsystem: ui
tags: [react, hooks, refactor, framer-motion, file-organization]

# Dependency graph
requires:
  - phase: none
    provides: n/a
provides:
  - UnifiedMenuItemCard refactored to 303 lines (under 400 limit)
  - useTiltEffect hook for 3D tilt motion
  - useCardInteractions hook for card event handlers
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hook extraction pattern: extract stateful logic into co-located use*.ts files with 'use client' directive"
    - "Touch move handler composition: useCallback combining multiple handler functions"

key-files:
  created:
    - src/components/ui/menu/UnifiedMenuItemCard/useTiltEffect.ts
    - src/components/ui/menu/UnifiedMenuItemCard/useCardInteractions.ts
  modified:
    - src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx

key-decisions:
  - "Kept hooks as internal implementation detail (not exported from barrel index.ts)"
  - "Composed touch move handlers via useCallback in parent rather than hook merger"
  - "Moved isHovered/isMobileTiltActive state into useTiltEffect since it owns tilt lifecycle"
  - "Moved totalQuantityInCart and hasRequiredModifiers into useCardInteractions since they drive interaction logic"

patterns-established:
  - "Hook extraction: co-located use*.ts files with 'use client', typed options/return interfaces"

# Metrics
duration: 14min
completed: 2026-02-15
---

# Phase 66 Plan 06: UnifiedMenuItemCard Refactor Summary

**Extracted useTiltEffect and useCardInteractions hooks, reducing UnifiedMenuItemCard from 541 to 303 lines with zero behavioral changes**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-15T12:26:05Z
- **Completed:** 2026-02-15T12:40:17Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Reduced UnifiedMenuItemCard.tsx from 541 lines to 303 lines (well under 400 limit)
- Extracted 3D tilt effect into useTiltEffect.ts (164 lines) with mouse/touch tracking and spring rotation
- Extracted card interactions into useCardInteractions.ts (240 lines) with click, add, increment, decrement, favorite, and long-press handlers
- All 335 tests pass, lint clean, build succeeds, barrel exports unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract useTiltEffect and useCardInteractions hooks** - `f53389a` (refactor)

## Files Created/Modified

- `src/components/ui/menu/UnifiedMenuItemCard/useTiltEffect.ts` - 3D tilt effect hook with mouse/touch position tracking, spring-smoothed rotation, and tilt style computation
- `src/components/ui/menu/UnifiedMenuItemCard/useCardInteractions.ts` - Card interaction hook with click, add, increment, decrement, favorite toggle, long-press detection, and cart integration
- `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` - Main component reduced to types, config, hook orchestration, and JSX render

## Decisions Made

- Kept new hooks as internal implementation details -- not exported from barrel index.ts since consumers only need UnifiedMenuItemCard
- Moved isHovered and isMobileTiltActive state into useTiltEffect since tilt owns their lifecycle
- Moved totalQuantityInCart and hasRequiredModifiers computations into useCardInteractions since they drive interaction logic
- Used useCallback composition in parent component for combining touch move handlers from both hooks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BKLG-04 backlog item resolved: UnifiedMenuItemCard is under 400 lines
- All consuming components (FeaturedCarousel, MenuGrid, SearchResultsGrid) compile without import changes
- File organization follows established pattern from CLAUDE.md (subfolder with barrel exports)

---

_Phase: 66-backlog-cleanup_
_Completed: 2026-02-15_
