---
status: awaiting_human_verify
trigger: "Customers should be able to make multiple orders for the same delivery day, but the DUPLICATE_ORDER constraint blocks this."
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
---

## Current Focus

hypothesis: Three layers of duplicate order enforcement need removal
test: Remove all three layers and verify build passes
expecting: Clean removal allows multiple orders per day
next_action: Apply fixes to all files

## Symptoms

expected: A customer should be able to place multiple separate orders for the same Saturday delivery date.
actual: The DUPLICATE_ORDER check (both client-side useExistingOrder warning and server-side enforcement) prevents placing a second order for the same day.
errors: DUPLICATE_ORDER error or warning when attempting to place a second order for the same day.
reproduction: Place an order for a Saturday. Then try to place another order for the same Saturday.
started: Duplicate detection was implemented in Phase 91 as a deliberate design choice. Now needs to be changed.

## Eliminated

## Evidence

- timestamp: 2026-03-04T00:05:00Z
  checked: All DUPLICATE_ORDER references and duplicate order prevention code
  found: Three layers of enforcement:
    1. DB unique index `idx_orders_user_delivery_date` (supabase/migrations/005_indexes.sql:33, 035_checkout_hardening.sql:28)
    2. Server-side check in checkout API (src/app/api/checkout/session/route.ts:88-110)
    3. Client-side hook + UI warning (src/lib/hooks/useExistingOrder.ts, src/app/(customer)/checkout/CheckoutClient.tsx:84,188-200)
    4. PaymentStep DUPLICATE_ORDER error handler (src/components/ui/checkout/PaymentStepV8.tsx:145-150)
    5. Type definition includes DUPLICATE_ORDER (src/types/checkout.ts:69)
  implication: All three layers must be removed/modified. Reorder API is unaffected (just populates cart).

## Resolution

root_cause: CHKT-05 duplicate order prevention enforced at DB (unique index), server (checkout API), and client (useExistingOrder hook + UI warning) layers blocks multiple orders per day
fix: Removed all three layers of enforcement -- server-side check, client-side hook/warning, type definition, dry-run workaround, and created migration to drop DB unique index
verification: TypeScript compiles with zero new errors in modified files
files_changed:
  - src/app/api/checkout/session/route.ts (removed CHKT-05 duplicate check, lines 88-110)
  - src/components/ui/checkout/PaymentStepV8.tsx (removed DUPLICATE_ORDER error handler)
  - src/app/(customer)/checkout/CheckoutClient.tsx (removed useExistingOrder import, hook call, and warning UI)
  - src/lib/hooks/useExistingOrder.ts (deleted)
  - src/lib/hooks/index.ts (removed useExistingOrder export)
  - src/types/checkout.ts (removed DUPLICATE_ORDER from CheckoutErrorCode type)
  - scripts/dry-run.ts (removed createOrderDirect bypass and dead function)
  - supabase/migrations/20260304_drop_duplicate_order_index.sql (new migration to drop unique index)
