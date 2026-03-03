---
phase: 78-configurable-business-rules
plan: 02
subsystem: api
tags: [parameterization, business-rules, checkout, delivery-dates, order-calculation]

# Dependency graph
requires:
  - "78-01: getBusinessRules() cached reader, generateTimeWindows() function"
provides:
  - "Parameterized delivery-dates.ts accepting cutoffDay/cutoffHour instead of importing constants"
  - "Parameterized order.ts accepting deliveryFeeCents/freeDeliveryThresholdCents instead of hardcoded constants"
  - "Checkout route wired to getBusinessRules() for cutoff, fees, and time window validation"
  - "Checkout validation schema without hardcoded TIME_WINDOWS dependency"
affects: [78-03, 78-04, client-side-consumers, checkout-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional params with backward-compatible defaults for incremental migration"
    - "Server-side business logic validation in route handler (not in Zod schema)"

key-files:
  created: []
  modified:
    - src/lib/utils/delivery-dates.ts
    - src/lib/utils/order.ts
    - src/lib/utils/__tests__/delivery-dates.test.ts
    - src/lib/utils/__tests__/order.test.ts
    - src/app/api/checkout/session/route.ts
    - src/lib/validations/checkout.ts

key-decisions:
  - "Used optional params with defaults instead of mandatory params to maintain backward compatibility with client-side consumers (TimeStepV8, useTimeSlot, order detail page, retry-payment) until Plans 03/04 migrate them"
  - "Moved TIME_WINDOWS validation from Zod .refine() to checkout route handler where getBusinessRules() provides dynamic window generation"

patterns-established:
  - "Parameterized utility pattern: functions accept business rule values as optional params, defaulting to BUSINESS_RULES_DEFAULTS-equivalent values"
  - "Schema vs route handler validation split: structural validation in Zod, business logic validation in route handler"

requirements-completed: [RULES-07]

# Metrics
duration: 9min
completed: 2026-03-01
---

# Phase 78 Plan 02: Server-Side Consumer Migration Summary

**Parameterized delivery-dates.ts and order.ts with cutoff/fee params, wired checkout route to getBusinessRules() for dynamic cutoff, fee, and time window validation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-01T11:26:32Z
- **Completed:** 2026-03-01T11:35:37Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `delivery-dates.ts` functions accept `cutoffDay`/`cutoffHour` as optional parameters instead of importing constants
- `order.ts` functions accept `deliveryFeeCents`/`freeDeliveryThresholdCents` as optional parameters instead of using hardcoded constants
- Checkout route calls `getBusinessRules()` and passes DB-sourced values to all business logic functions
- Time window validation moved from static `TIME_WINDOWS` constant in Zod schema to dynamic `generateTimeWindows()` in route handler
- 12 delivery-dates tests and 36 order tests pass including new parameterization tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Parameterize delivery-dates.ts and order.ts** - `89fb1df7` (feat)
2. **Task 2: Wire checkout route to getBusinessRules()** - `175b422a` (feat)

## Files Created/Modified

- `src/lib/utils/delivery-dates.ts` - Added cutoffDay/cutoffHour params to getCutoffForSaturday, isPastCutoff, getDeliveryDate, getTimeUntilCutoff, getAvailableDeliveryDates
- `src/lib/utils/order.ts` - Added deliveryFeeCents/freeDeliveryThresholdCents params to calculateDeliveryFee, calculateOrderTotals; removed exported constants
- `src/lib/utils/__tests__/delivery-dates.test.ts` - Updated all calls with explicit params, added parameterization tests (custom Thursday cutoff)
- `src/lib/utils/__tests__/order.test.ts` - Updated all calls with explicit params, added custom fee/threshold tests
- `src/app/api/checkout/session/route.ts` - Added getBusinessRules() call, dynamic time window validation, parameterized cutoff/fee calls
- `src/lib/validations/checkout.ts` - Removed TIME_WINDOWS import and .refine(), kept structural validation only

## Decisions Made

- Used optional params with backward-compatible defaults (matching `BUSINESS_RULES_DEFAULTS`) instead of mandatory params. This allows client-side consumers (`TimeStepV8`, `useTimeSlot`, order detail page, retry-payment route) to continue working without changes until Plans 03/04 migrate them.
- Moved TIME_WINDOWS validation from Zod `.refine()` in the schema to the checkout route handler. The schema now only validates structural format (HH:MM), while the route handler validates against `generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added backward-compatible default params instead of mandatory params**
- **Found during:** Task 1
- **Issue:** Making cutoffDay/cutoffHour mandatory would break 5+ client-side consumers (TimeStepV8, useTimeSlot, orders/[id]/page.tsx, retry-payment/route.ts) that call these functions without business rules params
- **Fix:** Made all new params optional with defaults matching BUSINESS_RULES_DEFAULTS values (cutoffDay=5, cutoffHour=15, deliveryFeeCents=1500, freeDeliveryThresholdCents=10000)
- **Files modified:** `src/lib/utils/delivery-dates.ts`, `src/lib/utils/order.ts`
- **Verification:** `pnpm typecheck` passes, all 353 tests pass
- **Committed in:** `89fb1df7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Default params maintain backward compatibility without scope creep. Server-side consumers still explicitly pass DB values.

## Issues Encountered

- Pre-commit hook failed on first Task 2 commit attempt due to unrelated `SettingsClient.tsx` exceeding 400-line limit (pre-existing from Plan 01). Resolved by unstaging unrelated files and committing only Task 2 files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All server-side business logic now reads from `getBusinessRules()` or accepts configurable parameters
- Client-side consumers (TimeStepV8, useTimeSlot, order pages) still use defaults -- ready for Plan 03/04 migration
- Checkout route fully wired to DB-sourced business rules

## Self-Check: PASSED

- All 6 modified files verified present
- Commits `89fb1df7` and `175b422a` verified in git log
