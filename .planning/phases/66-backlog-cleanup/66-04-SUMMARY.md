---
phase: 66-backlog-cleanup
plan: 04
subsystem: ui
tags: [tracking, delivery-notes, eta, countdown, api, supabase]

# Dependency graph
requires:
  - phase: 66-backlog-cleanup plan 02
    provides: TrackingData types with deliveryNotes, routeId, cancellation fields
  - phase: 66-backlog-cleanup plan 03
    provides: DriverCard enhancements (haptic, call text), OrderSummary expanded view (already applied)
provides:
  - DeliveryNotesEditor component with edit/save/cancel flow
  - PATCH /api/orders/{id}/notes endpoint with ownership + status validation
  - ETA dual format display (countdown <=30 min, time window >30 min)
  - "Almost here!" pulsing badge when driver <=5 min away
  - Live countdown timer via useSafeInterval
affects: [tracking-page-integration, delivery-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ETA dual format: countdown with flip digits (<=30 min) vs time window (>30 min)"
    - "useSafeInterval for countdown timers (prevents mobile interval crashes)"
    - "Notes API: ownership check + status lock pattern for user-editable order fields"

key-files:
  created:
    - src/components/ui/orders/tracking/DeliveryNotesEditor.tsx
    - src/app/api/orders/[id]/notes/route.ts
  modified:
    - src/components/ui/orders/tracking/ETACountdown.tsx
    - src/components/ui/orders/tracking/index.ts

key-decisions:
  - "Task 1 (DriverCard + OrderSummary) already applied by 66-03 commit -- no duplicate work needed"
  - "Notes API updates special_instructions column (matches existing DB schema)"
  - "Admin bypass via JWT app_metadata.role for notes editing"
  - "30-second countdown tick interval to save battery on mobile"
  - "Time window calculation: arrivalDate to arrivalDate + 30% of maxMinutes range"
  - "text-text-inverse semantic token for Save button instead of text-white (lint rule)"

patterns-established:
  - "Editable order fields: PATCH endpoint with ownership check + status lock (delivered/cancelled blocks edit)"

# Metrics
duration: 32min
completed: 2026-02-15
---

# Phase 66 Plan 04: Tracking Info Section Summary

**DeliveryNotesEditor with PATCH API for editable delivery instructions, ETA dual format (countdown <=30min / time window >30min) with useSafeInterval live timer and "Almost here!" badge**

## Performance

- **Duration:** 32 min
- **Started:** 2026-02-15T13:26:16Z
- **Completed:** 2026-02-15T13:58:32Z
- **Tasks:** 2
- **Files created/modified:** 4

## Accomplishments
- Created DeliveryNotesEditor component with edit/save/cancel flow, PATCH integration, loading state, and toast notifications
- Created PATCH /api/orders/{id}/notes API endpoint with UUID validation, authentication, ownership check (with admin bypass), status lock for delivered/cancelled, 500 char limit
- Upgraded ETACountdown to dual format: flip-digit countdown when <=30 min, time window when >30 min
- Added "Almost here!" pulsing badge when driver is <=5 min away
- Integrated useSafeInterval for live countdown timer (30s tick, auto-cleanup on unmount)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhanced DriverCard + expanded OrderSummary** - Already applied in `503ae7c` (66-03 commit, no duplicate work)
2. **Task 2: DeliveryNotesEditor, notes API, ETA dual format** - `95bdfa5` (feat)

## Files Created/Modified
- `src/components/ui/orders/tracking/DeliveryNotesEditor.tsx` - Editable delivery instructions with edit/save/cancel flow
- `src/app/api/orders/[id]/notes/route.ts` - PATCH endpoint for updating delivery notes with ownership + status validation
- `src/components/ui/orders/tracking/ETACountdown.tsx` - Dual format ETA: countdown (<=30 min) vs time window (>30 min) with useSafeInterval
- `src/components/ui/orders/tracking/index.ts` - Barrel export for DeliveryNotesEditor (already present from 66-03)

## Decisions Made
- Task 1 work (DriverCard haptic/call text, OrderSummary expanded) was already committed in 66-03 (commit 503ae7c). Detected via `git diff` showing no changes needed. Skipped duplicate work.
- Notes API writes to `special_instructions` column in orders table (existing column, matches deliveryNotes alias in TrackingOrderInfo)
- Admin users (app_metadata.role === "admin") can edit notes for any order, bypassing ownership check
- Countdown timer ticks every 30 seconds (not 1 second) to conserve mobile battery
- Time window format calculates end time as arrivalDate + 30% of maxMinutes range

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed text-white lint violation in DeliveryNotesEditor**
- **Found during:** Task 2 (lint verification)
- **Issue:** `text-white` class violates project lint rule requiring semantic tokens
- **Fix:** Changed to `text-text-inverse` semantic token
- **Files modified:** src/components/ui/orders/tracking/DeliveryNotesEditor.tsx
- **Verification:** `pnpm lint` passes with 0 errors
- **Committed in:** 95bdfa5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Lint compliance fix only. No scope creep.

## Issues Encountered
- Task 1 was already fully implemented by the 66-03 commit (503ae7c). This was detected when `git add` + commit resulted in "empty commit" -- investigation via `git diff 503ae7c~1 503ae7c` confirmed all Task 1 changes (haptic feedback, Call Driver text, OrderSummary expanded view, deliveryAddress prop, tracking types update) were already present. Task 1 was marked complete without duplicate work.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DeliveryNotesEditor ready for integration into TrackingPageClient (currently exported but not yet wired into the page layout)
- ETA dual format active for any tracking view using ETACountdown component
- Notes API endpoint ready for production use

---
*Phase: 66-backlog-cleanup*
*Completed: 2026-02-15*
