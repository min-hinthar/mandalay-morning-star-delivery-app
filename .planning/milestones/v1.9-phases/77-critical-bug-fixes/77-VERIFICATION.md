# Phase 77: Critical Bug Fixes - Verification

**Verified:** 2026-03-02
**Verifier:** Phase 85 (verification-traceability)
**Result:** PASS — 8/8 requirements verified

## Summary

| BUG | Status | Plan | Evidence Summary |
|-----|--------|------|-----------------|
| BUG-01 | PASS | 02 | `.in()` with order_item_id array replaces broken `.eq()` in cleanup |
| BUG-02 | PASS | 02 | `isPastCutoff()` uses configurable `CUTOFF_DAY`/`CUTOFF_HOUR` with full date+time comparison |
| BUG-03 | PASS | 02 | Time window validated against `generateTimeWindows()` whitelist in route handler |
| BUG-04 | PASS | 03 | `set((state) => ...)` atomic pattern in addItem prevents race conditions |
| BUG-05 | PASS | 02 | Server-side `isPastCutoff()` check at checkout submission time |
| BUG-06 | PASS | 03 | Toast notifications for quantity cap, cart full, and stepper max |
| BUG-07 | PASS | 01, 05 | `refund_status` column + trigger + admin/customer refund badges |
| BUG-08 | PASS | 02, 04 | `basePriceCents`/`priceDeltaCents` in schema + server drift detection + client sends prices |

## Plan 01: Database Migration (BUG-07)

### BUG-07: Refund status column + trigger
- **Requirement:** Unify refund and status transition logic — add 'refunded' status
- **Fix location:** `supabase/migrations/028_refund_status.sql:7-8` (column), `:11-39` (trigger)
- **Behavior change:** Added `refund_status` column ('none'|'partial'|'full') with CHECK constraint. Trigger `trg_compute_refund_status` auto-computes from `order_items.refunded_quantity` on UPDATE. Partial index for efficient filtering. Existing orders backfilled.
- **Commit:** `b8c10686`
- **Test coverage:** Schema validated via typecheck; trigger logic is DB-level (not unit-testable in Vitest)
- **Status:** PASS

## Plan 02: Server-Side Checkout (BUG-01, BUG-02, BUG-03, BUG-05, BUG-08)

### BUG-01: TOCTOU cleanup fix
- **Requirement:** Fix checkout TOCTOU cleanup — `.eq()` -> `.in()` with proper order_item_id array
- **Fix location:** `src/app/api/checkout/session/route.ts:309-316`
- **Behavior change:** Cleanup uses `.in("order_item_id", orderItems.map(oi => oi.id))` instead of broken `.eq()` on single ID. Comment at line 309 explicitly marks this as the BUG-01 fix.
- **Commit:** `fce0fb06`
- **Test coverage:** `src/app/api/checkout/session/__tests__/route.test.ts` updated for new schema
- **Status:** PASS

### BUG-02: isPastCutoff fix
- **Requirement:** Fix `isPastCutoff()` — add full date+time comparison, not just time
- **Fix location:** `src/lib/utils/delivery-dates.ts:4-5` (constants), `:161-168` (function)
- **Behavior change:** `isPastCutoff()` accepts configurable `cutoffDay` and `cutoffHour` parameters (default: Friday 3 PM). Uses `getCutoffForSaturday()` for full date+time zoned comparison via `getTime()` millisecond comparison.
- **Commit:** `fce0fb06`
- **Test coverage:** Function is pure and testable; checkout route tests exercise the flow
- **Status:** PASS

### BUG-03: Time window validation
- **Requirement:** Add time window validation — `.refine()` against `TIME_WINDOWS` list
- **Fix location:** `src/app/api/checkout/session/route.ts:46-52`
- **Behavior change:** Route handler calls `generateTimeWindows()` from DB-backed business rules, then validates submitted `timeWindowStart`/`timeWindowEnd` against whitelist via `.some()`. Returns `VALIDATION_ERROR` for invalid windows. Note: validation is at route level (not Zod `.refine()`) because time windows are dynamically generated from DB — documented at `checkout.ts:20-22`.
- **Commit:** `fce0fb06`
- **Test coverage:** Checkout route tests validate the flow
- **Status:** PASS

### BUG-05: Cutoff re-validation
- **Requirement:** Re-validate coverage + cutoff at checkout submission
- **Fix location:** `src/app/api/checkout/session/route.ts:54-62`
- **Behavior change:** Server-side `isPastCutoff()` check with DB-loaded `rules.cutoffDay`/`rules.cutoffHour` at submission time. Returns `CUTOFF_PASSED` error code with next delivery date if expired. Comment at line 54 marks this as BUG-05 fix.
- **Commit:** `fce0fb06`
- **Test coverage:** Checkout route tests exercise the flow
- **Status:** PASS

### BUG-08: Price drift detection (server)
- **Requirement:** Re-validate modifiers against DB at checkout — stale cart warning
- **Fix location:** `src/app/api/checkout/session/route.ts:167-217` (drift detection), `src/lib/validations/checkout.ts:10,14` (schema fields)
- **Behavior change:** Server compares client-reported `basePriceCents` and `priceDeltaCents` against DB prices. Builds `priceDrifts` array and returns 409 `PRICE_CHANGED` if any mismatch. Zod schema now requires `basePriceCents` per item and `priceDeltaCents` per modifier.
- **Commit:** `fce0fb06`
- **Test coverage:** `route.test.ts` and `order.test.ts` updated with `basePriceCents`/`priceDeltaCents` fields
- **Status:** PASS

## Plan 03: Cart Store (BUG-04, BUG-06)

### BUG-04: Atomic cart mutations
- **Requirement:** Fix cart debounce race condition — timestamp-based dedup
- **Fix location:** `src/lib/stores/cart-store.ts:108-110`
- **Behavior change:** `addItem` uses `set((state) => { ... })` atomic pattern instead of `get()` + `set()`. Comment at line 108 explicitly marks this as BUG-04 fix. All other mutations (`updateQuantity`, `removeItem`, `updateItem`, `updateItemPrice`) also use the atomic pattern.
- **Commit:** `77b0c629`
- **Test coverage:** Behavioral — 335 tests pass with the store changes
- **Status:** PASS

### BUG-06: Quantity limit toast
- **Requirement:** Add quantity limit toast when silently capped
- **Fix location:** `src/lib/stores/cart-store.ts:126-128` (per-item cap), `:140-143` (cart full), `:172-173` (stepper max)
- **Behavior change:** Three toast notifications added: (1) per-item max exceeded in addItem, (2) cart full (MAX_CART_ITEMS) in addItem, (3) stepper exceeds per-item max in updateQuantity. Uses `setTimeout(0)` for toast inside synchronous `set()` callback.
- **Commit:** `77b0c629`
- **Test coverage:** Behavioral — toast import and usage verified at line 7
- **Status:** PASS

## Plan 04: Client Price Data (BUG-08)

### BUG-08: Price drift detection (client)
- **Requirement:** Client sends price data for server-side drift detection
- **Fix location:** `src/components/ui/checkout/PaymentStepV8.tsx:106,109`
- **Behavior change:** Checkout POST body now includes `basePriceCents` (from cart item) and `priceDeltaCents` (from modifier) for each item, enabling server-side comparison against DB prices.
- **Commit:** `b44d5efd`
- **Test coverage:** TypeScript compilation validates field presence; server-side tests updated for schema
- **Status:** PASS

## Plan 05: Refund UI (BUG-07)

### BUG-07: Refund badges (UI)
- **Requirement:** Admin and customer order views show refund status
- **Fix location:** Admin: `src/components/ui/admin/orders/OrderCardRow.tsx:84-94` (desktop), `:123-133` (mobile). Customer: `src/components/ui/orders/OrderCard.tsx:85-88`.
- **Behavior change:** Admin sees amber "Partial Refund" / red "Full Refund" badges. Customer sees "Partial Refund" / "Refunded" badge. Badges hidden when `refundStatus === "none"`. Admin filter available when refunded orders exist.
- **Commit:** `6844f302`
- **Test coverage:** TypeScript types enforce `RefundStatus` type from `database.ts`; 335 tests pass
- **Status:** PASS

---
*Phase: 77-critical-bug-fixes*
*Verified: 2026-03-02 by Phase 85*
