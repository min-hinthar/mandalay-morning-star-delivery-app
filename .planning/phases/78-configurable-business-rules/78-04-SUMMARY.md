---
phase: 78-configurable-business-rules
plan: 04
subsystem: ui
tags: [zustand, react, next.js, server-components, props-threading, business-rules]

requires:
  - phase: 78-01
    provides: getBusinessRules() cached reader and BusinessRules interface
  - phase: 78-02
    provides: generateTimeWindows() for dynamic time slot generation

provides:
  - All customer-facing components receive business rules via props from server components
  - Cart store with injectable delivery fee settings (setDeliverySettings action)
  - DeliverySettingsSync component for server-to-client store sync
  - Homepage hero displays dynamic delivery schedule, cutoff time, and fee info
  - Checkout page split into server wrapper + client component for time windows
  - Dead constants removed from types/delivery.ts and types/cart.ts

affects: [81-cart-drawer-countdown, checkout, homepage, menu]

tech-stack:
  added: []
  patterns:
    - "Server component wrapper + client child for getBusinessRules() in 'use client' pages"
    - "DeliverySettingsSync pattern: useEffect syncs server-provided values to Zustand store"
    - "Layout-level settings fetch: PublicShell and CustomerShell receive rules from server layouts"

key-files:
  created:
    - src/components/ui/cart/DeliverySettingsSync.tsx
    - src/app/(public)/PublicShell.tsx
    - src/app/(customer)/checkout/CheckoutClient.tsx
  modified:
    - src/lib/stores/cart-store.ts
    - src/lib/hooks/useCart.ts
    - src/lib/hooks/useTimeSlot.ts
    - src/components/ui/cart/CartBar.tsx
    - src/components/ui/cart/FreeDeliveryProgress.tsx
    - src/components/ui/checkout/CheckoutSummaryV8.tsx
    - src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx
    - src/components/ui/checkout/TimeSlotDisplay.tsx
    - src/components/ui/checkout/TimeStepV8.tsx
    - src/components/ui/checkout/PaymentStepV8.tsx
    - src/components/ui/homepage/Hero/HeroContent.tsx
    - src/components/ui/homepage/Hero/Hero.tsx
    - src/components/ui/homepage/Hero/types.ts
    - src/app/(public)/page.tsx
    - src/app/(public)/layout.tsx
    - src/app/(customer)/layout.tsx
    - src/app/(customer)/CustomerShell.tsx
    - src/app/(customer)/checkout/page.tsx
    - src/types/delivery.ts
    - src/types/cart.ts

key-decisions:
  - "Zustand store fields (deliveryFeeCents, freeDeliveryThresholdCents) with setDeliverySettings action for client-side fee injection"
  - "DeliverySettingsSync component at layout level for consistent store hydration across route groups"
  - "Public layout converted from 'use client' to server component with PublicShell client wrapper"
  - "Checkout page split into server page.tsx + CheckoutClient.tsx for timeWindows prop threading"
  - "Order detail and confirmation pages unchanged -- they display fee from order record, not constant"

patterns-established:
  - "Server-to-client settings sync: server layout fetches -> passes props to client shell -> DeliverySettingsSync component calls store action"
  - "Server wrapper pattern: rename client page to XxxClient.tsx, create server page.tsx that fetches and passes data"

requirements-completed: [RULES-08]

duration: 13min
completed: 2026-03-01
---

# Phase 78 Plan 04: Customer-Facing Dynamic Business Rules Summary

**All customer-facing pages display configured delivery fee, cutoff schedule, and time windows from database via server component prop threading and Zustand store injection**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-01T11:41:37Z
- **Completed:** 2026-03-01T11:55:01Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments

- Cart store, useCart, and all cart/checkout UI components no longer import hardcoded fee/threshold constants
- Server layouts (public + customer) fetch business rules and sync to client cart store via DeliverySettingsSync
- Homepage hero displays dynamic delivery schedule text ("Order by Friday 3:00 PM") and fee info from DB
- Checkout page receives dynamic time windows generated from configured delivery hours
- TIME_WINDOWS, CUTOFF_DAY, CUTOFF_HOUR removed from types/delivery.ts; DELIVERY_FEE_CENTS, FREE_DELIVERY_THRESHOLD_CENTS removed from types/cart.ts
- Zero non-test imports of removed constants across entire src/ directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate cart store, hooks, and components from constants to props** - `a33992b8` (feat)
2. **Task 2: Wire server components to pass business rules and remove dead constants** - `fdf3dbf4` (feat)

## Files Created/Modified

- `src/components/ui/cart/DeliverySettingsSync.tsx` - Syncs server-provided delivery settings to Zustand cart store on mount
- `src/app/(public)/PublicShell.tsx` - Client shell for public layout (extracted from layout.tsx for server/client split)
- `src/app/(customer)/checkout/CheckoutClient.tsx` - Client checkout component (extracted from page.tsx for server wrapper pattern)
- `src/lib/stores/cart-store.ts` - Added deliveryFeeCents, freeDeliveryThresholdCents fields and setDeliverySettings action
- `src/lib/hooks/useCart.ts` - Reads freeDeliveryThresholdCents from store instead of constant
- `src/lib/hooks/useTimeSlot.ts` - Accepts timeWindows as parameter instead of importing TIME_WINDOWS
- `src/components/ui/cart/CartBar.tsx` - Uses store threshold for progress calculation
- `src/components/ui/cart/FreeDeliveryProgress.tsx` - Reads threshold from store for dynamic progress text
- `src/components/ui/checkout/CheckoutSummaryV8.tsx` - Uses store threshold via useCart
- `src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx` - Accepts timeWindows prop
- `src/components/ui/checkout/TimeSlotDisplay.tsx` - Accepts timeWindows prop
- `src/components/ui/checkout/TimeStepV8.tsx` - Passes timeWindows to TimeSlotPicker
- `src/components/ui/checkout/PaymentStepV8.tsx` - Passes timeWindows to TimeSlotDisplay
- `src/components/ui/homepage/Hero/HeroContent.tsx` - Dynamic delivery schedule, cutoff, and fee display
- `src/app/(public)/page.tsx` - Fetches getBusinessRules() and passes to Hero
- `src/app/(public)/layout.tsx` - Server component that fetches rules for PublicShell
- `src/app/(customer)/layout.tsx` - Fetches rules and passes to CustomerShell
- `src/app/(customer)/checkout/page.tsx` - Server wrapper fetching rules and timeWindows for CheckoutClient
- `src/types/delivery.ts` - Removed TIME_WINDOWS, CUTOFF_DAY, CUTOFF_HOUR constants
- `src/types/cart.ts` - Removed DELIVERY_FEE_CENTS, FREE_DELIVERY_THRESHOLD_CENTS constants

## Decisions Made

- **Zustand store for fee injection:** Added deliveryFeeCents and freeDeliveryThresholdCents as non-persisted store fields with setDeliverySettings action, rather than threading props through every component. This avoids changing signatures of deeply nested components (CartOverlays -> CartBar -> DeliveryProgress chain).
- **Layout-level DeliverySettingsSync:** Placed the sync component in both PublicShell and CustomerShell layouts so all pages in those route groups automatically have the correct fee settings.
- **Public layout refactored:** Converted from `'use client'` to server component wrapping a new PublicShell client component, enabling getBusinessRules() at the layout level.
- **Order pages unchanged:** Order detail and confirmation pages already display delivery fee from the stored order record (order.deliveryFeeCents), not from constants. No changes needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint missing dependency in TimeSlotPicker useCallback**
- **Found during:** Task 1 (component migration)
- **Issue:** Adding timeWindows to handleDateSelect useCallback required updating the dependency array
- **Fix:** Added timeWindows to useCallback dependency array
- **Files modified:** src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx
- **Verification:** ESLint passes with --max-warnings=0
- **Committed in:** a33992b8 (Task 1 commit)

**2. [Rule 2 - Missing Critical] PaymentStepV8 and TimeStepV8 needed timeWindows threading**
- **Found during:** Task 1 (component migration)
- **Issue:** TimeSlotPicker and TimeSlotDisplay now require timeWindows prop, but their parent step components (TimeStepV8, PaymentStepV8) didn't expose this prop
- **Fix:** Added optional timeWindows prop to both TimeStepV8 and PaymentStepV8, with empty array defaults for backward compatibility
- **Files modified:** src/components/ui/checkout/TimeStepV8.tsx, src/components/ui/checkout/PaymentStepV8.tsx
- **Verification:** Typecheck and build pass

**3. [Rule 2 - Missing Critical] FreeDeliveryProgress hardcoded "$100 threshold" text**
- **Found during:** Task 1 (component migration)
- **Issue:** The celebration text "You've hit the $100 threshold" and progress label "Free at $100" were hardcoded
- **Fix:** Made both texts dynamic using freeDeliveryThresholdCents from store
- **Files modified:** src/components/ui/cart/FreeDeliveryProgress.tsx
- **Verification:** Component displays dynamic threshold value

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None - all verification passes (lint, lint:css, typecheck, 355 tests, build).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 78 (Configurable Business Rules) is fully complete with all 4 plans executed
- All customer-facing pages display configured values from the database
- Cart store is ready for dynamic fee injection on every page load
- Phase 81 (Cart Drawer Countdown) can use the threaded cutoff values for countdown timer UI

## Self-Check: PASSED

- All created files verified to exist on disk
- Both task commits verified in git log (a33992b8, fdf3dbf4)
- SUMMARY.md created at expected path

---
*Phase: 78-configurable-business-rules*
*Completed: 2026-03-01*
