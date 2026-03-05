---
status: awaiting_human_verify
trigger: "Admin order details page actions need improvement - missing actions, UI doesn't update, actions not reversible"
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
---

## Current Focus

hypothesis: Multiple issues - (1) status transitions are forward-only (no backward movement), (2) no refund UI exists on detail page, (3) no driver assignment UI on detail page, (4) cancel is not undoable, (5) UI doesn't refetch after actions
test: Code review of OrderDetailClient, config, API routes
expecting: Confirm which features are missing vs broken
next_action: Implement fixes for all identified gaps

## Symptoms

expected: Admin order detail page should have comprehensive actions: cancel order (reversible/undoable), issue partial/full refunds, manually change order status (including moving backwards), and reassign driver. All actions should update the UI immediately after success.
actual: Some actions are missing entirely. When actions do work, the UI sometimes doesn't reflect the change. Actions are not reversible (e.g., can't un-cancel an order).
errors: No specific error messages reported.
reproduction: Go to admin order detail page, try to perform various order management actions.
started: Current state of the feature.

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-04T00:01:00Z
  checked: NEXT_STATUSES config in OrderDetailExpanded/config.ts
  found: Status transitions are strictly forward-only. delivered=[], cancelled=[]. No backward transitions allowed.
  implication: Admin cannot move status backward (e.g., un-cancel, revert delivered to out_for_delivery)

- timestamp: 2026-03-04T00:02:00Z
  checked: API route /api/admin/orders/[id]/status/route.ts
  found: VALID_TRANSITIONS map enforces forward-only transitions. cancelled->[] and delivered->[]
  implication: Both frontend config AND backend API restrict backward transitions

- timestamp: 2026-03-04T00:03:00Z
  checked: OrderDetailClient.tsx for refund UI
  found: No refund dialog/button exists. OrderItemsCard shows refund status (strikethrough) but has no refund action
  implication: Refund API exists (/api/admin/orders/[id]/refund) but no UI to trigger it

- timestamp: 2026-03-04T00:04:00Z
  checked: OrderDetailClient.tsx for driver assignment UI
  found: OrderHeaderCard displays driver name but no reassign/assign button. API exists (/api/admin/orders/[id]/driver)
  implication: Driver assignment API exists but no UI to trigger it

- timestamp: 2026-03-04T00:05:00Z
  checked: handleStatusChanged in OrderDetailClient
  found: Does optimistic update of status only. Does NOT refetch order details (audit log, timestamps won't update)
  implication: After status change, audit log and timestamp fields are stale until page refresh

## Resolution

root_cause: |
  5 issues identified:
  1. NEXT_STATUSES config + API VALID_TRANSITIONS are forward-only - no backward status movement
  2. No refund dialog UI exists despite refund API being complete
  3. No driver assignment UI exists despite driver API being complete
  4. Cancelled orders cannot be un-cancelled (no undo path)
  5. After status change, only status field is optimistically updated - audit log and other fields not refreshed
fix: |
  1. Updated NEXT_STATUSES in config.ts AND OrderDetailDrawer.tsx to allow backward status transitions
  2. Updated API VALID_TRANSITIONS to allow backward transitions (cancelled->pending, delivered->out_for_delivery, etc.)
  3. Created RefundDialog.tsx - full item-level refund UI with quantity selection, shipping refund option
  4. Created DriverAssignDialog.tsx - fetches active drivers, shows assign/reassign/unassign UI
  5. Added cancelled->pending ("Reopen Order") transition for undo capability
  6. fetchOrderDetails() now called after status changes, refunds, driver changes (no loading spinner on refetch)
  7. OrderItemsCard gains "Refund" button in header (via CollapsibleCard action prop)
  8. OrderHeaderCard gains "Assign"/"Reassign" link next to driver name
  9. Revert/Reopen buttons styled with outline variant to distinguish from forward transitions
  10. StatusChangeDialog updated with email subjects for backward transitions
verification: TypeScript passes, ESLint passes on all changed files
files_changed:
  - src/components/ui/admin/orders/OrderDetailExpanded/config.ts
  - src/components/ui/admin/orders/OrderDetailDrawer.tsx
  - src/app/api/admin/orders/[id]/status/route.ts
  - src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx
  - src/components/ui/admin/orders/OrderDetailPage/OrderHeaderCard.tsx
  - src/components/ui/admin/orders/OrderDetailPage/OrderItemsCard.tsx
  - src/components/ui/admin/orders/OrderDetailPage/StatusChangeDialog.tsx
  - src/components/ui/admin/orders/OrderDetailPage/RefundDialog.tsx (new)
  - src/components/ui/admin/orders/OrderDetailPage/DriverAssignDialog.tsx (new)
