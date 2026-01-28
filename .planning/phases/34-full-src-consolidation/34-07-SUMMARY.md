---
phase: 34-full-src-consolidation
plan: 07
subsystem: infra
tags: [barrel-export, knip, design-system, tokens]

# Dependency graph
requires:
  - phase: 34-03
    provides: design-system tokens in lib/design-system/tokens/
  - phase: 34-06
    provides: contexts migration complete
provides:
  - lib/design-system barrel export (index.ts)
  - knip entry points for lib/**/index.ts
affects: [34-08, 34-09, 34-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Barrel exports for lib/ subdirectories

key-files:
  created:
    - src/lib/design-system/index.ts
  modified:
    - knip.json

key-decisions:
  - "lib/**/index.ts added as knip entry point pattern"
  - "Barrel re-exports from tokens subdirectory"

patterns-established:
  - "lib/ subdirectories use index.ts barrel exports for public API"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 34 Plan 07: Barrel Exports and Knip Configuration Summary

**lib/design-system barrel export with knip entry point configuration for lib/**/index.ts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28
- **Completed:** 2026-01-28
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Created barrel export for lib/design-system re-exporting z-index and motion tokens
- Added lib/**/index.ts pattern to knip entry points
- Verified knip has no false positives for design-system exports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/design-system barrel export** - `fdf1777` (feat)
2. **Task 2: Update knip configuration** - `baf82ba` (chore)
3. **Task 3: Run knip audit** - verification only, no commit needed

## Files Created/Modified

- `src/lib/design-system/index.ts` - Barrel export re-exporting z-index and motion tokens
- `knip.json` - Added lib/**/index.ts to entry array

## Decisions Made

- **lib/**/index.ts as knip entry pattern:** Future lib barrel exports automatically recognized
- **Barrel re-exports tokens:** Enables `import { zIndex } from "@/lib/design-system"` pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Knip reports 127 unused exports across codebase - this is a pre-existing condition, not introduced by this plan. Design-system exports are correctly recognized (not in unused list). The existing unused exports are candidates for future cleanup but outside scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- lib/design-system has proper barrel export
- knip correctly configured for lib subdirectories
- Ready for 34-08 (types/ consolidation)

---
*Phase: 34-full-src-consolidation*
*Plan: 07*
*Completed: 2026-01-28*
