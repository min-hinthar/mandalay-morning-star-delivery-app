---
phase: 89-critical-bug-fixes
plan: 04
subsystem: api
tags: [delivery-dates, cutoff, safety-buffer, timezone]

requires:
  - phase: none
    provides: first phase of v2.0
provides:
  - 10-second cutoff safety buffer in isPastCutoff
  - Boundary test suite for cutoff edge cases
affects: [91-checkout-payment-hardening, 92-customer-ux-discovery, 95-observability-testing]

tech-stack:
  added: []
  patterns: [safety-buffer-constant]

key-files:
  created: []
  modified:
    - src/lib/utils/delivery-dates.ts
    - src/lib/utils/__tests__/delivery-dates.test.ts

key-decisions:
  - "Buffer only affects isPastCutoff (server-side submission check), not getTimeUntilCutoff (UI countdown)"
  - "10 seconds chosen to cover worst-case DB insert latency without being noticeable to customers"
  - "Buffer constant is module-private (not exported) since it's an implementation detail"

patterns-established:
  - "Safety buffer pattern: submission check uses buffer, UI display uses raw time"
  - "Boundary test pattern: test at buffer-1ms, buffer, buffer+1ms, exact cutoff, and after cutoff"

requirements-completed: [BUG-07]

duration: 6min
completed: 2026-03-03
---

# Phase 89 Plan 04: Cutoff Safety Buffer Summary

**10-second safety buffer on isPastCutoff prevents orders at the cutoff boundary from failing due to DB insert latency, invisible to customer UI countdown**

## Performance

- **Duration:** 6 min
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- isPastCutoff returns true when within 10 seconds of cutoff (prevents DB-latency edge case)
- getTimeUntilCutoff deliberately NOT modified (UI shows real countdown, buffer is server-only)
- 7 new boundary tests: 11s before (false), 10s before (true), 5s before (true), exact (true), after (true), 1h before (false), UI independence

## Task Commits

1. **Task 1: Add 10-second safety buffer to isPastCutoff (BUG-07)** - `3d0acdff` (fix)

## Files Created/Modified
- `src/lib/utils/delivery-dates.ts` - Added CUTOFF_SAFETY_BUFFER_MS constant, modified isPastCutoff comparison
- `src/lib/utils/__tests__/delivery-dates.test.ts` - 7 boundary tests including UI independence assertion

## Decisions Made
- Buffer is invisible to customers (same rejection message as normal cutoff)
- getTimeUntilCutoff keeps raw comparison so UI countdown doesn't jump 10 seconds early

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cutoff safety is in place; Phase 95 can add DST transition tests on top of this buffer
- Phase 92 dynamic gate polling can rely on this safety margin

---
*Phase: 89-critical-bug-fixes, Plan: 04*
*Completed: 2026-03-03*
