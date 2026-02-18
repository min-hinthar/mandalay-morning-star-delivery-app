---
phase: 42-dynamic-import-heavy-libraries
plan: 01
subsystem: ui
tags: [dynamic-import, intersection-observer, skeleton, loading, error-boundary, retry, sentry]

# Dependency graph
requires:
  - phase: 41-server-component-conversions
    provides: Server component foundation and hydration health
provides:
  - useViewportTrigger hook for viewport-based loading triggers
  - importWithRetry utility for dynamic import with exponential backoff
  - LoadingWithTimeout wrapper for configurable timeout UX
  - ChartSkeleton and ChartErrorCard for chart loading states
  - MapSkeleton and MapErrorCard for map loading states
affects: [42-02 chart dynamic imports, 42-03 map dynamic imports]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [viewport-trigger-hook, dynamic-import-retry, loading-timeout-wrapper, skeleton-error-card-pair]

key-files:
  created:
    - src/lib/hooks/useViewportTrigger.ts
    - src/lib/hooks/useDynamicImportWithRetry.ts
    - src/components/ui/LoadingWithTimeout.tsx
    - src/components/ui/admin/analytics/ChartSkeleton.tsx
    - src/components/ui/admin/analytics/ChartErrorCard.tsx
    - src/components/ui/maps/MapSkeleton.tsx
    - src/components/ui/maps/MapErrorCard.tsx
  modified:
    - src/lib/hooks/index.ts

key-decisions:
  - "MapSkeleton uses CSS @media rule for mobile height override"
  - "Error cards kept as separate files (ChartErrorCard, MapErrorCard) co-located with consumers"
  - "importWithRetry is a pure async function, not a React hook"

patterns-established:
  - "Viewport trigger: useViewportTrigger with eager/viewport/fallback modes"
  - "Dynamic import retry: importWithRetry wrapping next/dynamic factory with exponential backoff"
  - "Loading timeout: LoadingWithTimeout renders skeleton then augments with timeout message"
  - "Skeleton + error card pairs: co-located per domain (analytics/, maps/)"

# Metrics
duration: 7min
completed: 2026-02-06
---

# Phase 42 Plan 01: Shared Infrastructure Summary

**Viewport trigger hook, dynamic import retry utility, loading timeout wrapper, chart/map skeletons, and error cards for dynamic import loading states**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-06T06:55:18Z
- **Completed:** 2026-02-06T07:02:14Z
- **Tasks:** 3
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- useViewportTrigger hook with IntersectionObserver, eager mode, and fallback-to-eager for unsupported browsers
- importWithRetry utility with 3-retry exponential backoff (1s, 2s, 4s) and Sentry logging via logger.exception
- LoadingWithTimeout wrapper with configurable timeoutMs, skeleton rendering, and timeout message with reload retry
- ChartSkeleton with 12 faux bars, staggered pulse animation (80ms delay per bar), per-chart label, and ARIA attributes
- ChartErrorCard and MapErrorCard matching RouteError styling (AlertTriangle, brand-red, motion fade-in, retry/final modes)
- MapSkeleton with centered MapPin icon, pulse animation, optional address text, and mobile height support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useViewportTrigger and useDynamicImportWithRetry hooks** - `9a97e62` (feat)
2. **Task 2: Create LoadingWithTimeout, ChartSkeleton, and ChartErrorCard** - `8b88622` (feat)
3. **Task 3: Create MapSkeleton and MapErrorCard** - `fb51556` (feat)

## Files Created/Modified

- `src/lib/hooks/useViewportTrigger.ts` - IntersectionObserver-based viewport trigger hook with eager/fallback modes
- `src/lib/hooks/useDynamicImportWithRetry.ts` - Dynamic import wrapper with 3-retry exponential backoff and Sentry logging
- `src/components/ui/LoadingWithTimeout.tsx` - Shared loading wrapper: skeleton initially, timeout message after threshold
- `src/components/ui/admin/analytics/ChartSkeleton.tsx` - Faux bar chart skeleton with staggered pulse and ARIA
- `src/components/ui/admin/analytics/ChartErrorCard.tsx` - Chart error card with retry button matching RouteError
- `src/components/ui/maps/MapSkeleton.tsx` - Map placeholder with MapPin icon, pulse, optional address text
- `src/components/ui/maps/MapErrorCard.tsx` - Map error card with retry button matching RouteError
- `src/lib/hooks/index.ts` - Added useViewportTrigger and importWithRetry exports

## Decisions Made

- **importWithRetry is a pure async function:** Not a React hook. Used inside `next/dynamic` factory functions where hooks cannot be called.
- **Error cards kept separate:** ChartErrorCard and MapErrorCard are nearly identical but kept as separate files co-located with their domain directories (analytics/, maps/) for clean ownership.
- **MapSkeleton mobile height:** Uses inline CSS `@media` rule for responsive mobile height override rather than Tailwind breakpoints, since the height is a dynamic prop value.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm build` fails due to Google Fonts network fetch error (pre-existing sandbox limitation, not related to our changes). Typecheck passes cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 shared infrastructure files ready for Plans 02 (chart dynamic imports) and 03 (map dynamic imports)
- useViewportTrigger ready to wrap map containers for viewport-based loading
- importWithRetry ready to wrap `next/dynamic` factory calls for Recharts and Google Maps
- LoadingWithTimeout ready with configurable timeoutMs (10s charts, 15s maps)
- Skeleton and error card pairs ready for Suspense fallback and error boundary usage

---

_Phase: 42-dynamic-import-heavy-libraries_
_Completed: 2026-02-06_
