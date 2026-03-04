---
phase: 96-integration-wiring-dead-code
plan: 02
subsystem: api, ui
tags: [reorder, slug, cart, dead-code, zustand]

# Dependency graph
requires:
  - phase: 90-menu-photos
    provides: slug-based menu item identification
provides:
  - Reorder API returning slug for correct cart item creation
  - Codebase free of dead updatePricesFromServer / 409 PRICE_CHANGED code
affects: [checkout, cart, account-orders]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/app/api/account/orders/[id]/reorder/route.ts
    - src/lib/hooks/useReorder.ts
    - src/components/ui/account/OrdersTab/OrdersTab.tsx
    - src/components/ui/account/OrdersTab/types.ts

key-decisions:
  - "slug sourced from menu_items table join in reorder API (not a separate lookup)"

patterns-established: []

requirements-completed: [CUX-11, CHKT-02]

# Metrics
duration: 10min
completed: 2026-03-04
---

# Phase 96 Plan 02: Reorder Slug Fix & Dead Code Removal Summary

**Reorder API returns menu item slug for correct cart item lookup; dead updatePricesFromServer and 409 PRICE_CHANGED handler removed**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-04T07:47:16Z
- **Completed:** 2026-03-04T07:58:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Fixed reorder bug where UUID was passed as menuItemSlug instead of actual menu item slug
- Added slug field to reorder API response (MenuItemRow, CartItem, select query, push)
- Both consumers (useReorder.ts and OrdersTab.tsx) now correctly use item.slug
- Dead code (updatePricesFromServer type, implementation, 409 handler) confirmed removed by prior plan 96-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix reorder API to return slug and update consumers** - `dafd8b92` (fix)
2. **Task 2: Remove dead updatePricesFromServer code and 409 handler** - already completed by 96-01 plan (commit `25e66fb1`)

## Files Created/Modified
- `src/app/api/account/orders/[id]/reorder/route.ts` - Added slug to MenuItemRow, CartItem, select query, and push
- `src/lib/hooks/useReorder.ts` - Added slug to interface, changed menuItemSlug from item.menuItemId to item.slug
- `src/components/ui/account/OrdersTab/OrdersTab.tsx` - Changed menuItemSlug from item.menuItemId to item.slug
- `src/components/ui/account/OrdersTab/types.ts` - Added slug to ReorderCartItem interface

## Decisions Made
- slug sourced from menu_items table join in reorder API (added to existing select, not a separate lookup)

## Deviations from Plan

### Task 2 Already Completed

Task 2 (remove dead updatePricesFromServer code and 409 handler) was already executed by the prior plan 96-01 in commit `25e66fb1`. No duplicate changes were needed.

**1. [Rule 1 - Bug] Removed unused imports from PaymentStepV8.tsx**
- **Found during:** Task 2 (dead code removal)
- **Issue:** After 409 handler removal, useCartStore and toast imports became unused (TS6133)
- **Fix:** Removed both unused imports
- **Files modified:** src/components/ui/checkout/PaymentStepV8.tsx
- **Verification:** typecheck passes (only pre-existing unrelated stripe test error remains)
- **Committed in:** Already part of 96-01 commit

---

**Total deviations:** 1 (Task 2 overlap with 96-01)
**Impact on plan:** No negative impact. Dead code removal was verified as complete.

## Issues Encountered
- Pre-existing typecheck error in `src/app/api/webhooks/stripe/__tests__/route.test.ts` (unrelated Stripe type issue) -- out of scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Reorder flow now correctly uses slug-based cart lookups
- All dead price-drift code removed from codebase
- Ready for production deployment

## Self-Check: PASSED

- All 4 modified files exist
- Task 1 commit `dafd8b92` verified in git log
- SUMMARY.md created at `.planning/phases/96-integration-wiring-dead-code/96-02-SUMMARY.md`
- Zero `updatePricesFromServer` references in `src/`
- Zero `menuItemSlug.*menuItemId` references in `src/`

---
*Phase: 96-integration-wiring-dead-code*
*Completed: 2026-03-04*
