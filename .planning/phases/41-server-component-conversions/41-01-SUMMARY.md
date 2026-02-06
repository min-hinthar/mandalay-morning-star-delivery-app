---
phase: 41-server-component-conversions
plan: 01
subsystem: ui
tags: [react, server-components, loading-states, error-boundaries, playwright, hydration]

# Dependency graph
requires:
  - phase: 40-lcp-quick-wins
    provides: CardImage optimization (LCP baseline established)
provides:
  - RouteLoading component with branded spinner
  - RouteError component with Sentry integration
  - Hydration smoke test infrastructure
affects: [41-02, 41-03, 41-04, 41-05, server-component-conversions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RouteLoading for route segment loading states
    - RouteError for route segment error boundaries
    - Parameterized Playwright hydration testing

key-files:
  created:
    - src/components/ui/RouteLoading.tsx
    - src/components/ui/RouteError.tsx
    - e2e/hydration-smoke.spec.ts
  modified: []

key-decisions:
  - "RouteLoading uses existing BrandedSpinner, not new spinner"
  - "RouteError follows global error.tsx style with Sentry tagging"
  - "Hydration tests detect console errors matching hydration patterns"

patterns-established:
  - "RouteLoading: configurable message prop for route context"
  - "RouteError: context prop for route-specific error messaging"
  - "CONVERTED_ROUTES array: add routes as they are converted"

# Metrics
duration: 6min
completed: 2026-02-06
---

# Phase 41 Plan 01: Loading/Error Infrastructure Summary

**Reusable RouteLoading and RouteError components with parameterized Playwright hydration smoke tests for Server Component conversion safety**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-06T04:42:47Z
- **Completed:** 2026-02-06T04:48:39Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- RouteLoading component with branded spinner and animated transitions
- RouteError component with Sentry integration and retry functionality
- Hydration smoke test detecting console errors on converted routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RouteLoading component** - `17d7295` (feat)
2. **Task 2: Create RouteError component** - `68662e6` (feat)
3. **Task 3: Create hydration smoke test** - `7b6869c` (test)

## Files Created

- `src/components/ui/RouteLoading.tsx` - Route segment loading state with BrandedSpinner
- `src/components/ui/RouteError.tsx` - Route segment error boundary with Sentry + retry
- `e2e/hydration-smoke.spec.ts` - Parameterized hydration error detection tests

## Decisions Made

- Used existing BrandedSpinner (per CONTEXT.md "polish existing, not create new")
- RouteError follows global error.tsx card styling but without Card wrapper for flexibility
- Hydration tests check 5 patterns: hydrat, text content mismatch, server/client mismatch, did not match, expected server
- CONVERTED_ROUTES pre-populated with /, /menu, /admin/analytics for immediate testing once conversions happen

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RouteLoading ready for use in loading.tsx files per route
- RouteError ready for use in error.tsx files per route
- Hydration tests will validate conversions in Plan 02+
- Add converted routes to CONVERTED_ROUTES array as conversions complete

---
*Phase: 41-server-component-conversions*
*Plan: 01*
*Completed: 2026-02-06*
