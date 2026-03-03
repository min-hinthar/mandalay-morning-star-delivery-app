---
phase: 89-critical-bug-fixes
plan: 02
subsystem: api
tags: [supabase, modifier-groups, checkout-validation, constraints]

requires:
  - phase: 89-critical-bug-fixes/01
    provides: cleanupOrder helper and refactored checkout route
provides:
  - Server-side modifier group min_select/max_select constraint validation
  - ModifierGroupWithItems interface for group-to-item association
affects: [91-checkout-payment-hardening, 95-observability-testing]

tech-stack:
  added: []
  patterns: [modifier-group-constraint-validation]

key-files:
  created: []
  modified:
    - src/lib/utils/order.ts
    - src/lib/utils/__tests__/order.test.ts
    - src/app/api/checkout/session/route.ts

key-decisions:
  - "modifierGroups parameter is optional for backward compatibility with existing callers"
  - "max_select=0 treated as unlimited (no upper bound check)"
  - "Group data fetched via item_modifier_groups join with modifier_groups select"

patterns-established:
  - "Optional constraint parameter pattern: new validation layers added as optional params to preserve backward compat"
  - "ModifierGroupWithItems pattern: { group: ModifierGroupsRow, itemIds: string[] } for many-to-many group-to-item lookup"

requirements-completed: [BUG-02]

duration: 10min
completed: 2026-03-03
---

# Phase 89 Plan 02: Modifier Group Constraint Validation Summary

**Server-side min_select/max_select enforcement for modifier groups at checkout, preventing invalid modifier selections from reaching Stripe**

## Performance

- **Duration:** 10 min
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- validateCartItems now validates modifier group constraints when group data is provided
- Checkout route fetches modifier groups via item_modifier_groups join and passes to validation
- Error code MODIFIER_GROUP_CONSTRAINT includes group name, required range, and actual count
- 5 new test cases cover below-min, above-max, valid range, no groups, and backward compat

## Task Commits

1. **Task 1: Add modifier group constraint validation (BUG-02)** - `61ea1b4e` (fix)

## Files Created/Modified
- `src/lib/utils/order.ts` - Added ModifierGroupWithItems interface, group constraint validation loop
- `src/lib/utils/__tests__/order.test.ts` - Added 5 test cases for modifier group constraints
- `src/app/api/checkout/session/route.ts` - Fetches modifier groups, builds lookup map, passes to validateCartItems

## Decisions Made
- Optional parameter preserves backward compat (existing callers without group data still work)
- max_select=0 means unlimited (consistent with DB seed convention)

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Modifier validation is complete; Phase 91 can build on this for modifier bounds UI

---
*Phase: 89-critical-bug-fixes, Plan: 02*
*Completed: 2026-03-03*
