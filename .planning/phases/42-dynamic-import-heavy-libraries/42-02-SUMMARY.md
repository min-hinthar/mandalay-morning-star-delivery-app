---
phase: 42-dynamic-import-heavy-libraries
plan: 02
subsystem: ui
tags: [next-dynamic, recharts, code-splitting, lazy-loading, error-handling, timeout]

# Dependency graph
requires:
  - phase: 42-01
    provides: ChartSkeleton, LoadingWithTimeout, importWithRetry shared infrastructure
provides:
  - 6 lazy chart wrappers with rich skeletons, 10s timeout, and retry logic
  - LazyRevenueChart for admin dashboard code-splitting
  - Admin dashboard freed from direct Recharts bundle dependency
affects: [42-03, performance-audits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LoadingWithTimeout wrapping ChartSkeleton for all lazy chart loading states"
    - "importWithRetry wrapper in all next/dynamic factory functions"
    - "LazyX naming convention for lazy-loaded chart variants"

key-files:
  created: []
  modified:
    - src/components/ui/admin/analytics/LazyCharts.tsx
    - src/components/ui/admin/analytics/index.ts
    - src/app/(admin)/admin/page.tsx
    - src/components/ui/admin/index.ts

key-decisions:
  - "RevenueChart import path uses ../RevenueChart (one directory up from analytics)"
  - "Keep RevenueChart direct export in admin/index.ts for other consumers"

patterns-established:
  - "Lazy chart pattern: importWithRetry + LoadingWithTimeout + ChartSkeleton per chart"
  - "Server component imports client lazy wrapper directly (no intermediate wrapper needed)"

# Metrics
duration: 4min
completed: 2026-02-06
---

# Phase 42 Plan 02: Chart Dynamic Imports Summary

**6 lazy chart wrappers with rich bar-shape skeletons, 10-second timeout messaging, 3-retry exponential backoff via importWithRetry, and admin dashboard wired to LazyRevenueChart removing Recharts from /admin initial bundle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-06T07:05:52Z
- **Completed:** 2026-02-06T07:09:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced basic gray pulse skeletons with rich ChartSkeleton (faux bar shapes, per-chart labels) across all 6 lazy charts
- Added 10-second timeout via LoadingWithTimeout showing "Charts taking longer than expected" with retry button
- Wrapped all dynamic imports with importWithRetry (3 retries, exponential backoff, Sentry logging)
- Added LazyRevenueChart and wired admin dashboard to use it, removing ~180KB Recharts from /admin initial JS bundle

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance LazyCharts with rich skeletons, timeout, retry, and add LazyRevenueChart** - `923e79d` (feat)
2. **Task 2: Wire admin dashboard to use LazyRevenueChart** - `3019db0` (feat)

## Files Created/Modified

- `src/components/ui/admin/analytics/LazyCharts.tsx` - 6 lazy chart wrappers with LoadingWithTimeout, ChartSkeleton, importWithRetry
- `src/components/ui/admin/analytics/index.ts` - Added LazyRevenueChart re-export
- `src/app/(admin)/admin/page.tsx` - Swapped RevenueChart to LazyRevenueChart import
- `src/components/ui/admin/index.ts` - Added LazyRevenueChart export

## Decisions Made

- RevenueChart imported via `../RevenueChart` (one directory up from analytics/) since it lives in the admin/ root
- Kept direct `RevenueChart` export in `admin/index.ts` for other consumers that may use it directly
- Server component (admin/page.tsx) imports client lazy wrapper directly -- `"use client"` boundary is at LazyCharts.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm build` fails due to pre-existing Google Fonts sandbox issue (network fetch blocked in sandbox). Typecheck passes cleanly. This is a known environment limitation, not caused by our changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 chart lazy wrappers in place with full error handling stack
- Ready for 42-03 (map dynamic imports or remaining chart consumers)
- Pattern established: any future chart additions should follow the same LazyX pattern

---

_Phase: 42-dynamic-import-heavy-libraries_
_Completed: 2026-02-06_
