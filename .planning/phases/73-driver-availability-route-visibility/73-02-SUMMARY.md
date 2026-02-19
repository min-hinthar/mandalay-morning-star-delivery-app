---
phase: 73-driver-availability-route-visibility
plan: 02
subsystem: ui, api
tags: nextjs, supabase, framer-motion, schedule

requires:
  - phase: 73-driver-availability-route-visibility
    provides: AvailabilityPicker components, availability API
provides:
  - Upcoming routes API endpoint
  - Schedule page with day-grouped route cards
  - Interactive availability pills on schedule page
  - NextRouteChip on driver dashboard
affects: [73-03, driver-navigation]

tech-stack:
  added: []
  patterns: [day-grouped route list, passive schedule indicator chip]

key-files:
  created:
    - src/app/api/driver/routes/upcoming/route.ts
    - src/app/(driver)/driver/schedule/SchedulePageClient.tsx
    - src/components/ui/driver/DriverDashboard/NextRouteChip.tsx
  modified:
    - src/app/(driver)/driver/schedule/page.tsx
    - src/components/ui/driver/DriverDashboard/DriverDashboard.tsx
    - src/components/ui/driver/DriverDashboard/types.ts
    - src/components/ui/driver/DriverDashboard/index.tsx
    - src/app/(driver)/driver/page.tsx

key-decisions:
  - "Schedule page availability pills are interactive (PATCH to API on change)"
  - "Routes grouped by date using Intl.DateTimeFormat for headers"
  - "NextRouteChip uses teal accent color to distinguish from other dashboard elements"

patterns-established:
  - "Day-grouped route list: group by YYYY-MM-DD key, render day header + HistorySummaryCard"
  - "NextRouteChip: passive indicator chip linking to schedule page"

requirements-completed: [DDASH-04, DDASH-05]

duration: 10min
completed: 2026-02-19
---

# Plan 73-02: Schedule Page & NextRouteChip Summary

**Full schedule page with day-grouped upcoming routes, interactive availability pills, and teal "Next route" chip on driver dashboard**

## Performance

- **Duration:** 10 min
- **Tasks:** 2
- **Files created:** 3
- **Files modified:** 5

## Accomplishments
- Upcoming routes API with auth, rate limiting, and stop details from joined queries
- Schedule page replaces placeholder with full server/client component pair
- Routes grouped by date with expandable HistorySummaryCard for each route
- Interactive availability pills at top of schedule page (saves via PATCH on change)
- NextRouteChip on driver dashboard showing next route day name with schedule link
- Driver page fetches next route date in parallel with existing queries

## Task Commits

1. **Task 1: Upcoming routes API and schedule page** - `110da2d6` (feat)
2. **Task 2: NextRouteChip on driver dashboard** - `a1268355` (feat)

## Files Created/Modified
- `src/app/api/driver/routes/upcoming/route.ts` - GET upcoming routes endpoint
- `src/app/(driver)/driver/schedule/page.tsx` - Server component with auth + data fetch
- `src/app/(driver)/driver/schedule/SchedulePageClient.tsx` - Client component with grouped routes
- `src/components/ui/driver/DriverDashboard/NextRouteChip.tsx` - Passive next-route indicator
- `src/components/ui/driver/DriverDashboard/DriverDashboard.tsx` - Added NextRouteChip rendering
- `src/components/ui/driver/DriverDashboard/types.ts` - Added nextRouteDate prop
- `src/components/ui/driver/DriverDashboard/index.tsx` - Added NextRouteChip export
- `src/app/(driver)/driver/page.tsx` - Added next route query to Promise.all

## Decisions Made
- Availability pills on schedule page are interactive (not read-only) for natural editing UX
- Used HistorySummaryCard directly for route display on schedule page
- NextRouteChip renders regardless of todayRoute state (shows when future route exists)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schedule page and availability components ready for Plan 03 enhancements
- HistorySummaryCard and API patterns established for history page extension

---
*Phase: 73-driver-availability-route-visibility*
*Completed: 2026-02-19*
