---
phase: 106-timezone-correctness
plan: 02
subsystem: emails
tags: [timezone, intl, email, dst, delivery, testing]

requires:
  - phase: 106-01
    provides: toISOWithTimezone helper, TIMEZONE constant usage pattern
provides:
  - Timezone-aware email delivery window display with offset abbreviation (PST/PDT)
  - DST-aware test helpers for delivery date utilities
  - DST transition boundary tests for both single-day and multi-day delivery
affects: [email-templates, delivery-dates, checkout]

tech-stack:
  added: []
  patterns: [Intl.DateTimeFormat for DST-aware offset computation, timeZone param in all email formatters]

key-files:
  created: []
  modified:
    - src/app/api/checkout/session/helpers.ts
    - src/emails/components/DeliveryBlock.tsx
    - src/emails/helpers.ts
    - src/emails/OrderConfirmation.tsx
    - src/lib/utils/__tests__/delivery-dates.test.ts
    - src/lib/utils/__tests__/delivery-dates-multiday.test.ts
    - src/app/api/checkout/session/__tests__/helpers.test.ts

key-decisions:
  - "Used Intl.DateTimeFormat with timeZoneName: 'short' for dynamic PST/PDT abbreviation in emails"
  - "Used Intl.DateTimeFormat with timeZoneName: 'shortOffset' for DST-aware makePtDate test helper"
  - "Mocked delivery-timezone in helpers.test.ts to prevent vi.resetModules timeout from heavier import chain"

patterns-established:
  - "All email date/time formatters must include timeZone: TIMEZONE option"
  - "Test makePtDate uses Intl.DateTimeFormat to dynamically compute UTC offset instead of hardcoding -08:00"

requirements-completed: [TZ-02]

duration: 17min
completed: 2026-03-20
---

# Phase 106 Plan 02: Email Timezone Display & Test DST Fix Summary

**COD email delivery windows now show timezone offset (e.g., "10:00 AM - 6:00 PM PST") and test helpers dynamically compute DST-correct UTC offsets**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-20T08:29:52Z
- **Completed:** 2026-03-20T08:46:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- COD email delivery windows use `toISOWithTimezone` for offset-aware ISO strings (both customer and admin emails)
- All email date/time formatters (`DeliveryBlock`, `emails/helpers`, `OrderConfirmation`) include `timeZone: TIMEZONE`
- Delivery time range in emails shows timezone abbreviation (e.g., "10:00 AM - 6:00 PM PST")
- Test `makePtDate` helper uses `Intl.DateTimeFormat` to dynamically detect PST vs PDT offset
- DST transition tests added for spring-forward and fall-back boundaries in both test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix COD email delivery window props + email formatters** - `7474dd64` (fix)
2. **Task 2: Fix test DST hardcoding + add DST transition tests** - `2309dc93` (test)
3. **Auto-fix: Mock delivery-timezone in helpers test** - `7ce09d13` (fix)

## Files Created/Modified
- `src/app/api/checkout/session/helpers.ts` - Use toISOWithTimezone for delivery window props (customer + admin email)
- `src/emails/components/DeliveryBlock.tsx` - Add timeZone: TIMEZONE to formatters, getTimezoneAbbr helper, tzAbbr display
- `src/emails/helpers.ts` - Add timeZone: TIMEZONE to formatDate
- `src/emails/OrderConfirmation.tsx` - Add timeZone: TIMEZONE to local formatDate
- `src/lib/utils/__tests__/delivery-dates.test.ts` - DST-aware makePtDate, 3 DST transition tests
- `src/lib/utils/__tests__/delivery-dates-multiday.test.ts` - DST-aware makePtDate, 2 DST transition tests
- `src/app/api/checkout/session/__tests__/helpers.test.ts` - Mock toISOWithTimezone to prevent timeout

## Decisions Made
- Used `timeZoneName: "short"` (returns "PST"/"PDT") for email display vs `"shortOffset"` (returns "GMT-8")
- Used `Intl.DateTimeFormat` with `timeZoneName: "shortOffset"` for test helper offset detection -- more reliable than regex on timezone names
- Mocked `delivery-timezone` module in helpers.test.ts to prevent vi.resetModules dynamic import timeout caused by new dependency chain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Helpers test timeout from new import chain**
- **Found during:** Post-task verification (full test suite)
- **Issue:** Adding `toISOWithTimezone` import to `helpers.ts` made `vi.resetModules()` + `await import("../helpers")` exceed 10s timeout in `helpers.test.ts`
- **Fix:** Added `vi.mock("@/lib/utils/delivery-timezone")` to the test file to stub the new dependency
- **Files modified:** `src/app/api/checkout/session/__tests__/helpers.test.ts`
- **Verification:** All 818 tests pass
- **Committed in:** `7ce09d13`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix to maintain test suite stability. No scope creep.

## Issues Encountered
- `OrderCancellation.tsx` also has `toLocaleDateString` without `timeZone` param -- same bug pattern but out of plan scope. Logged to `deferred-items.md`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All email formatters in plan scope are timezone-aware
- Test infrastructure uses DST-correct offset computation
- `OrderCancellation.tsx` timezone fix deferred (out of scope for this plan)

---
*Phase: 106-timezone-correctness*
*Completed: 2026-03-20*
