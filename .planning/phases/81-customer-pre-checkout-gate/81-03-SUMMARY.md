---
phase: 81-customer-pre-checkout-gate
plan: "03"
subsystem: ui
tags: [react, delivery-gate, cart, checkout, modal, polling]

# Dependency graph
requires:
  - phase: 81-customer-pre-checkout-gate/81-01
    provides: useDeliveryGate hook, DeliveryCountdown, CutoffModal, DeliveryBanner components

provides:
  - Cart drawer footer shows delivery date + live countdown when ordering is open
  - Cart checkout button disabled with 'Checkout opens [Day] at [Time]' when closed
  - Checkout page shows CutoffModal on load if past cutoff; mid-session timer detects cutoff
  - Server CUTOFF_PASSED API error triggers CutoffModal via onCutoffPassed callback
  - CartEmptyState includes Saturday delivery schedule line
  - Orders page empty state includes Saturday delivery schedule line
  - TrackingPageClient has prominent last-updated text and jade-green live refresh icon

affects:
  - checkout
  - cart
  - order-tracking
  - empty-states

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onCutoffPassed callback on PaymentStepV8 to bubble server error to parent for modal display"
    - "useDeliveryGate defaults (5, 15) in CartFooter — cutoff params not in cart store (Phase 86 tech debt)"
    - "Static schedule text in empty states matching DB seed defaults (Friday 3 PM)"

key-files:
  created: []
  modified:
    - src/components/ui/cart/CartDrawerParts.tsx
    - src/components/ui/cart/CartEmptyState.tsx
    - src/app/(customer)/checkout/CheckoutClient.tsx
    - src/app/(customer)/checkout/page.tsx
    - src/components/ui/checkout/PaymentStepV8.tsx
    - src/components/ui/orders/tracking/TrackingPageClient.tsx
    - src/app/(customer)/orders/page.tsx

key-decisions:
  - "CartFooter uses useDeliveryGate defaults (5, 15) — cutoff not in cart store; adding to store is Phase 86 scope"
  - "CartEmptyState uses static text 'Friday 3:00 PM' matching DB seed defaults — no prop threading needed"
  - "PaymentStepV8 gets onCutoffPassed callback — CUTOFF_PASSED API error bubbles up to CheckoutClient for modal"
  - "TrackingPageClient last-updated text promoted from charcoal-400 to charcoal-500 + font-medium for visibility"
  - "RefreshCw icon colored jade-500 when isConnected (matches green dot), charcoal-400 otherwise — no animate-spin (too aggressive)"

patterns-established:
  - "Server error code pattern: check data.error.code before throw for special-case routing (e.g., CUTOFF_PASSED)"
  - "Delivery gate props passed server-side from getBusinessRules() to client components via page.tsx server wrapper"

requirements-completed: [GATE-03, GATE-04, GATE-05, GATE-06]

# Metrics
duration: 8min
completed: "2026-03-01"
---

# Phase 81 Plan 03: Customer Pre-Checkout Gate UI Wiring Summary

**Cart drawer disabled checkout + delivery countdown, checkout CutoffModal with mid-session detection, empty states with Saturday schedule, tracking page with prominent live status**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T22:38:05Z
- **Completed:** 2026-03-01T22:46:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Cart drawer footer wired to useDeliveryGate: delivery date + countdown when open, disabled button with schedule text when closed
- Checkout page gets CutoffModal on load (past cutoff) and mid-session (hook detects gate flip every 60s); server CUTOFF_PASSED error handled gracefully via onCutoffPassed callback
- CartEmptyState and orders page empty state both include "We deliver every Saturday — order by Friday 3:00 PM" schedule line
- TrackingPageClient last-updated text promoted (charcoal-500 + font-medium) and RefreshCw icon colored jade-green when live connection is active

## Task Commits

Each task was committed atomically:

1. **Task 1: Add delivery info and cutoff gate to cart drawer and checkout** - `8e490c63` (feat)
2. **Task 2: Add schedule context to empty states and enhance tracking page** - `14389212` (feat)

## Files Created/Modified

- `src/components/ui/cart/CartDrawerParts.tsx` - CartFooter with delivery info row, useDeliveryGate, disabled checkout when closed
- `src/components/ui/cart/CartEmptyState.tsx` - Saturday delivery schedule line added
- `src/app/(customer)/checkout/CheckoutClient.tsx` - useDeliveryGate + CutoffModal on mount/timer, onCutoffPassed handler
- `src/app/(customer)/checkout/page.tsx` - Pass cutoffDay/cutoffHour from getBusinessRules() to CheckoutClient
- `src/components/ui/checkout/PaymentStepV8.tsx` - onCutoffPassed prop; detects CUTOFF_PASSED API error code
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` - Prominent last-updated text, jade icon when connected, cn import
- `src/app/(customer)/orders/page.tsx` - Saturday delivery schedule line in orders empty state

## Decisions Made

- **CartFooter defaults:** CartFooter uses hardcoded defaults (cutoffDay=5, cutoffHour=15) rather than cart store — cutoff params not synced to cart store, that's Phase 86 scope. Defaults match DB seeds.
- **Static schedule text:** Empty states use static "Friday 3:00 PM" text — avoids prop threading through client component chain; defaults match production.
- **CUTOFF_PASSED callback:** Added `onCutoffPassed` to PaymentStepV8 props so CUTOFF_PASSED API error bubbles to CheckoutClient for CutoffModal display instead of generic error toast.
- **No animate-spin for RefreshCw:** Used color change (jade-500) instead of rotation — less aggressive, pairs with existing connection dot for live indicator.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added missing `cn` import to TrackingPageClient**
- **Found during:** Task 2 (TrackingPageClient enhancement)
- **Issue:** Used `cn()` for conditional RefreshCw class but `cn` was not imported in the file
- **Fix:** Added `import { cn } from "@/lib/utils/cn"` to imports
- **Files modified:** src/components/ui/orders/tracking/TrackingPageClient.tsx
- **Verification:** typecheck passes, lint passes, build passes
- **Committed in:** 14389212 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — missing import)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered

None — plan executed cleanly. Build lock file stale from prior build, cleared with `rm .next/lock`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GATE-03, GATE-04, GATE-05, GATE-06 requirements fulfilled
- Phase 81 is complete — all delivery gate requirements wired end-to-end
- Cart items are preserved across ordering window open/close transitions (no clearing)
- No blockers for next phase

---
*Phase: 81-customer-pre-checkout-gate*
*Completed: 2026-03-01*
