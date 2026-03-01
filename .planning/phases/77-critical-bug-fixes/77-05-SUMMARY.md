---
phase: 77-critical-bug-fixes
plan: 05
subsystem: ui
tags: [admin, orders, refund, badge, filter]

requires:
  - phase: 77-01
    provides: refund_status column on orders table
provides:
  - Admin order list with refund badges (amber=partial, red=full) and filter
  - Customer order history with refund indicator badges
affects: []

tech-stack:
  added: []
  patterns: [refund status badge, conditional filter UI]

key-files:
  created: []
  modified:
    - src/app/(admin)/admin/orders/page.tsx
    - src/app/api/admin/orders/route.ts
    - src/components/ui/admin/OrdersTable.tsx
    - src/components/ui/admin/orders/OrderCardRow.tsx
    - src/components/ui/admin/orders/OrderDetailDrawer.tsx
    - src/components/ui/account/OrdersTab/types.ts
    - src/components/ui/account/OrdersTab/OrdersTab.tsx
    - src/app/(customer)/orders/page.tsx
    - src/components/ui/orders/OrderListAnimated.tsx
    - src/components/ui/orders/OrderCard.tsx

key-decisions:
  - "Refund filter only shown when orders with refunds exist"
  - "Customer sees 'Partial Refund' or 'Refunded' badge, admin sees full status"

patterns-established:
  - "Refund status badge pattern: amber=partial, red=full, hidden=none"

requirements-completed: [BUG-07]

duration: 15min
completed: 2026-03-01
---

# Plan 05: Refund Status UI Summary

**Admin orders with colored refund badges and filter, customer orders with refund indicator badges**

## Performance

- **Duration:** 15 min
- **Tasks:** 2
- **Files modified:** 13 (including test fixes)

## Accomplishments
- Admin: refundStatus in AdminOrder type, filter UI (partial/full), colored badges in card row and drawer
- Customer: refundStatus in Order type, badges in OrdersTab, OrderCard, OrderListAnimated
- API: refund_status included in admin orders select query
- Tests: updated to match new checkout schema (basePriceCents, priceDeltaCents)

## Task Commits

1. **Task 1+2: Admin and customer refund UI + test fixes** - `6844f302` (fix)

## Files Created/Modified
- `src/app/api/admin/orders/route.ts` - refund_status in select query
- `src/app/(admin)/admin/orders/page.tsx` - Refund filter state, UI, transform
- `src/components/ui/admin/OrdersTable.tsx` - refundStatus in AdminOrder type
- `src/components/ui/admin/orders/OrderCardRow.tsx` - Refund badges desktop+mobile
- `src/components/ui/admin/orders/OrderDetailDrawer.tsx` - Refund badge in drawer header
- `src/components/ui/account/OrdersTab/types.ts` - refundStatus in Order/OrderRow
- `src/components/ui/account/OrdersTab/OrdersTab.tsx` - Fetch refund_status, render badge
- `src/app/(customer)/orders/page.tsx` - refund_status in query and transform
- `src/components/ui/orders/OrderListAnimated.tsx` - refundStatus in Order interface
- `src/components/ui/orders/OrderCard.tsx` - Refund badge rendering
- `src/test/factories/index.ts` - refund_status default, priceDeltaCents in factory
- `src/app/api/checkout/session/__tests__/route.test.ts` - basePriceCents/priceDeltaCents
- `src/lib/utils/__tests__/order.test.ts` - basePriceCents/priceDeltaCents

## Decisions Made
- Refund filter only renders when there are orders with partial or full refunds
- ESLint required text-text-inverse instead of text-white for active filter badges

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint text-white violation**
- **Found during:** Commit pre-commit hook
- **Issue:** Used `text-white` in refund filter badges, project requires semantic tokens
- **Fix:** Changed to `text-text-inverse`
- **Files modified:** src/app/(admin)/admin/orders/page.tsx
- **Verification:** ESLint passes

**2. [Rule 3 - Blocking] Test files needed basePriceCents and priceDeltaCents**
- **Found during:** TypeScript typecheck
- **Issue:** Plan 02 schema changes require test data updates
- **Fix:** Added basePriceCents to item objects and priceDeltaCents to modifier objects in tests
- **Files modified:** route.test.ts, order.test.ts, factories/index.ts
- **Verification:** 335 tests pass, typecheck clean

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for build to pass. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 bugs fixed, phase complete

---
*Phase: 77-critical-bug-fixes*
*Completed: 2026-03-01*
