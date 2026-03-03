---
phase: 92-customer-ux-discovery-shopping
plan: 03
subsystem: ui
tags: [cart, offline, framer-motion, zustand, pwa]

requires:
  - phase: 91-checkout-payment-hardening
    provides: cart store with delivery settings sync
provides:
  - CartBar minimum order warning with disabled checkout below $25
  - CartHeader sync status indicator (Saving.../Saved)
  - OfflineBanner component for customer-facing pages
affects: [checkout, customer-layout, public-layout]

tech-stack:
  added: []
  patterns: [client-only constant for server-module values, timer-based sync indicator]

key-files:
  created:
    - src/components/ui/customer/OfflineBanner.tsx
    - src/components/ui/customer/index.ts
  modified:
    - src/components/ui/cart/CartBar.tsx
    - src/components/ui/cart/CartDrawerParts.tsx
    - src/app/(customer)/CustomerShell.tsx
    - src/app/(public)/PublicShell.tsx

key-decisions:
  - "Local DEFAULT_MINIMUM_ORDER_CENTS constant instead of importing server-only BUSINESS_RULES_DEFAULTS"
  - "Timer-based sync indicator (not pendingSync from cart-store) per plan recommendation"
  - "OfflineBanner added to both CustomerShell and PublicShell for full coverage"

patterns-established:
  - "Client components needing server-only constants: define local constant mirroring the value"

requirements-completed: [CUX-06, CUX-07, CUX-09, CUX-10]

duration: 16min
completed: 2026-03-03
---

# Phase 92 Plan 03: Cart Feedback and Offline Banner Summary

**Min-order warning in CartBar with disabled checkout, cart sync indicator, and amber offline banner for customer pages**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-03T19:38:38Z
- **Completed:** 2026-03-03T19:54:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- CartBar shows "$X.XX more to reach $25 minimum" warning when subtotal < $25, checkout button disabled
- CartHeader displays "Saving..."/"Saved" indicator after cart mutations, auto-hides after 2 seconds
- OfflineBanner appears fixed at top when offline with amber styling, dismissible, "Back online!" toast on reconnect
- Wired OfflineBanner into both CustomerShell and PublicShell layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add min-order warning to CartBar and sync status to CartHeader** - `1c218cc4` (feat)
2. **Task 2: Create customer OfflineBanner component and wire into layout** - `8a4da823` (feat)

## Files Created/Modified
- `src/components/ui/cart/CartBar.tsx` - Added minimumOrderCents prop, shortfall warning, disabled checkout
- `src/components/ui/cart/CartDrawerParts.tsx` - Added sync status indicator to CartHeader
- `src/components/ui/customer/OfflineBanner.tsx` - New amber offline banner with dismiss and reconnect handling
- `src/components/ui/customer/index.ts` - Barrel export for customer components
- `src/app/(customer)/CustomerShell.tsx` - Wired OfflineBanner
- `src/app/(public)/PublicShell.tsx` - Wired OfflineBanner

## Decisions Made
- Used local `DEFAULT_MINIMUM_ORDER_CENTS = 2500` constant instead of importing `BUSINESS_RULES_DEFAULTS` from `business-rules.ts` (server-only module cannot be imported in client components)
- Timer-based sync indicator approach (500ms saving, 2s saved display) instead of `pendingSync` from cart-store, per plan recommendation
- OfflineBanner placed in both CustomerShell and PublicShell to cover all customer-facing routes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed server-only import in client component**
- **Found during:** Task 2 (build verification)
- **Issue:** CartBar.tsx imported `BUSINESS_RULES_DEFAULTS` from `@/lib/settings/business-rules` which imports `@/lib/supabase/server` -- a server-only module
- **Fix:** Replaced import with local constant `DEFAULT_MINIMUM_ORDER_CENTS = 2500`
- **Files modified:** src/components/ui/cart/CartBar.tsx
- **Verification:** `pnpm build` passes
- **Committed in:** 8a4da823 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for build. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cart feedback components complete
- Offline banner provides connectivity feedback across customer pages
- Ready for remaining phase 92 plans

---
*Phase: 92-customer-ux-discovery-shopping*
*Completed: 2026-03-03*
