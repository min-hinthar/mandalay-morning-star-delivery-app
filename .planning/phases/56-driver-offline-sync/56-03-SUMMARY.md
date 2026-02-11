---
phase: 56-driver-offline-sync
plan: 03
subsystem: ui
tags: [offline-banner, framer-motion, idempotency, amber-banner, sync-states]

# Dependency graph
requires:
  - phase: 56-driver-offline-sync
    provides: useOfflineSync hook with syncState machine, pendingCounts, and queue methods
provides:
  - Amber animated OfflineBanner with slide-in/out and 3 visual states (offline/syncing/synced)
  - Single banner instance via DriverShell (no duplicate in DriverLayout)
  - Server-side idempotency guards on stop PATCH and exception POST routes
affects: [driver-offline-ux, driver-api-reliability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AnimatePresence spring slide for banner: y:-60 to 0 with stiffness 300 / damping 25"
    - "Server-side idempotency via status transition validation (no extra DB table)"
    - "Duplicate exception guard: SELECT before INSERT on delivery_exceptions"

key-files:
  created: []
  modified:
    - src/components/ui/driver/OfflineBanner.tsx
    - src/components/ui/layout/DriverLayout.tsx
    - src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts
    - src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts

key-decisions:
  - "Amber bg-status-warning token for offline/syncing states (not raw amber-500)"
  - "No DB migration for idempotency: status transition validation is natural guard"
  - "Exception duplicate guard via SELECT before INSERT (prevents rapid double-tap)"
  - "Removed isOnline state and inline WifiOff pill from DriverLayout (OfflineBanner replaces it)"

patterns-established:
  - "OfflineBanner owns its own useOfflineSync instance (no prop drilling from parent)"
  - "Server-side idempotency without idempotency_keys table: leverage existing business validation"

# Metrics
duration: 8min
completed: 2026-02-11
---

# Phase 56 Plan 03: Sync Status Indicators Summary

**Amber animated offline banner with slide-in/out spring animation, queue count display, syncing/synced states, and server-side idempotency guards on stop and exception routes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-11T11:08:56Z
- **Completed:** 2026-02-11T11:17:21Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Rewrote OfflineBanner with Framer Motion AnimatePresence slide-in/out: 3 states (offline amber, syncing amber, synced green)
- Removed duplicate inline offline indicator (WifiOff pill) from DriverLayout header
- Added server-side duplicate exception guard (SELECT before INSERT on delivery_exceptions)
- Documented natural idempotency of stop PATCH via status transition validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign OfflineBanner with amber animation and sync states** - `bd67484` (feat)
2. **Task 2: Add server-side idempotency guards to stop and exception routes** - `8ca5292` (feat)

## Files Created/Modified
- `src/components/ui/driver/OfflineBanner.tsx` - Full rewrite: AnimatePresence spring slide, amber/green states, queue count
- `src/components/ui/layout/DriverLayout.tsx` - Removed WifiOff pill, isOnline state, online/offline listeners, unused spring import
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` - Added idempotency comment at status transition check
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts` - Added duplicate exception check before INSERT

## Decisions Made
- Used `bg-status-warning` semantic token for amber color (not raw `amber-500`) -- consistent with design token system
- No database migration needed: stop PATCH is naturally idempotent via `isValidStatusTransition`, exception POST uses SELECT guard
- Exception duplicate returns 200 with existing exception ID (idempotent success, not error)
- Removed `isOnline` state entirely from DriverLayout since it was only used for the inline pill

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused `spring` import from DriverLayout**
- **Found during:** Task 1
- **Issue:** After removing the WifiOff pill (which used `transition={spring.snappy}`), the `spring` import from `@/lib/motion-tokens` became unused, causing lint failure
- **Fix:** Removed `spring` from the import statement, kept `variants` which is still used
- **Files modified:** src/components/ui/layout/DriverLayout.tsx
- **Verification:** pnpm lint passes
- **Committed in:** bd67484 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Unused import cleanup necessary for lint. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Offline UX complete: animated banner, queue count, syncing/synced flow
- Server-side idempotency guards in place for all driver mutation routes
- Phase 56 offline sync feature set is functionally complete
- Ready for final plan if additional polish or testing is needed

---
*Phase: 56-driver-offline-sync*
*Completed: 2026-02-11*
