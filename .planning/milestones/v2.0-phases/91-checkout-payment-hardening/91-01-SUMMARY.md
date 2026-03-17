---
phase: 91-checkout-payment-hardening
plan: 01
subsystem: database, api, types
tags: [postgres, zod, stripe, checkout, migration, typescript]

requires:
  - phase: 89-checkout-payment-reliability
    provides: "Atomic order creation RPC, idempotent Stripe sessions, checkout route"
provides:
  - "Orders table with tip_cents, promo_code, discount_cents, delivery_instructions columns"
  - "Unique partial index preventing duplicate orders per user per Saturday"
  - "Zod checkout schema without client-sent prices (server-authoritative)"
  - "OrderCalculation with tipCents/discountCents support"
  - "createStripeLineItems with optional tip line item"
  - "DUPLICATE_ORDER error code in CheckoutErrorCode"
  - "PriceDrift TypeScript interface"
  - "Updated create_order_with_items RPC accepting new columns"
affects: [91-02-PLAN, 91-03-PLAN, 91-04-PLAN]

tech-stack:
  added: []
  patterns: ["Server-authoritative pricing: Zod schema strips client price fields"]

key-files:
  created:
    - "supabase/migrations/035_checkout_hardening.sql"
  modified:
    - "src/types/checkout.ts"
    - "src/lib/validations/checkout.ts"
    - "src/lib/utils/order.ts"
    - "src/app/api/checkout/session/route.ts"
    - "src/app/api/checkout/session/__tests__/route.test.ts"
    - "src/lib/utils/__tests__/order.test.ts"
    - "src/test/factories/index.ts"

key-decisions:
  - "Migration numbered 035 (033/034 already taken by photo pipeline)"
  - "Removed BUG-08 price drift detection from route since client no longer sends prices; plan 91-02 will add server-side drift detection"
  - "app_settings value stored as JSONB number (30::jsonb) matching existing pattern"
  - "totalCents clamped to Math.max(0, ...) to prevent negative totals from large discounts"

patterns-established:
  - "Server-authoritative pricing: checkout Zod schema only accepts item IDs and quantities, never prices"
  - "Tip as Stripe line item: tipCents > 0 adds a Tip line item; discounts handled via Stripe discounts param"

requirements-completed: [CHKT-01, CHKT-05, CHKT-06, CHKT-07, CHKT-08]

duration: 7min
completed: 2026-03-03
---

# Phase 91 Plan 01: Checkout Hardening Foundation Summary

**DB migration with tip/promo/discount/instructions columns, server-authoritative Zod schema, and order calculation utilities with tip/discount support**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T18:15:39Z
- **Completed:** 2026-03-03T18:23:25Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created migration 035 with 4 new orders columns, unique partial index for duplicate prevention, prep time buffer setting, and updated RPC
- Removed basePriceCents/priceDeltaCents from Zod checkout schema (CHKT-01 server-authoritative pricing)
- Added tipCents/discountCents to calculateOrderTotals with Math.max(0) clamping
- Added tip line item support to createStripeLineItems
- Added DUPLICATE_ORDER error code and PriceDrift interface to types
- Updated all tests (42 checkout + order tests passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create checkout hardening migration** - `2bd6906f` (feat)
2. **Task 2: Update types, Zod schema, and order utilities** - `d2b70b3d` (feat)

## Files Created/Modified
- `supabase/migrations/035_checkout_hardening.sql` - Migration: columns, index, setting, RPC update
- `src/types/checkout.ts` - Added DUPLICATE_ORDER, PriceDrift, tipCents/promoCode/deliveryInstructions
- `src/lib/validations/checkout.ts` - Removed price fields, added tipCents/promoCode/deliveryInstructions
- `src/lib/utils/order.ts` - tipCents/discountCents in calculateOrderTotals, tip in createStripeLineItems
- `src/app/api/checkout/session/route.ts` - Removed client-side price drift detection (replaced in 91-02)
- `src/app/api/checkout/session/__tests__/route.test.ts` - Updated for new schema, added tip/discount tests
- `src/lib/utils/__tests__/order.test.ts` - Updated for new schema, totals object shape
- `src/test/factories/index.ts` - Updated createCheckoutItemInput to not include price fields

## Decisions Made
- Migration numbered 035 (033/034 already taken by photo pipeline)
- Removed BUG-08 price drift detection from route since client no longer sends prices; plan 91-02 will implement server-side drift detection
- app_settings value stored as JSONB number matching existing seed pattern
- totalCents clamped to Math.max(0) to prevent negative totals from large discounts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration file number conflict**
- **Found during:** Task 1
- **Issue:** Plan specified 033_checkout_hardening.sql but 033 and 034 already exist
- **Fix:** Used 035_checkout_hardening.sql instead
- **Files modified:** supabase/migrations/035_checkout_hardening.sql
- **Verification:** File created successfully, no naming conflict
- **Committed in:** 2bd6906f

**2. [Rule 3 - Blocking] Removed price drift detection from checkout route**
- **Found during:** Task 2
- **Issue:** Route referenced cartItem.basePriceCents and mod.priceDeltaCents which no longer exist on CheckoutItemInput after Zod schema change
- **Fix:** Removed the BUG-08 price drift detection block (lines 224-276); plan 91-02 will add server-side drift detection
- **Files modified:** src/app/api/checkout/session/route.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** d2b70b3d

**3. [Rule 3 - Blocking] Updated test files for new schema shape**
- **Found during:** Task 2
- **Issue:** Test data in route.test.ts, order.test.ts, and factories/index.ts used basePriceCents/priceDeltaCents which no longer exist on CheckoutItemInput type
- **Fix:** Removed price fields from all test data, added tests for new features (tip, discount, Stripe tip line item, schema stripping)
- **Files modified:** route.test.ts, order.test.ts, factories/index.ts
- **Verification:** All 463 tests pass
- **Committed in:** d2b70b3d

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for compilation and test correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. Migration must be applied to production Supabase before deploying.

## Next Phase Readiness
- Foundation types, schema, and utilities ready for plan 91-02 (checkout route hardening)
- Plan 91-02 depends on this plan's updated CheckoutItemInput type and OrderCalculation interface
- Server-side price drift detection needs to be implemented in 91-02

---
*Phase: 91-checkout-payment-hardening*
*Completed: 2026-03-03*
