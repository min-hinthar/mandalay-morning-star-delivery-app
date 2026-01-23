---
phase: 10-token-migration
plan: 01
subsystem: ui
tags: [tailwind, z-index, design-tokens, homepage]

# Dependency graph
requires:
  - phase: 09-analysis-component-creation
    provides: TimeStepV8, dead code analysis
provides:
  - z-dropdown token migration for 7 homepage components
  - local stacking context documentation pattern
  - inline style pattern for negative z-index
affects: [10-02, 10-03, 10-04, 11-v8-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "z-dropdown token for z-10 replacements"
    - "inline style for negative z-index values"
    - "local stacking context documentation pattern"

key-files:
  created: []
  modified:
    - src/components/homepage/Timeline.tsx
    - src/components/homepage/TestimonialsSection.tsx
    - src/components/homepage/HowItWorksTimeline.tsx
    - src/components/homepage/HomepageHero.tsx
    - src/components/homepage/CoverageSection.tsx
    - src/components/homepage/Hero.tsx
    - src/components/homepage/FloatingFood.tsx

key-decisions:
  - "z-dropdown replaces all z-10 Tailwind classes in homepage"
  - "Inline style for negative z-index (no Tailwind support)"
  - "Local zIndex 1-4 values preserved with documentation"

patterns-established:
  - "z-10 migration: Replace with z-dropdown token class"
  - "Negative z-index: Use inline style={{ zIndex: -N }}"
  - "Local stacking: Document with comment block, do NOT migrate"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 10 Plan 01: Homepage Z-Index Token Migration Summary

**Migrated 7 homepage components from hardcoded z-10 to z-dropdown token, documented local stacking contexts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T09:31:18Z
- **Completed:** 2026-01-23T09:35:23Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Migrated all z-10 Tailwind classes to z-dropdown token in 6 homepage files
- Converted negative z-index (-z-10) to inline style pattern in HomepageHero.tsx
- Added local stacking context documentation to Hero.tsx and FloatingFood.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 5 homepage files to z-index tokens** - `303ea62` (feat)
2. **Task 2: Document local stacking contexts** - `cd9fe78` (docs)
3. **Additional: Hero.tsx z-10 migration** - `3cac692` (feat)

## Files Modified

| File | Changes |
|------|---------|
| `src/components/homepage/Timeline.tsx` | z-10 -> z-dropdown (1 instance) |
| `src/components/homepage/TestimonialsSection.tsx` | z-10 -> z-dropdown (1 instance) |
| `src/components/homepage/HowItWorksTimeline.tsx` | z-10 -> z-dropdown (2 instances) |
| `src/components/homepage/HomepageHero.tsx` | z-10 -> z-dropdown, -z-10 -> inline style |
| `src/components/homepage/CoverageSection.tsx` | z-10 -> z-dropdown (2 instances) |
| `src/components/homepage/Hero.tsx` | z-10 -> z-dropdown, local stacking docs |
| `src/components/homepage/FloatingFood.tsx` | Local stacking context documentation |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use z-dropdown token | Semantic meaning (dropdown layer = 10) matches existing z-10 usage |
| Inline style for negative z-index | Tailwind doesn't support custom negative z-index values |
| Preserve local zIndex 1-4 values | Hero/FloatingFood use local stacking, not global layers |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Additional z-10 in Hero.tsx**
- **Found during:** Task 2 verification
- **Issue:** Hero.tsx had z-10 in button span at line 352, missed in Task 1
- **Fix:** Migrated to z-dropdown
- **Files modified:** src/components/homepage/Hero.tsx
- **Committed in:** 3cac692 (additional commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor oversight in plan - Hero.tsx had both local stacking (zIndex: 1-4) AND a Tailwind z-10 class. Both handled appropriately.

## Issues Encountered

- Pre-existing infrastructure issues (missing node_modules) prevented full ESLint/typecheck verification
- Verified changes manually via grep - all success criteria met

## Next Phase Readiness

- Homepage z-index migration complete
- Ready for 10-02 (Checkout Flow Migration)
- Pattern established for remaining token migrations

---
*Phase: 10-token-migration*
*Plan: 01*
*Completed: 2026-01-23*
