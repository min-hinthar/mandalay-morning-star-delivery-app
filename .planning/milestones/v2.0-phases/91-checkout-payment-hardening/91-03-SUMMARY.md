---
phase: 91-checkout-payment-hardening
plan: 03
subsystem: ui, stores, api
tags: [zustand, react, framer-motion, stripe, checkout, tip, promo, tailwind-v4]

requires:
  - phase: 91-checkout-payment-hardening
    plan: 01
    provides: "CheckoutState type, checkout store, Zod schema with tipCents/promoCode/deliveryInstructions"
provides:
  - "TipSelector component with 15%/20%/25%/Custom presets and dollar preview"
  - "PromoCodeInput component with collapsible UI and Stripe validation"
  - "Checkout store with tip, promo, discount, delivery instructions state"
  - "PaymentStep with delivery instructions, tip, promo sections"
  - "CheckoutSummary with tip and discount line items in total"
  - "/api/checkout/validate-promo POST endpoint"
affects: [91-04-PLAN]

tech-stack:
  added: []
  patterns: ["DoorDash-style tip preset UI with custom input", "Collapsible promo code with client-side validation via API"]

key-files:
  created:
    - "src/components/ui/checkout/TipSelector.tsx"
    - "src/components/ui/checkout/PromoCodeInput.tsx"
    - "src/app/api/checkout/validate-promo/route.ts"
  modified:
    - "src/types/checkout.ts"
    - "src/lib/stores/checkout-store.ts"
    - "src/components/ui/checkout/PaymentStepV8.tsx"
    - "src/components/ui/checkout/CheckoutSummaryV8.tsx"
    - "src/components/ui/checkout/index.ts"

key-decisions:
  - "Tip calculated in UI from subtotal (not stored as tipCents in store) to stay reactive to cart changes"
  - "Custom tip clamped to $0-$1000 (100_000 cents) matching Zod schema validation"
  - "Promo validation returns discount info immediately; server re-validates at checkout submission"
  - "text-text-inverse used instead of text-white per Tailwind v4 design token enforcement"

patterns-established:
  - "Tip presets as const array with dynamic dollar preview from subtotal"
  - "Collapsible promo input with three states: collapsed, expanded, applied"

requirements-completed: [CHKT-06, CHKT-07, CHKT-08]

duration: 20min
completed: 2026-03-03
---

# Phase 91 Plan 03: Checkout Tips, Promo, and Delivery Instructions UI Summary

**DoorDash-style tip selector with 15%/20%/25%/Custom presets, collapsible promo code input with Stripe validation, and delivery instructions integrated into payment step and order summary**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-03T18:27:12Z
- **Completed:** 2026-03-03T18:47:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created TipSelector with 4 preset buttons showing dollar amounts, 15% pre-selected, animated custom input
- Created PromoCodeInput with collapsible toggle, Stripe validation via /api/checkout/validate-promo, applied badge with remove
- Updated checkout store with 7 new state fields and 6 new actions for tip/promo/delivery
- Updated PaymentStep to render delivery instructions, tip selector, promo input, and send tipCents/promoCode/deliveryInstructions to API
- Removed basePriceCents/priceDeltaCents from client checkout request (CHKT-01 server-authoritative)
- Updated CheckoutSummary to show tip and discount line items, adjusted total calculation
- Added DUPLICATE_ORDER error handling in PaymentStep

## Task Commits

Each task was committed atomically:

1. **Task 1: Update checkout store and create TipSelector + PromoCodeInput** - `28e4dab6` (feat)
2. **Task 2: Integrate tip/promo/delivery into PaymentStep and CheckoutSummary** - `6a8821ce` (feat)

## Files Created/Modified
- `src/types/checkout.ts` - Added 7 new fields to CheckoutState interface
- `src/lib/stores/checkout-store.ts` - Added tip/promo/delivery state and 6 actions
- `src/components/ui/checkout/TipSelector.tsx` - DoorDash-style tip presets with custom input
- `src/components/ui/checkout/PromoCodeInput.tsx` - Collapsible promo with validation
- `src/app/api/checkout/validate-promo/route.ts` - POST endpoint using Stripe Promotion Codes API
- `src/components/ui/checkout/PaymentStepV8.tsx` - Added delivery instructions, tip, promo sections
- `src/components/ui/checkout/CheckoutSummaryV8.tsx` - Added tip and discount line items
- `src/components/ui/checkout/index.ts` - Exported TipSelector and PromoCodeInput

## Decisions Made
- Tip is computed in components from subtotal (reactive to cart changes) rather than stored as a computed value
- Custom tip clamped to $0-$1000 matching the Zod schema max of 100_000 cents
- Promo validation returns discount info for immediate UI feedback; server re-validates on submit
- Used text-text-inverse instead of text-white per Tailwind v4 design token ESLint enforcement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Stripe PromotionCode type for v20 SDK**
- **Found during:** Task 1
- **Issue:** Stripe v20 moved coupon to `promo.promotion.coupon` (not `promo.coupon`); PromotionCode type lacks direct `coupon` property
- **Fix:** Updated promo.ts to access `promo.promotion.coupon` with expand and null guard; fixed session route to use `Stripe.Checkout.SessionCreateParams` type
- **Files modified:** src/lib/stripe/promo.ts, src/app/api/checkout/session/route.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** Part of 91-02 concurrent execution

**2. [Rule 1 - Bug] Replaced text-white with text-text-inverse design token**
- **Found during:** Task 1
- **Issue:** ESLint no-restricted-syntax rule blocks `text-white` class; requires semantic token
- **Fix:** Replaced all 5 instances of text-white/text-white/80 with text-text-inverse/text-text-inverse/80
- **Files modified:** src/components/ui/checkout/TipSelector.tsx
- **Verification:** pnpm lint passes, pre-commit hook succeeds
- **Committed in:** 28e4dab6

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for type correctness and lint compliance. No scope creep.

## Issues Encountered
- Pre-commit hook (lint-staged + eslint) stash/restore cycle was deleting newly written files before they could be committed; resolved by writing and staging files via Node.js scripts

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 91-04 (cart store integration / price drift UX) can proceed
- TipSelector and PromoCodeInput are ready for composition
- Checkout store has all required state for complete checkout flow

---
*Phase: 91-checkout-payment-hardening*
*Completed: 2026-03-03*
