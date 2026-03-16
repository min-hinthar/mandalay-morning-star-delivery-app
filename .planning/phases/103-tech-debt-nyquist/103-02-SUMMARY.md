---
phase: 103-tech-debt-nyquist
plan: 02
subsystem: ui
tags: [barrel-exports, dead-code, responsive, reduced-motion, wiring]

# Dependency graph
requires:
  - phase: 99
    provides: OrderDetailPanel component with unused showActions prop
  - phase: 100
    provides: 5 admin route hooks (useReorderStops, useSplitRoute, useMergeRoutes, useReassignDriver, useRouteActions)
  - phase: 101
    provides: area_description column on routes table
  - phase: 102
    provides: AdminMobileHeader with actionSlot, SectionCard without reduced-motion guard
provides:
  - Clean barrel exports for hooks (5 Phase 100 hooks) and admin orders
  - area_description wired end-to-end from driver page query to AcceptDeclineCard
  - Merge picker filtered to planned-only routes (matching RPC constraint)
  - 3 dead exports removed (showActions, currentDriverName, formatTime)
  - Responsive padding on 5 admin loading skeletons
  - SectionCard reduced-motion guard
  - getPageTitle exported for testability
affects: [103-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [responsive-padding-skeleton, reduced-motion-guard-pattern]

key-files:
  created:
    - src/components/ui/admin/orders/index.ts
  modified:
    - src/app/(driver)/driver/page.tsx
    - src/app/(driver)/driver/DriverHomeSwitch.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
    - src/lib/hooks/index.ts
    - src/components/ui/admin/index.ts
    - src/components/ui/admin/orders/OrderDetailPanel/types.ts
    - src/lib/hooks/useReassignDriver.ts
    - src/components/ui/admin/routes/RouteStopCard/StopCardContent.tsx
    - src/app/(admin)/admin/categories/page.tsx
    - src/app/(admin)/admin/menu/page.tsx
    - src/app/(admin)/admin/menu/[id]/page.tsx
    - src/app/(admin)/admin/photos/page.tsx
    - src/app/(admin)/admin/sections/page.tsx
    - src/components/ui/admin/AdminMobileHeader.tsx
    - src/components/ui/admin/sections/SectionCard.tsx

key-decisions:
  - "3 gaps reclassified as intentionally kept: OrderDetailPanel wrapper (consumed via new orders barrel), getSelectableStops (used by tests), RouteProgressState (public API for hook consumers)"
  - "Loading skeleton padding uses p-4 md:p-8 to match main content wrappers"
  - "SectionCard uses false for initial prop (not undefined) to prevent flash on reduced-motion"

patterns-established:
  - "Loading skeleton padding must match main content wrapper (p-4 md:p-8)"
  - "AnimatePresence children initial prop uses false (not undefined) to prevent flash when shouldAnimate is false"

requirements-completed: []

# Metrics
duration: 16min
completed: 2026-03-16
---

# Phase 103 Plan 02: Integration Wiring + Dead Code + Responsive Fixes Summary

**14 gaps closed: area_description wired end-to-end, merge picker filtered, barrel exports added, 3 dead exports removed, 3 reclassified, responsive padding fixed, reduced-motion guard added**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-16T23:21:57Z
- **Completed:** 2026-03-16T23:38:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Wired area_description from driver page Supabase query through DriverHomeSwitch to AcceptDeclineCard prop
- Fixed merge route picker to only show planned routes (matching merge_routes RPC constraint)
- Added 5 Phase 100 hooks to hooks barrel and created orders barrel in admin components
- Removed 3 dead exports (showActions, currentDriverName, formatTime) with test updates
- Fixed responsive padding on 6 loading skeleton locations across 5 admin pages
- Added shouldAnimate guard to SectionCard framer-motion animation
- Removed unused actionSlot prop from AdminMobileHeader, exported getPageTitle for testability

## Task Commits

Each task was committed atomically:

1. **Task 1: Integration wiring** - `d56517ba` (feat)
2. **Task 2: Dead code + responsive + reduced-motion** - `6860a6a0` (fix)

## Files Created/Modified
- `src/components/ui/admin/orders/index.ts` - New orders barrel for admin components
- `src/app/(driver)/driver/page.tsx` - Added area_description to route query + RouteQueryResult + todayRoute
- `src/app/(driver)/driver/DriverHomeSwitch.tsx` - Added areaDescription to interface + pass to AcceptDeclineCard
- `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx` - Filter to planned-only, removed currentDriverName
- `src/lib/hooks/index.ts` - Added 5 Phase 100 admin route hooks
- `src/components/ui/admin/index.ts` - Added orders barrel re-export
- `src/components/ui/admin/orders/OrderDetailPanel/types.ts` - Removed showActions prop
- `src/lib/hooks/useReassignDriver.ts` - Removed currentDriverName from interface
- `src/components/ui/admin/routes/RouteStopCard/StopCardContent.tsx` - Removed formatTime dead export
- `src/app/(admin)/admin/categories/page.tsx` - Loading skeleton p-4 md:p-8
- `src/app/(admin)/admin/menu/page.tsx` - Loading skeleton p-4 md:p-8
- `src/app/(admin)/admin/menu/[id]/page.tsx` - Loading + error skeleton p-4 md:p-8
- `src/app/(admin)/admin/photos/page.tsx` - Loading skeleton p-4 md:p-8
- `src/app/(admin)/admin/sections/page.tsx` - Loading skeleton p-4 md:p-8
- `src/components/ui/admin/AdminMobileHeader.tsx` - Removed actionSlot, kept getPageTitle export
- `src/components/ui/admin/sections/SectionCard.tsx` - Added shouldAnimate guard to m.div

## Decisions Made
- 3 gaps reclassified as intentionally kept with documented rationale:
  - GAP-99-03: OrderDetailPanel wrapper consumed via new orders barrel
  - GAP-100-05: getSelectableStops export kept for test + internal use
  - GAP-102-03: RouteProgressState type export kept as public hook API
- Loading skeleton padding uses p-4 md:p-8 to match main content wrappers
- SectionCard initial prop uses `false` (not `undefined`) to prevent flash on reduced-motion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed useReorderStops test 2-arg signature**
- **Found during:** Task 1 (barrel export exposed pre-existing test mismatch)
- **Issue:** useReorderStops.handleReorder was changed to require 2 args (reorderedStops, previousStops) but tests only passed 1
- **Fix:** Updated all 6 test callsites to pass previousStops as second argument
- **Files modified:** src/lib/hooks/__tests__/useReorderStops.test.ts
- **Verification:** pnpm typecheck passes, pnpm test passes
- **Committed in:** d56517ba (Task 1 commit)

**2. [Rule 1 - Bug] Fixed useReassignDriver test currentDriverName removal**
- **Found during:** Task 2 (removing currentDriverName from interface)
- **Issue:** 6 test callsites still passed currentDriverName which TS now rejects
- **Fix:** Removed currentDriverName from all 6 renderHook calls in test file
- **Files modified:** src/lib/hooks/__tests__/useReassignDriver.test.ts
- **Verification:** pnpm typecheck passes, pnpm test passes
- **Committed in:** 6860a6a0 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes in tests)
**Impact on plan:** Both fixes necessary for test correctness after dead code removal. No scope creep.

## Issues Encountered
- Plan 01 left uncommitted working tree changes that caused lint-staged stash conflicts. Resolved by restoring pre-existing files not part of this plan's scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- getPageTitle exported for Plan 03 unit tests
- All barrel exports clean for Plan 03 test imports
- No blockers

---
*Phase: 103-tech-debt-nyquist*
*Completed: 2026-03-16*
