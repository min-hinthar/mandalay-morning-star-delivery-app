---
phase: 77-critical-bug-fixes
plan: 02
subsystem: api
tags: [checkout, stripe, zod, validation, supabase]

requires: []
provides:
  - BUG-01 fix: TOCTOU cleanup uses .in() instead of broken .eq()
  - BUG-02 fix: isPastCutoff uses configurable CUTOFF_DAY constant
  - BUG-03 fix: Time window validation against TIME_WINDOWS list
  - BUG-05 fix: Server-side cutoff re-validation at submission
  - BUG-08 fix: Price drift detection comparing client vs DB prices
affects: [77-04]

tech-stack:
  added: []
  patterns: [price drift detection, cutoff re-validation, time window whitelist]

key-files:
  created: []
  modified:
    - src/app/api/checkout/session/route.ts
    - src/lib/validations/checkout.ts
    - src/lib/utils/delivery-dates.ts
    - src/types/checkout.ts

key-decisions:
  - "Return 409 Conflict for price drift with priceDrifts array for client handling"
  - "CUTOFF_PASSED returns next delivery date for client display"
  - "basePriceCents and priceDeltaCents added to Zod schema for drift detection"

patterns-established:
  - "Price drift detection: compare client-reported prices against DB at checkout"
  - "Re-validate business rules at submission, not just at form load"

requirements-completed: [BUG-01, BUG-02, BUG-03, BUG-05, BUG-08]

duration: 10min
completed: 2026-03-01
---

# Plan 02: Server-Side Checkout Fixes Summary

**Fixed 5 checkout bugs: TOCTOU cleanup, cutoff day config, time window validation, cutoff re-check, price drift detection**

## Performance

- **Duration:** 10 min
- **Tasks:** 1 (combined)
- **Files modified:** 4

## Accomplishments
- BUG-01: TOCTOU cleanup now uses `.in()` for all order_item_ids instead of broken `.eq()`
- BUG-02: `isPastCutoff` uses configurable `CUTOFF_DAY` constant instead of hardcoded offset
- BUG-03: Time windows validated against `TIME_WINDOWS` whitelist via Zod `.refine()`
- BUG-05: Cutoff re-validated server-side at checkout submission time
- BUG-08: Price drift detection compares client basePriceCents/priceDeltaCents against DB

## Task Commits

1. **Task 1: All server fixes** - `fce0fb06` (fix)

## Files Created/Modified
- `src/app/api/checkout/session/route.ts` - BUG-01/05/08 fixes
- `src/lib/validations/checkout.ts` - BUG-03/08 schema changes
- `src/lib/utils/delivery-dates.ts` - BUG-02 CUTOFF_DAY usage
- `src/types/checkout.ts` - Added PRICE_CHANGED, RATE_LIMITED error codes

## Decisions Made
- Combined 5 bugs into one commit since they all touch the checkout flow
- Price drift returns 409 with detailed priceDrifts array for UI handling

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Checkout validation hardened; Plan 04 depends on new schema fields

---
*Phase: 77-critical-bug-fixes*
*Completed: 2026-03-01*
