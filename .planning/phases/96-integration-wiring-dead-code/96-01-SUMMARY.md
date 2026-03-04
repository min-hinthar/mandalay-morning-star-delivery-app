---
phase: 96-integration-wiring-dead-code
plan: 01
subsystem: ui
tags: [typescript, order-types, order-detail, tip, promo-code, discount]

requires:
  - phase: 91-checkout-hardening
    provides: checkout fields (tip_cents, promo_code, discount_cents, delivery_instructions) in DB
provides:
  - OrdersRow/Insert/Update with tip_cents, promo_code, discount_cents, delivery_instructions
  - Order interface with tipCents, promoCode, discountCents, deliveryInstructions
  - Order detail page rendering tip, discount (with promo code), and delivery instructions
affects: [order-confirmation, admin-orders, order-share]

tech-stack:
  added: []
  patterns: [conditional-row-rendering, snake-to-camel-transform]

key-files:
  created: []
  modified:
    - src/types/database.ts
    - src/types/order.ts
    - src/app/(customer)/orders/[id]/page.tsx
    - src/app/(customer)/orders/[id]/confirmation/page.tsx
    - src/test/factories/index.ts

key-decisions:
  - "New Order fields are required (not optional) since DB defaults ensure they always exist"
  - "Discount row renders before tip row in totals section (Subtotal > Delivery > Tax > Discount > Tip > Total)"

patterns-established:
  - "Conditional row rendering: {order.field > 0 && (<div>...</div>)} for optional financial rows"

requirements-completed: [CHKT-06, CHKT-07, CHKT-08]

duration: 6min
completed: 2026-03-04
---

# Phase 96 Plan 01: Checkout Data Wiring Summary

**Wire tip, promo code, discount, and delivery instructions from DB types through to order detail page UI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-04T07:47:12Z
- **Completed:** 2026-03-04T07:53:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added tip_cents, promo_code, discount_cents, delivery_instructions to all 3 Orders DB interfaces
- Added corresponding camelCase fields to Order TypeScript interface
- Order detail page now renders tip row, discount row (with promo code name), and delivery instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tip/promo/discount/instructions to type interfaces** - `56ad1586` (feat)
2. **Task 2: Wire fields through order detail page query, transform, and UI** - `25e66fb1` (feat)

## Files Created/Modified
- `src/types/database.ts` - Added 4 fields to OrdersRow, OrdersInsert, OrdersUpdate
- `src/types/order.ts` - Added tipCents, promoCode, discountCents, deliveryInstructions to Order
- `src/app/(customer)/orders/[id]/page.tsx` - Added OrderQueryResult fields, transform mappings, tip/discount rows, delivery instructions in address card
- `src/app/(customer)/orders/[id]/confirmation/page.tsx` - Added OrderQueryResult fields and transform mappings for type consistency
- `src/test/factories/index.ts` - Added default values for 4 new OrdersRow fields

## Decisions Made
- New Order fields are required (not optional) since DB columns have defaults (0 for cents, null for strings)
- Discount row renders before tip row in totals section for natural reading order
- Discount shown with green text and negative sign to clearly indicate savings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed confirmation page Order construction**
- **Found during:** Task 1 (type interface additions)
- **Issue:** Confirmation page also constructs Order objects and would fail typecheck without the new required fields
- **Fix:** Added 4 fields to OrderQueryResult and transform block in confirmation/page.tsx
- **Files modified:** src/app/(customer)/orders/[id]/confirmation/page.tsx
- **Verification:** pnpm typecheck passes
- **Committed in:** 56ad1586 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed test factory missing new OrdersRow fields**
- **Found during:** Task 1 (type interface additions)
- **Issue:** createMockOrder factory would fail type check without the 4 new fields
- **Fix:** Added tip_cents: 0, promo_code: null, discount_cents: 0, delivery_instructions: null defaults
- **Files modified:** src/test/factories/index.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 56ad1586 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for type consistency. No scope creep.

## Issues Encountered
- Pre-existing typecheck error in src/app/api/webhooks/stripe/__tests__/route.test.ts (Stripe type mismatch) -- unrelated to this plan, logged as out-of-scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Order types fully wired; ready for 96-02 (dead code removal)
- Admin order views may also benefit from displaying these fields (out of scope for this plan)

---
*Phase: 96-integration-wiring-dead-code*
*Completed: 2026-03-04*
