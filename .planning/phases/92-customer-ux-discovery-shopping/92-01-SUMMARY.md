---
phase: 92-customer-ux-discovery-shopping
plan: 01
subsystem: ui
tags: [react, search, filtering, dietary, menu, zustand]

# Dependency graph
requires:
  - phase: 90-admin-menu-photo
    provides: menu data with tags, isSoldOut fields
provides:
  - useMenuFilters hook with text search, dietary AND-logic, sold-out sorting
  - MenuHeader with always-visible search bar and collapsible dietary chip row
  - MenuContent with integrated filtering, empty-state, and category pruning
affects: [92-customer-ux-discovery-shopping]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side menu filtering with local React state (not Zustand/URL params)"
    - "Collapsible header section using AnimatePresence + height animation"
    - "AND-logic dietary filtering via every() on item.tags"

key-files:
  created:
    - src/lib/hooks/useMenuFilters.ts
  modified:
    - src/components/ui/menu/MenuHeader.tsx
    - src/components/ui/menu/MenuContent.tsx
    - src/lib/hooks/index.ts

key-decisions:
  - "Removed query prop from MenuHeader — SearchInput manages its own internal state, only onQueryChange callback needed"
  - "Filter state kept local in useMenuFilters (useState) per research recommendation — no Zustand or URL params"
  - "Renamed modifiers.map callback param from m to mod to avoid shadowing framer-motion m import"

patterns-established:
  - "useMenuFilters: composable filter hook returning filterItems(categories) for client-side menu filtering"
  - "Collapsible dietary chips row: AnimatePresence with height variants driven by useScrollDirection"

requirements-completed: [CUX-01, CUX-02, CUX-03]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 92 Plan 01: Search, Dietary Filters, and Sold-Out Sorting Summary

**Always-visible search bar with 6 dietary filter chips using AND logic, sold-out items sorted to bottom, and empty category pruning**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-03T19:38:47Z
- **Completed:** 2026-03-03T19:53:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created useMenuFilters hook with text search (nameEn/nameMy/descriptionEn), dietary AND-logic, sold-out sorting, and empty category pruning
- Updated MenuHeader to always show search bar (mobileCollapsible={false}) with collapsible dietary chip row using AnimatePresence
- Integrated filtering into MenuContent with "No items match your filters" empty state and "Clear filters" button
- Category tabs dynamically update to reflect filtered categories

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMenuFilters hook and wire search + dietary filters into MenuHeader** - `dfabedb8` (feat)
2. **Task 2: Wire filtering and sold-out sorting into MenuContent** - `5e84c4b9` (feat)

## Files Created/Modified
- `src/lib/hooks/useMenuFilters.ts` - New hook: text search, dietary AND-logic, sold-out sort, category pruning
- `src/components/ui/menu/MenuHeader.tsx` - Always-visible search, DietaryChipPicker below search row, scroll-collapse animation
- `src/components/ui/menu/MenuContent.tsx` - Integrated useMenuFilters, renders MenuHeader, filter empty state
- `src/lib/hooks/index.ts` - Re-export useMenuFilters and UseMenuFiltersReturn type

## Decisions Made
- Removed `query` prop from MenuHeader interface since SearchInput manages its own internal query state; only `onQueryChange` callback is needed
- Used local useState in useMenuFilters (not Zustand or URL params) per research recommendation for ~50 items
- Renamed `m` parameter in modifiers.map to `mod` to avoid shadowing framer-motion `m` import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused query prop from MenuHeader**
- **Found during:** Task 1
- **Issue:** Plan specified `query: string` prop for MenuHeader, but SearchInput manages its own internal state and doesn't accept a controlled value prop. TypeScript noUnusedLocals flagged the unused destructured prop.
- **Fix:** Removed `query` from MenuHeaderProps interface and destructuring
- **Files modified:** src/components/ui/menu/MenuHeader.tsx
- **Verification:** pnpm typecheck passes
- **Committed in:** dfabedb8

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor interface simplification. No scope creep.

## Issues Encountered
- Pre-existing build failure: `pnpm build` fails on HEAD due to `next/headers` import leaking into client component tree via `CartBar -> business-rules -> supabase/server`. This is not caused by plan 92-01 changes (verified by testing on stashed HEAD). Logged as deferred item.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Menu filtering infrastructure complete for plans 02-04
- useMenuFilters hook available for reuse in other components
- Build failure is pre-existing and should be addressed separately

## Self-Check: PASSED

- All 4 files exist on disk
- Both task commits (dfabedb8, 5e84c4b9) found in git log
- Typecheck and lint pass cleanly

---
*Phase: 92-customer-ux-discovery-shopping*
*Completed: 2026-03-03*
