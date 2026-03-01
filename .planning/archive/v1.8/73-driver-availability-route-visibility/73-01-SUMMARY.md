---
phase: 73-driver-availability-route-visibility
plan: 01
subsystem: api, ui, database
tags: supabase, jsonb, framer-motion, availability

requires:
  - phase: 72-driver-earnings-dashboard
    provides: driver dashboard infrastructure, DriverDashboard components
provides:
  - availability_json JSONB column on drivers table
  - DriverAvailability and DayOfWeek types
  - isDriverAvailable helper function
  - GET/PATCH /api/driver/availability endpoint
  - AvailabilityPicker component set (DayOfWeekPills, BlockedDateChips, AvailabilityToggle)
affects: [73-02, 73-03, admin-route-creation]

tech-stack:
  added: []
  patterns: [day-of-week pill toggle, blocked-date chip with native input]

key-files:
  created:
    - supabase/migrations/026_driver_availability.sql
    - src/lib/availability.ts
    - src/app/api/driver/availability/route.ts
    - src/components/ui/driver/AvailabilityPicker/DayOfWeekPills.tsx
    - src/components/ui/driver/AvailabilityPicker/BlockedDateChips.tsx
    - src/components/ui/driver/AvailabilityPicker/AvailabilityToggle.tsx
    - src/components/ui/driver/AvailabilityPicker/index.tsx
  modified:
    - src/types/driver.ts

key-decisions:
  - "isDriverAvailable returns true when availability is null or available_days empty (available by default)"
  - "Blocked dates checked before day-of-week check for correct override semantics"

patterns-established:
  - "DayOfWeekPills: DietaryChipPicker pattern adapted for day-of-week toggles with amber-600 selected state"
  - "BlockedDateChips: native date input + AnimatePresence for chip entry/exit"

requirements-completed: [DDASH-06, DDASH-07]

duration: 8min
completed: 2026-02-19
---

# Plan 73-01: Availability Data Model, API & Picker Components Summary

**JSONB availability column on drivers table, isDriverAvailable helper, GET/PATCH API, and DayOfWeekPills/BlockedDateChips/AvailabilityToggle component set**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files created:** 7
- **Files modified:** 1

## Accomplishments
- Driver availability JSONB column with default empty structure in migration 026
- Shared availability helper with DAYS_OF_WEEK constant, DAY_LABELS map, and isDriverAvailable function
- Authenticated GET/PATCH API endpoint with validation and rate limiting
- DayOfWeekPills with spring animation following DietaryChipPicker pattern
- BlockedDateChips with native date input and AnimatePresence transitions
- AvailabilityToggle wrapping ToggleSwitch for global availability override

## Task Commits

1. **Task 1: Migration, types, and availability API** - `c07b617a` (feat)
2. **Task 2: AvailabilityPicker component set** - `33664676` (feat)

## Files Created/Modified
- `supabase/migrations/026_driver_availability.sql` - JSONB column migration
- `src/types/driver.ts` - DayOfWeek, DriverAvailability types + DriversRow/Insert/Update
- `src/lib/availability.ts` - isDriverAvailable helper, DAYS_OF_WEEK, DAY_LABELS
- `src/app/api/driver/availability/route.ts` - GET/PATCH availability endpoint
- `src/components/ui/driver/AvailabilityPicker/DayOfWeekPills.tsx` - Day toggle pills
- `src/components/ui/driver/AvailabilityPicker/BlockedDateChips.tsx` - Blocked date chips
- `src/components/ui/driver/AvailabilityPicker/AvailabilityToggle.tsx` - Global toggle
- `src/components/ui/driver/AvailabilityPicker/index.tsx` - Barrel exports

## Decisions Made
- isDriverAvailable returns true when null or empty available_days (available by default)
- Blocked dates take priority over day-of-week availability
- PATCH validates all day names against DAYS_OF_WEEK and date format YYYY-MM-DD

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AvailabilityPicker components ready for schedule page (Plan 02)
- isDriverAvailable helper ready for admin integration (Plan 03)
- API endpoint ready for client-side PATCH from schedule page

---
*Phase: 73-driver-availability-route-visibility*
*Completed: 2026-02-19*
