---
phase: 61-admin-pages
plan: 01
subsystem: api
tags: [supabase, zod, resend, email, audit-log, admin-api]

# Dependency graph
requires:
  - phase: 41-admin-orders
    provides: "Base order details and status API routes"
provides:
  - "Extended order details API with delivery window, Stripe payment ID, priority"
  - "Status update with email notification and audit logging"
  - "Priority toggle endpoint with audit logging"
  - "is_priority column migration for orders table"
affects: [61-02, 61-03, 61-04, 61-05, admin-order-detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status email dispatch with try/catch wrapping (email failure never blocks API response)"
    - "Audit log on every admin state mutation (status_change, priority_change)"

key-files:
  created:
    - "src/app/api/admin/orders/[id]/priority/route.ts"
    - "supabase/migrations/20260214_add_orders_is_priority.sql"
  modified:
    - "src/app/api/admin/orders/[id]/details/route.ts"
    - "src/app/api/admin/orders/[id]/status/route.ts"
    - "src/types/database.ts"
    - "src/test/factories/index.ts"

key-decisions:
  - "Hardcoded discountCents to 0 since discount_cents column does not exist in orders table"
  - "Added priority_change to OrderAuditAction type for audit log consistency"
  - "Status email only sends for confirmed (order_confirmation template) and cancelled transitions; out_for_delivery and delivered skipped until dedicated email templates exist"
  - "Used inline Zod schema for status route instead of importing changeOrderStatusSchema (which includes invalid 'ready' status)"

patterns-established:
  - "Admin mutation pattern: requireAdmin -> validate -> mutate -> audit log -> optional email -> response"
  - "Email dispatch pattern: try/catch wrapper, result.success check, emailSent in response"

# Metrics
duration: 7min
completed: 2026-02-14
---

# Phase 61 Plan 01: Order API Extensions Summary

**Extended order details API with delivery window + Stripe payment ID + priority flag, added audit-logged status email notifications, and priority toggle endpoint with migration**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-14T15:23:17Z
- **Completed:** 2026-02-14T15:30:08Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Order details API now returns deliveryWindowStart, deliveryWindowEnd, stripePaymentIntentId, isPriority, discountCents
- Status PATCH accepts notifyCustomer boolean and optional reason, logs to order_audit_log, sends email on confirmed/cancelled transitions
- New PATCH /api/admin/orders/[id]/priority endpoint with Zod validation and audit logging
- Database migration adds is_priority boolean column to orders table
- OrderAuditAction type extended with priority_change

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend order details API and add priority endpoint + migration** - `6393342` (feat)
2. **Task 2: Extend status route with email notification and reason support** - `8bed81f` (feat)

## Files Created/Modified

- `src/app/api/admin/orders/[id]/details/route.ts` - Extended with delivery window, Stripe payment ID, priority, discountCents fields
- `src/app/api/admin/orders/[id]/status/route.ts` - Extended with notifyCustomer, reason, audit logging, email dispatch
- `src/app/api/admin/orders/[id]/priority/route.ts` - New priority toggle endpoint with Zod + audit
- `supabase/migrations/20260214_add_orders_is_priority.sql` - is_priority boolean column migration
- `src/types/database.ts` - Added is_priority to OrdersRow/Insert/Update, priority_change to OrderAuditAction
- `src/test/factories/index.ts` - Added is_priority default to mock order factory

## Decisions Made

- Hardcoded discountCents to 0 since no discount_cents column exists in the orders table schema
- Added priority_change to OrderAuditAction union type for type-safe audit logging
- Status email only fires for confirmed (uses order_confirmation template) and cancelled (uses OrderCancellation component); out_for_delivery and delivered transitions log a skip message since no email templates exist yet
- Used inline Zod schema rather than importing changeOrderStatusSchema from validations (that schema includes "ready" which is not a valid OrderStatus)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added priority_change to OrderAuditAction type**

- **Found during:** Task 1 (Priority endpoint)
- **Issue:** OrderAuditAction type did not include "priority_change", causing type error on audit log insert
- **Fix:** Extended the union type in database.ts
- **Files modified:** src/types/database.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 6393342 (Task 1 commit)

**2. [Rule 3 - Blocking] Added is_priority to OrdersRow/Insert/Update types and test factory**

- **Found during:** Task 1 (Priority endpoint)
- **Issue:** is_priority not in database types, blocked Supabase update call and test factory compilation
- **Fix:** Added is_priority field to all three Order interfaces and mock factory
- **Files modified:** src/types/database.ts, src/test/factories/index.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 6393342 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for compilation. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All order detail API data available for frontend consumption
- Status update endpoint ready with email + audit support
- Priority toggle endpoint ready for admin UI integration
- Remaining: Run migration on Supabase to add is_priority column

---

_Phase: 61-admin-pages_
_Completed: 2026-02-14_
