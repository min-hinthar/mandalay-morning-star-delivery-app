---
phase: 89-critical-bug-fixes
plan: 03
subsystem: payments
tags: [stripe, refund, zustand, cart, debounce, race-condition]

requires:
  - phase: none
    provides: first phase of v2.0
provides:
  - Refund amount ceiling validation (calculate-then-apply pattern)
  - Atomic debounce check inside Zustand set() callback
affects: [91-checkout-payment-hardening, 95-observability-testing]

tech-stack:
  added: []
  patterns: [calculate-then-apply, atomic-debounce-in-set]

key-files:
  created: []
  modified:
    - src/app/api/admin/orders/[id]/refund/route.ts
    - src/lib/stores/cart-store.ts
    - src/lib/stores/__tests__/cart-store.test.ts

key-decisions:
  - "Refund uses two-phase calculate-then-apply pattern to avoid DB writes before ceiling validation"
  - "Debounce check moved inside Zustand set() for atomicity, standalone shouldDebounce function removed"
  - "Cart quantity cap and cart full messages use setTimeout toast to avoid React state update warnings"

patterns-established:
  - "Calculate-then-apply pattern: accumulate all changes in memory, validate business rules, then apply DB writes"
  - "Atomic side-effect pattern: module-level Map read/write inside Zustand set() callback for consistent state"

requirements-completed: [BUG-05, BUG-06]

duration: 12min
completed: 2026-03-03
---

# Phase 89 Plan 03: Refund Ceiling + Cart Debounce Fix Summary

**Refund endpoint rejects amounts exceeding order total via calculate-then-apply pattern, and cart debounce check is atomic with Zustand state mutation**

## Performance

- **Duration:** 12 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Refund route restructured: calculates total refund first, validates ceiling, then applies DB writes
- Cart addItem debounce check + timestamp update moved inside set() callback for atomicity
- Error message includes both refund amount and order total formatted in dollars
- 3 new test cases for debounce race condition scenarios

## Task Commits

1. **Task 1: Add refund amount ceiling validation (BUG-05)** - `ce9d3259` (fix)
2. **Task 2: Fix cart store debounce race condition (BUG-06)** - `5bea186f` (fix)

## Files Created/Modified
- `src/app/api/admin/orders/[id]/refund/route.ts` - Two-phase calculate-then-apply with ceiling check
- `src/lib/stores/cart-store.ts` - Debounce inside set(), removed standalone shouldDebounce
- `src/lib/stores/__tests__/cart-store.test.ts` - Debounce race condition tests

## Decisions Made
- Calculate-then-apply chosen over single-pass to avoid partial DB writes on ceiling violation
- shouldDebounce function removed entirely (not just deprecated) since debounce logic is now inline

## Deviations from Plan

### Auto-fixed Issues

**1. [Lint - Unused Variable] Removed standalone shouldDebounce function**
- **Found during:** Task 2 (Cart debounce fix)
- **Issue:** After moving debounce logic inside set(), the shouldDebounce function became unused, triggering ESLint error
- **Fix:** Removed the function entirely, replaced with a comment explaining the inline approach
- **Files modified:** src/lib/stores/cart-store.ts
- **Verification:** pnpm lint passes
- **Committed in:** `5bea186f` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 lint)
**Impact on plan:** Essential cleanup for lint compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Refund flow is ceiling-guarded; Phase 95 can add refund rounding tests
- Cart debounce is race-condition-free; Phase 91 cart enhancements can build on this

---
*Phase: 89-critical-bug-fixes, Plan: 03*
*Completed: 2026-03-03*
