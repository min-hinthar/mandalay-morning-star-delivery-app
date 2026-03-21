---
phase: 106-timezone-correctness
plan: 01
subsystem: api
tags: [timezone, intl, checkout, cron, delivery-dates]

requires:
  - phase: 100-deep-dive
    provides: "Identified timezone bugs TZ-01/03/04/05"
provides:
  - "Timezone-correct checkout scheduledDate via toISOWithTimezone"
  - "30-day future date validation on checkout"
  - "LA-timezone-aware cron delivery reminders"
  - "Pre-filtered cutoff dates in getAvailableDeliveryDatesMultiDay"
  - "Centralized TIMEZONE constant (no hardcoded strings)"
affects: [106-02-tests]

tech-stack:
  added: []
  patterns: ["TIMEZONE constant from types/delivery.ts for all timezone references", "getTodayInTimezone() pattern for LA-aware date computation", "toISOWithTimezone for timezone-offset query bounds"]

key-files:
  created: []
  modified:
    - src/app/api/checkout/session/route.ts
    - src/app/api/cron/delivery-reminders/route.ts
    - src/lib/utils/delivery-dates.ts
    - src/lib/hooks/useDeliveryGate.ts
    - src/lib/utils/delivery-timezone.ts

key-decisions:
  - "30-day future validation uses LA timezone date comparison, not UTC"
  - "Pre-filter cutoff candidates at generation time rather than post-filter"
  - "TIMEZONE constant is single source of truth in types/delivery.ts"

patterns-established:
  - "TIMEZONE import: Always import from @/types/delivery, never hardcode America/Los_Angeles"
  - "getTodayInTimezone: Intl.DateTimeFormat en-CA pattern for YYYY-MM-DD in LA timezone"
  - "toISOWithTimezone for Supabase query bounds: ensures correct UTC offset in filters"

requirements-completed: [TZ-01, TZ-03, TZ-04, TZ-05]

duration: 8min
completed: 2026-03-20
---

# Phase 106 Plan 01: Server Timezone Fixes Summary

**Fix checkout date construction with toISOWithTimezone, cron LA-timezone today, date picker cutoff pre-filter, and 30-day validation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T08:29:48Z
- **Completed:** 2026-03-20T08:38:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Checkout constructs scheduledDate via toISOWithTimezone instead of raw string concatenation, producing correct LA timezone offset
- Cron delivery-reminders computes today in LA timezone instead of UTC, preventing wrong-day queries near midnight
- Date picker pre-filters cutoff-passed candidates so all returned delivery slots are orderable
- 30-day future date validation prevents booking unreasonably far-future deliveries
- All hardcoded "America/Los_Angeles" strings replaced with centralized TIMEZONE constant

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix checkout date construction + 30-day validation** - `e4c536d6` (fix)
2. **Task 2: Fix cron LA date + date picker pre-filter + hardcoded literals** - `7285dcd1` (fix)

## Files Created/Modified
- `src/app/api/checkout/session/route.ts` - toISOWithTimezone for scheduledDate, MAX_DELIVERY_DAYS_FUTURE validation, TIMEZONE import
- `src/app/api/cron/delivery-reminders/route.ts` - getTodayInTimezone helper, toISOWithTimezone for query bounds, TIMEZONE import
- `src/lib/utils/delivery-dates.ts` - isPastCutoffForDay pre-filter in candidate generation loop
- `src/lib/hooks/useDeliveryGate.ts` - TIMEZONE import replacing hardcoded string
- `src/lib/utils/delivery-timezone.ts` - TIMEZONE import replacing hardcoded string

## Decisions Made
- 30-day validation compares input.scheduledDate against todayLA (LA timezone) to avoid UTC date boundary issues
- Pre-filter approach chosen over post-filter for date picker -- eliminates impossible-to-order dates at source
- TIMEZONE constant in types/delivery.ts remains the single canonical definition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All server-side timezone fixes in place, ready for 106-02 test coverage
- Full verification suite passes (818 tests, lint, typecheck, build)

## Self-Check: PASSED

All 5 modified files verified present. Both task commits (e4c536d6, 7285dcd1) verified in git log.

---
*Phase: 106-timezone-correctness*
*Completed: 2026-03-20*
