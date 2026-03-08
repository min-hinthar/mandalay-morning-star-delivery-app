---
status: awaiting_human_verify
trigger: "COD orders must be approved via the /approve-cod endpoint but it returns 400 error"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Orders list page calls generic /status endpoint instead of /approve-cod
test: Traced admin UI code paths
expecting: N/A - root cause confirmed
next_action: Fix handleStatusChange in orders page + fix audit log insert in approve-cod route

## Symptoms

expected: Full COD flow — customer submits COD order, admin sees it in pending_approval status, admin approves via /approve-cod endpoint, order proceeds to confirmed
actual: The /approve-cod endpoint returns a 400 error
errors: HTTP 400 from /approve-cod endpoint - message "COD orders must be approved via the /approve-cod endpoint"
reproduction: Attempt to approve a COD order via the admin interface (orders list drawer)
started: Never worked — COD approval has never functioned correctly

## Eliminated

- hypothesis: approve-cod route logic is wrong
  evidence: Route logic is correct - validates payment_method=cod and status=pending_approval, then updates. The 400 doesn't come from this route.
  timestamp: 2026-03-07

- hypothesis: RPC doesn't set pending_approval/cod payment_method
  evidence: 20260307_multiday_delivery_cod.sql migration defines correct RPC with COD logic
  timestamp: 2026-03-07

- hypothesis: RLS blocks the update
  evidence: orders_update policy allows admin updates via is_admin() check
  timestamp: 2026-03-07

## Evidence

- timestamp: 2026-03-07
  checked: StatusChangeDialog.tsx (OrderDetailPage)
  found: Correctly routes pending_approval->confirmed to POST /approve-cod
  implication: Detail page flow would work

- timestamp: 2026-03-07
  checked: OrderDetailDrawer.tsx + admin/orders/page.tsx handleStatusChange
  found: handleStatusChange ALWAYS calls PATCH /api/admin/orders/${orderId}/status, never routes to /approve-cod
  implication: This is the code path the admin uses, and it hits the explicit 400 block in the status route

- timestamp: 2026-03-07
  checked: admin/orders/[id]/status/route.ts lines 93-101
  found: Explicit block: if currentStatus===pending_approval && newStatus===confirmed, return 400 "COD orders must be approved via the /approve-cod endpoint"
  implication: The 400 error message matches the symptom exactly

- timestamp: 2026-03-07
  checked: approve-cod route audit log insert (lines 81-89)
  found: Uses action "cod_approved" (not in CHECK constraint) and columns new_status/old_status (don't exist - table has old_value/new_value JSONB). Insert silently fails.
  implication: Secondary bug - audit trail is broken for COD approvals

## Resolution

root_cause: |
  Two bugs:
  1. PRIMARY: admin/orders/page.tsx handleStatusChange() always calls the generic /status endpoint.
     For pending_approval->confirmed, the status route explicitly returns 400 saying "use /approve-cod".
     But handleStatusChange never routes to /approve-cod.
  2. SECONDARY: approve-cod route's audit log insert uses wrong action value ("cod_approved" not in
     CHECK constraint) and wrong column names (new_status/old_status vs old_value/new_value).
fix: |
  1. Fixed handleStatusChange in admin/orders/page.tsx to detect when current order status is
     pending_approval and newStatus is confirmed, then route to POST /approve-cod instead of
     PATCH /status.
  2. Fixed audit log insert in approve-cod route to use action "status_change" (valid CHECK
     constraint value) and correct column names old_value/new_value (JSONB) instead of
     old_status/new_status (nonexistent).
verification: typecheck passes, code review confirms both call sites now consistent with StatusChangeDialog pattern
files_changed:
  - src/app/(admin)/admin/orders/page.tsx
  - src/app/api/admin/orders/[id]/approve-cod/route.ts
