---
phase: 28-token-enforcement-layout
plan: 03
subsystem: ui
tags: [css-tokens, tailwind, layout, charts, recharts]

# Dependency graph
requires:
  - phase: 28-01
    provides: text-2xs token, ESLint rules for layout enforcement
provides:
  - --tabs-offset layout token for sticky positioning
  - Chart borderRadius using CSS variable tokens
  - Consistent token-based layout positioning
affects: [future-layout-changes, sticky-headers, chart-theming]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS variable tokens for layout positioning (--tabs-offset)
    - CSS variable tokens for borderRadius in Recharts components

key-files:
  created: []
  modified:
    - src/styles/tokens.css
    - src/components/ui/menu/CategoryTabs.tsx
    - src/components/ui/menu/MenuSkeleton.tsx
    - src/components/ui/admin/RevenueChart.tsx
    - src/components/ui/admin/analytics/PerformanceChart.tsx
    - src/components/ui/admin/analytics/PeakHoursChart.tsx
    - src/components/ui/admin/analytics/DeliverySuccessChart.tsx
    - src/components/ui/admin/analytics/ExceptionBreakdown.tsx

key-decisions:
  - "--tabs-offset: 72px as single source of truth for sticky tab positioning"
  - "var(--radius-md) for 8px chart tooltips, var(--radius-xl) for 16px"
  - "MorphingMenu numeric borderRadius values preserved for Framer Motion interpolation"

patterns-established:
  - "Pattern: Use top-[var(--tabs-offset)] for sticky elements below header"
  - "Pattern: Use var(--radius-*) in Recharts contentStyle objects"

# Metrics
duration: 8min
completed: 2026-01-28
---

# Phase 28 Plan 03: Position and Chart Token Migration Summary

**CSS variable tokens for sticky positioning (--tabs-offset) and chart borderRadius (var(--radius-md/xl))**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T03:45:00Z
- **Completed:** 2026-01-28T03:53:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added --tabs-offset: 72px token for sticky tab positioning
- Migrated CategoryTabs and MenuSkeleton from top-[72px] to top-[var(--tabs-offset)]
- Migrated all chart components to use var(--radius-md) and var(--radius-xl) for borderRadius
- Preserved MorphingMenu numeric values for Framer Motion animation interpolation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tabs-offset token and migrate position violations** - `22ab4b9` (feat)
2. **Task 2: Migrate chart inline styles to CSS variables** - Already migrated in prior commits (a5ad85c, b92af27)

**Note:** Chart migrations were completed in Phase 27 refinement work. Task 2 changes were idempotent (no-op).

## Files Created/Modified
- `src/styles/tokens.css` - Added --tabs-offset: 72px layout token
- `src/components/ui/menu/CategoryTabs.tsx` - Uses top-[var(--tabs-offset)]
- `src/components/ui/menu/MenuSkeleton.tsx` - Uses top-[var(--tabs-offset)]
- `src/components/ui/admin/RevenueChart.tsx` - Uses var(--radius-xl), labelClassName
- `src/components/ui/admin/analytics/PerformanceChart.tsx` - Uses var(--radius-md)
- `src/components/ui/admin/analytics/PeakHoursChart.tsx` - Uses var(--radius-md)
- `src/components/ui/admin/analytics/DeliverySuccessChart.tsx` - Uses var(--radius-md)
- `src/components/ui/admin/analytics/ExceptionBreakdown.tsx` - Uses var(--radius-md)

## Decisions Made
- **--tabs-offset value of 72px:** Header (56px) + spacing (16px) for sticky tabs
- **Preserved MorphingMenu numeric borderRadius:** Animation interpolation requires numeric strings

## Deviations from Plan

None - plan executed exactly as written. Chart migrations were already complete from prior work.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 28 token enforcement complete
- Layout tokens (--tabs-offset) now available for future sticky elements
- Chart styling now uses design system tokens for consistency

---
*Phase: 28-token-enforcement-layout*
*Completed: 2026-01-28*
