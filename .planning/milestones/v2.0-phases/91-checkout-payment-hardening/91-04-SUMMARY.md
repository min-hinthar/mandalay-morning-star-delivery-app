---
phase: 91-checkout-payment-hardening
plan: 04
subsystem: checkout
tags: [zustand, supabase, cart, duplicate-detection, price-refresh, guest-flow]

# Dependency graph
requires:
  - phase: 91-02
    provides: Server-side price validation and 409 PRICE_CHANGED response with priceDrifts
  - phase: 91-03
    provides: Tip, promo, delivery instructions UI in PaymentStepV8
provides:
  - Cart store updatePricesFromServer action for 409 PRICE_CHANGED handling
  - useExistingOrder hook for client-side duplicate order detection
  - Duplicate order warning banner on checkout page
  - Price refresh handling in PaymentStepV8 with toast notification
affects: [checkout, cart, orders]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-hook Zustand access via getState() in event handlers for cart updates"
    - "Client-side duplicate detection as early warning; server-side as enforcement gate"

key-files:
  created:
    - src/lib/hooks/useExistingOrder.ts
  modified:
    - src/lib/stores/cart-store.ts
    - src/types/cart.ts
    - src/components/ui/checkout/PaymentStepV8.tsx
    - src/app/(customer)/checkout/CheckoutClient.tsx
    - src/lib/hooks/index.ts

key-decisions:
  - "useCartStore.getState() for non-hook access inside fetch handler — safe pattern for event callbacks"
  - "Duplicate order check uses delivery.date from checkout store (not gate.deliveryDate) — matches actual selection"
  - "Pre-existing formatting issues in 11 unrelated files left untouched per scope boundary rules"

patterns-established:
  - "Price drift handling: server returns priceDrifts array, client calls updatePricesFromServer, toast notifies user"
  - "Dual-layer duplicate detection: useExistingOrder (client warning) + server DUPLICATE_ORDER (enforcement)"

requirements-completed: [CHKT-02, CHKT-05, CHKT-09]

# Metrics
duration: 7min
completed: 2026-03-03
---

# Phase 91 Plan 04: Cart Price Refresh, Duplicate Order Detection, and Guest Checkout Flow Summary

**Cart store updatePricesFromServer action for 409 handling, useExistingOrder hook for duplicate detection, and guest checkout auth wall wiring**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T18:50:46Z
- **Completed:** 2026-03-03T18:57:22Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Cart store gains `updatePricesFromServer` action that bulk-updates base prices and modifier prices from server 409 response
- `useExistingOrder` hook queries orders table for same-Saturday duplicates, showing early warning banner on checkout
- PaymentStepV8 handles 409 PRICE_CHANGED by refreshing cart prices and showing info toast instead of error
- Verified guest flow: auth redirect is client-side only in CheckoutClient, cart persists in IndexedDB across redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cart store price refresh and create useExistingOrder hook** - `0e6f4541` (feat)
2. **Task 2: Wire price refresh, duplicate check, and guest flow into CheckoutClient** - `d8e119b2` (feat)
3. **Formatting fix** - `6936853b` (chore)

## Files Created/Modified

- `src/lib/hooks/useExistingOrder.ts` - New hook for client-side duplicate order detection (CHKT-05)
- `src/types/cart.ts` - Added updatePricesFromServer to CartStore interface
- `src/lib/stores/cart-store.ts` - Implemented updatePricesFromServer action for bulk price updates
- `src/lib/hooks/index.ts` - Added useExistingOrder barrel export
- `src/app/(customer)/checkout/CheckoutClient.tsx` - Added duplicate order warning banner and useExistingOrder hook call
- `src/components/ui/checkout/PaymentStepV8.tsx` - Added 409 PRICE_CHANGED handling with cart refresh and toast

## Decisions Made

- Used `useCartStore.getState()` (non-hook) for cart updates inside fetch handler -- safe for event callbacks, avoids hook rules
- Duplicate order check uses `delivery?.date` from checkout store rather than `gate.deliveryDate.dateString` -- matches actual user selection
- Pre-existing formatting issues in 11 unrelated files left untouched per scope boundary rules (only formatted files we modified)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing Prettier formatting issues in 13 files detected during full verification. Only the 2 files modified in this plan were formatted; the other 11 are out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 91 (Checkout & Payment Hardening) is now fully complete across all 4 plans
- All CHKT requirements addressed: server-side pricing (91-02), checkout UI (91-03), client-side wiring (91-04)
- Ready for next phase in the v2.0 milestone

## Self-Check: PASSED

- All 6 files verified present on disk
- All 3 commits verified in git log (0e6f4541, d8e119b2, 6936853b)

---
*Phase: 91-checkout-payment-hardening*
*Completed: 2026-03-03*
