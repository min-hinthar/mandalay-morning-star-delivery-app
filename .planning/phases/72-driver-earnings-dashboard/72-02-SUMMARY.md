---
phase: 72-driver-earnings-dashboard
plan: 02
subsystem: ui, api, gamification
tags: [earnings, badges, stat-card, dashboard, route-completion]

requires:
  - phase: 72-driver-earnings-dashboard
    provides: Earnings computation library and app_settings pay rate
provides:
  - EarningsSummaryCard with real computed Today's Earnings and This Week
  - Badge award logic on route completion (7 threshold types)
  - checkAndAwardBadges shared function with service client INSERT
affects: [72-03, driver-dashboard]

tech-stack:
  added: []
  patterns:
    - "Badge award as non-blocking post-completion step in route API"
    - "Service client for admin-only INSERT policy bypass"

key-files:
  created:
    - src/components/ui/driver/DriverDashboard/EarningsSummaryCard.tsx
    - src/lib/badges/thresholds.ts
    - src/lib/badges/index.ts
  modified:
    - src/components/ui/driver/DriverDashboard/DriverDashboard.tsx
    - src/components/ui/driver/DriverDashboard/types.ts
    - src/components/ui/driver/DriverDashboard/index.tsx
    - src/app/(driver)/driver/page.tsx
    - src/app/api/driver/routes/[routeId]/complete/route.ts

key-decisions:
  - "Badge award failure is non-blocking (try/catch in route completion)"
  - "Service client required for driver_badges INSERT (admin-only policy)"
  - "Today's earnings computed from completed route stats_json, not re-querying stops"
  - "Weekly earnings = weekly deliveries RPC * rate (simpler than re-joining)"

patterns-established:
  - "Non-blocking gamification hooks in API endpoints"
  - "BADGE_THRESHOLDS array pattern for extensible badge system"

requirements-completed: [DDASH-01, DDASH-11, DDASH-12]

duration: 10min
completed: 2026-02-19
---

# Phase 72 Plan 02: Dashboard Earnings + Badge Awards Summary

**Live earnings summary card on dashboard with real computed amounts, plus badge award logic on route completion with 7 threshold types**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-19T11:47:00Z
- **Completed:** 2026-02-19T11:57:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- EarningsSummaryCard renders Today's Earnings and This Week with AnimatedValue currency format
- Dashboard wired to real computed data (no more dead weeklyEarningsCents prop)
- 7 badge types defined with threshold checks (delivery milestones, streaks, perfect rating)
- Route completion triggers badge award as non-blocking post-step
- five_star badge requires both ratingAvg >= 5.0 AND totalDeliveries >= 10

## Task Commits

1. **Task 1: EarningsSummaryCard + dashboard wiring** - `f45bec10` (feat)
2. **Task 2: Badge award logic on route completion** - `db1d1204` (feat)

## Files Created/Modified
- `src/components/ui/driver/DriverDashboard/EarningsSummaryCard.tsx` - 2-column earnings grid
- `src/lib/badges/thresholds.ts` - Badge definitions and checkAndAwardBadges
- `src/lib/badges/index.ts` - Barrel re-exports
- `src/components/ui/driver/DriverDashboard/DriverDashboard.tsx` - Integrated EarningsSummaryCard
- `src/components/ui/driver/DriverDashboard/types.ts` - todayEarningsCents + weeklyEarningsCents required
- `src/app/(driver)/driver/page.tsx` - Computes real earnings from app_settings + routes
- `src/app/api/driver/routes/[routeId]/complete/route.ts` - Badge award on completion

## Decisions Made
- Today's earnings from stats_json (avoids re-querying route_stops)
- Weekly earnings from existing RPC * rate (efficient, reuses existing function)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Earnings card shows real data on dashboard
- Badge system ready for display on earnings page (Plan 03)

---
*Phase: 72-driver-earnings-dashboard*
*Completed: 2026-02-19*
