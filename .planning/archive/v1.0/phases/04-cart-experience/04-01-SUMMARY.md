---
phase: 04-cart-experience
plan: 01
subsystem: ui
tags: [cart, zustand, framer-motion, animation, badge]

# Dependency graph
requires:
  - phase: 03-navigation-layout
    provides: AppShell with headerSlot prop for cart button integration
  - phase: 02-overlay-infrastructure
    provides: useCartDrawer hook for drawer control
provides:
  - CartButtonV8 component with animated badge
  - useCartAnimationStore for badge ref coordination
  - Barrel exports for V8 cart components
affects: [04-02, 04-03, fly-to-cart-animation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Badge ref registration pattern for animation targets
    - Hydration-safe cart components (localStorage persistence)

key-files:
  created:
    - src/components/ui-v8/cart/CartButtonV8.tsx
    - src/components/ui-v8/cart/index.ts
    - src/lib/stores/cart-animation-store.ts
  modified: []

key-decisions:
  - "Cart animation store uses simple RefObject<HTMLSpanElement> for badge targeting"
  - "Hydration handled via mounted state to avoid localStorage mismatch"
  - "V8 colors use amber-500 for primary accent (cart badge, hover states)"

patterns-established:
  - "Badge ref registration: useEffect to setBadgeRef on mount, cleanup on unmount"
  - "Pulse animation: Track itemCount changes with prevCountRef, trigger on diff"

# Metrics
duration: 6min
completed: 2026-01-22
---

# Phase 4 Plan 01: Cart Button V8 Summary

**V8 cart button with animated badge, Zustand store for badge ref coordination, and hydration-safe rendering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-22T17:34:34Z
- **Completed:** 2026-01-22T17:40:40Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- CartButtonV8 component with animated badge showing item count
- Badge pulses on count change using badgeVariants from cart.ts
- Badge ref registered in useCartAnimationStore for fly-to-cart animation target
- Hydration-safe rendering with skeleton placeholder before mount

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cart animation store** - `986dab3` (feat)
2. **Task 2: Create CartButtonV8 component** - `a67a085` (feat)
3. **Task 3: Verify integration** - (verification only, no commit)

## Files Created/Modified
- `src/lib/stores/cart-animation-store.ts` - Zustand store for badge ref and animation state
- `src/components/ui-v8/cart/CartButtonV8.tsx` - Cart button with animated badge
- `src/components/ui-v8/cart/index.ts` - Barrel export for V8 cart components

## Decisions Made
- **Badge ref type:** Used `RefObject<HTMLSpanElement | null>` for flexibility with null initial state
- **Hydration strategy:** Skeleton placeholder before mount avoids localStorage mismatch warnings
- **Animation config:** Used existing badgeVariants from cart.ts for consistency with V7

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Build blocked by Google Fonts API infrastructure issue (documented in STATE.md, not code-related)
- Typecheck confirms code correctness

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CartButtonV8 ready for integration into AppShell headerSlot
- Badge ref available in useCartAnimationStore for fly-to-cart animation (plan 04-03)
- Component follows V8 patterns, consistent with Phase 2-3 overlay and navigation components

---
*Phase: 04-cart-experience*
*Completed: 2026-01-22*
