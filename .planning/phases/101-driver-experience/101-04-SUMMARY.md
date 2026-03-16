---
phase: 101-driver-experience
plan: 04
subsystem: ui
tags: [react, framer-motion, dnd-kit, driver-ux, accept-decline]

# Dependency graph
requires:
  - phase: 101-02
    provides: useAcceptRoute, useDeclineRoute, useDriverReorderStops hooks
  - phase: 101-03
    provides: Status filter audit, StatusBadge updates for assigned/accepted
  - phase: 100-03
    provides: DragReorderList, SortableItem, DragHandle, MoveButtons
provides:
  - AcceptDeclineCard for dashboard assigned state
  - AcceptDeclineBar sticky bottom bar for route page (assigned + accepted)
  - DeclineConfirmDialog with optional reason textarea
  - DragReorderList wired in ActiveRouteView for driver stop reorder
  - LocationTracker and useLocationTracking removed
affects: [101-05, driver-pages, admin-ops-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [accept-decline-card-pattern, sticky-bottom-bar-pattern, optimistic-reorder-with-locked-stops]

key-files:
  created:
    - src/components/ui/driver/AcceptDeclineCard.tsx
    - src/components/ui/driver/AcceptDeclineBar.tsx
    - src/components/ui/driver/DeclineConfirmDialog.tsx
  modified:
    - src/app/(driver)/driver/DriverHomeSwitch.tsx
    - src/app/(driver)/driver/route/DriverRouteSwitch.tsx
    - src/components/ui/driver/ActiveRouteView.tsx
    - src/components/ui/driver/SimpleHome.tsx
    - src/components/ui/driver/DriverDashboard/RouteCard.tsx
    - src/components/ui/driver/index.ts
    - src/lib/hooks/index.ts

key-decisions:
  - "DeclineConfirmDialog wraps AnimatePresence directly (DeliveryConfirmDialog pattern), not admin ConfirmDialog"
  - "AcceptDeclineBar visible for both assigned and accepted statuses (un-accept per locked decision)"
  - "DragReorderList renders for accepted and in_progress routes; lockedStops separated with opacity-50"
  - "DriverHomeSwitch intercepts assigned status before mode switch (same UI for simple + advanced)"

patterns-established:
  - "Accept/decline card pattern: full-width card with gradient header, green Accept CTA, red Decline link"
  - "Sticky bottom bar pattern: fixed z-30 with safe-area-inset-bottom padding"
  - "Optimistic reorder with locked stops: reorderable (pending/enroute) vs locked (delivered/skipped) split"

requirements-completed: [DRV-01, DRV-02, DRV-03]

# Metrics
duration: 16min
completed: 2026-03-16
---

# Phase 101 Plan 04: Driver UI Components Summary

**AcceptDeclineCard + AcceptDeclineBar + DeclineConfirmDialog for driver accept/decline flow, DragReorderList wired for stop reorder, LocationTracker dead code removed**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-16T08:53:11Z
- **Completed:** 2026-03-16T09:09:06Z
- **Tasks:** 2
- **Files modified:** 13 (3 created, 8 modified, 2 deleted)

## Accomplishments
- AcceptDeclineCard renders on dashboard when route assigned (same UI both modes), with route preview, green Accept CTA using bg-green design token, and red Decline link
- AcceptDeclineBar sticky bottom bar on route page for assigned (accept+decline) and accepted (decline-only for un-accept per locked decision)
- DeclineConfirmDialog with optional reason textarea (500 char maxLength), "Keep Route" cancel and destructive "Decline Route" confirm
- DragReorderList wired in ActiveRouteView for pending/enroute stops with DragHandle (desktop) and MoveButtons (mobile), locked stops rendered with opacity-50
- LocationTracker.tsx and useLocationTracking.ts deleted with barrel export cleanup
- RouteCard and SimpleHome updated with assigned/accepted badge colors and start-route eligibility

## Task Commits

Each task was committed atomically:

1. **Task 1: AcceptDeclineCard, AcceptDeclineBar, DeclineConfirmDialog + wire to DriverHomeSwitch and DriverRouteSwitch** - `11afcd62` (feat)
2. **Task 2: DragReorderList in ActiveRouteView + LocationTracker removal** - `984e028c` (feat)
3. **Formatting fix** - `2c2e0e51` (chore)

## Files Created/Modified
- `src/components/ui/driver/AcceptDeclineCard.tsx` - Dashboard accept/decline card with route preview and animated transitions
- `src/components/ui/driver/AcceptDeclineBar.tsx` - Sticky bottom bar for route page, dual-state (assigned: accept+decline, accepted: decline-only)
- `src/components/ui/driver/DeclineConfirmDialog.tsx` - Decline confirmation with optional reason textarea
- `src/app/(driver)/driver/DriverHomeSwitch.tsx` - Added assigned status intercept before mode switch
- `src/app/(driver)/driver/route/DriverRouteSwitch.tsx` - Added AcceptDeclineBar render with safe-area padding
- `src/components/ui/driver/ActiveRouteView.tsx` - DragReorderList for reorderable stops, LocationTracker removed
- `src/components/ui/driver/SimpleHome.tsx` - Added accepted status pill and CheckCircle icon
- `src/components/ui/driver/DriverDashboard/RouteCard.tsx` - Added assigned/accepted badge colors and labels
- `src/components/ui/driver/index.ts` - Added 3 new exports, removed LocationTracker export
- `src/lib/hooks/index.ts` - Removed useLocationTracking export
- `src/components/ui/driver/LocationTracker.tsx` - DELETED
- `src/lib/hooks/useLocationTracking.ts` - DELETED

## Decisions Made
- DeclineConfirmDialog wraps AnimatePresence directly following DeliveryConfirmDialog pattern (admin ConfirmDialog has no children slot for textarea)
- AcceptDeclineBar renders for both assigned and accepted statuses per locked decision (driver can un-accept before in_progress)
- DriverHomeSwitch intercepts assigned status BEFORE simple/advanced mode switch (same UI for both modes)
- DragReorderList available on accepted and in_progress routes; lockedStops (delivered/skipped) rendered separately with opacity-50
- Start Route button shows for both planned and accepted statuses in ActiveRouteView and RouteCard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All driver UI components complete, ready for Plan 05 (page audit and E2E verification)
- Accept/decline flow wired end-to-end: API (Plan 02) -> hooks (Plan 02) -> UI (this plan)
- DragReorderList reuses Phase 100 components and batch_update_stop_indices RPC

---
## Self-Check: PASSED

- All 3 created files exist
- Both deleted files confirmed removed
- All 3 task commits found in git log
- pnpm typecheck, lint, test, build all pass

---
*Phase: 101-driver-experience*
*Completed: 2026-03-16*
