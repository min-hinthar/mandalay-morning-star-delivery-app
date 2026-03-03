---
phase: 87-fix-code-gaps
plan: 01
subsystem: ui, driver
tags: [zustand, next.js, server-components, simple-mode, cart, cutoff]

requires:
  - phase: 78-configurable-business-rules
    provides: getBusinessRules() with cutoffDay/cutoffHour fields
  - phase: 83-driver-simplification
    provides: simple_mode column on drivers table
  - phase: 86-deferred-integration
    provides: DeliverySettingsSync pattern for server-to-client settings sync
provides:
  - CartStore cutoffDay/cutoffHour fields synced from DB via DeliverySettingsSync
  - Shared checkSimpleMode() helper for server-side simple mode page guards
  - TestDeliveryClient extracted as client component for server wrapper pattern
affects: [phase-88-verification, cart-drawer, driver-pages]

tech-stack:
  added: []
  patterns: [shared-guard-helper, server-wrapper-client-component]

key-files:
  created:
    - src/lib/driver/simple-mode-guard.ts
    - src/app/(driver)/driver/test-delivery/TestDeliveryClient.tsx
  modified:
    - src/types/cart.ts
    - src/lib/stores/cart-store.ts
    - src/components/ui/cart/DeliverySettingsSync.tsx
    - src/components/ui/cart/CartDrawer.tsx
    - src/app/(customer)/CustomerShell.tsx
    - src/app/(customer)/layout.tsx
    - src/app/(public)/PublicShell.tsx
    - src/app/(public)/layout.tsx
    - src/app/(driver)/driver/earnings/page.tsx
    - src/app/(driver)/driver/schedule/page.tsx
    - src/app/(driver)/driver/history/page.tsx
    - src/app/(driver)/driver/test-delivery/page.tsx
    - src/app/(driver)/driver/route/[stopId]/page.tsx

key-decisions:
  - "Type cast workaround kept in checkSimpleMode for simple_mode column (not in generated types)"
  - "Cutoff fields excluded from Zustand partialize (always fresh from server, never IndexedDB)"
  - "test-delivery converted to server wrapper + client component for checkSimpleMode compatibility"
  - "All guarded pages redirect to /driver (consistent behavior, not page-specific redirects)"

patterns-established:
  - "checkSimpleMode(): shared async guard for any driver page hidden in simple mode"
  - "Server wrapper pattern for converting client-only pages to guarded server pages"

requirements-completed: [GATE-03, DRV-05]

duration: 12min
completed: 2026-03-02
---

# Phase 87 Plan 01: Fix Code Gaps Summary

**CartFooter cutoff countdown wired to DB values via Zustand store; 5 driver pages guarded with shared checkSimpleMode() helper**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- CartFooter receives cutoffDay/cutoffHour from Zustand store (sourced from DB via DeliverySettingsSync), not hardcoded defaults
- Both CustomerLayout and PublicLayout pass cutoff values through shells to DeliverySettingsSync
- All 5 driver pages (earnings, schedule, history, test-delivery, stop detail) use shared checkSimpleMode() helper
- test-delivery page converted from client-only to server wrapper + TestDeliveryClient pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire cart cutoff values from DB through store to CartFooter (GATE-03)** - `31ec41c8` (feat)
2. **Task 2: Create shared simple mode guard and protect all hidden driver pages (DRV-05)** - `e1ed4d0a` (feat)

## Files Created/Modified
- `src/lib/driver/simple-mode-guard.ts` - Shared checkSimpleMode() guard helper
- `src/app/(driver)/driver/test-delivery/TestDeliveryClient.tsx` - Client component extracted from page.tsx
- `src/types/cart.ts` - Added cutoffDay, cutoffHour, setCutoffSettings to CartStore
- `src/lib/stores/cart-store.ts` - Added cutoff state and setter (excluded from partialize)
- `src/components/ui/cart/DeliverySettingsSync.tsx` - Extended to sync cutoff values
- `src/components/ui/cart/CartDrawer.tsx` - CartContent reads cutoff from store, passes to CartFooter
- `src/app/(customer)/CustomerShell.tsx` - Extended props with cutoffDay/cutoffHour
- `src/app/(customer)/layout.tsx` - Passes cutoff from getBusinessRules()
- `src/app/(public)/PublicShell.tsx` - Extended props with cutoffDay/cutoffHour
- `src/app/(public)/layout.tsx` - Passes cutoff from getBusinessRules()
- `src/app/(driver)/driver/earnings/page.tsx` - Guarded with checkSimpleMode()
- `src/app/(driver)/driver/schedule/page.tsx` - Guarded with checkSimpleMode()
- `src/app/(driver)/driver/history/page.tsx` - Guarded with checkSimpleMode()
- `src/app/(driver)/driver/test-delivery/page.tsx` - Converted to server wrapper
- `src/app/(driver)/driver/route/[stopId]/page.tsx` - Refactored to use shared guard

## Decisions Made
- Kept type cast workaround `(driver as unknown as Record<string, unknown>).simple_mode` in checkSimpleMode since simple_mode column is not in generated Supabase types
- Cutoff fields excluded from Zustand partialize to ensure they always come fresh from server
- All guarded pages redirect to /driver for consistency (stop detail previously redirected to /driver/route)

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GATE-03 and DRV-05 gaps closed, ready for Phase 88 verification
- Phase 88 can now verify DRV-05 with checkSimpleMode() in place

---
*Phase: 87-fix-code-gaps*
*Completed: 2026-03-02*
