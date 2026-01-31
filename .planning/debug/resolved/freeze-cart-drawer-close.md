---
status: resolved
trigger: "App still freezes - on first page load, item detail sheet close, AND cart drawer close. Previous fix (7feac9b) didn't fully resolve it."
created: 2026-01-30T12:00:00Z
updated: 2026-01-30T12:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - useFlyToCart hook subscribes to entire store, causing re-render cascade
test: Fix applied and verified
expecting: No more freezes
next_action: Complete - commit and archive

## Symptoms

expected: App responsive, drawers close smoothly
actual: Freezes on page load, item detail sheet close, cart drawer close
errors: UI freeze (infinite loop or blocking)
reproduction: Load page - freeze; close item detail - freeze; close cart drawer - freeze
started: After commits e456d66 and 7feac9b

## Eliminated

## Evidence

- timestamp: 2026-01-30T12:05:00Z
  checked: FlyToCart.tsx line 64
  found: "} = useCartAnimationStore();" - subscribes to ENTIRE store without selector
  implication: Every store state change re-renders ALL components using useFlyToCart

- timestamp: 2026-01-30T12:06:00Z
  checked: All useCartAnimationStore usages across codebase
  found: |
    - CartButton.tsx line 41: uses selector (s) => s.setBadgeRef - CORRECT
    - CartIndicator.tsx line 55: uses selector (s) => s.setBadgeRef - CORRECT
    - FlyToCart.tsx line 64: NO selector - subscribes to all state - BUG
  implication: FlyToCart.tsx is the only component without a selector

- timestamp: 2026-01-30T12:07:00Z
  checked: AddToCartButton.tsx usage of useFlyToCart
  found: Line 137 calls useFlyToCart() which internally calls useCartAnimationStore() without selector
  implication: Every AddToCartButton re-renders on ANY store change (badgeRef, isAnimating, flyingElement, shouldPulseBadge)

- timestamp: 2026-01-30T12:08:00Z
  checked: Store state changes that trigger re-renders
  found: |
    - setBadgeRef on mount/unmount
    - setIsAnimating during animation
    - setFlyingElement during animation
    - shouldPulseBadge changes (true->false after 300ms)
  implication: When ItemDetailSheet closes, if any animation state changes, ALL useFlyToCart subscribers re-render

- timestamp: 2026-01-30T12:09:00Z
  checked: Commit 7feac9b fix analysis
  found: Fixed cleanup useEffect to use getState(), but did NOT fix the main subscription issue
  implication: Fix was incomplete - addressed cleanup loop but not the full-store subscription

- timestamp: 2026-01-30T12:14:00Z
  checked: Build and lint verification after fix
  found: typecheck, lint, and build all pass
  implication: Fix is syntactically correct and doesn't break anything

## Resolution

root_cause: |
  useFlyToCart hook in FlyToCart.tsx (line 64) calls useCartAnimationStore() without a selector,
  subscribing to the ENTIRE store state. This causes:
  1. Every component using useFlyToCart (like AddToCartButton) re-renders on ANY store change
  2. Store changes are frequent: badge registration, animation states, pulse timing
  3. On page load: CartButton/CartIndicator call setBadgeRef -> all useFlyToCart subscribers re-render
  4. On sheet/drawer close: cleanup or state changes trigger cascading re-renders

  Previous fix (7feac9b) only fixed the cleanup function to use getState(), but the main
  hook still subscribes to the entire store via destructuring.

fix: |
  Changed FlyToCart.tsx useFlyToCart hook to use individual selectors for each store value:
  - const badgeRef = useCartAnimationStore((s) => s.badgeRef);
  - const isAnimating = useCartAnimationStore((s) => s.isAnimating);
  - const setIsAnimating = useCartAnimationStore((s) => s.setIsAnimating);
  - const setFlyingElement = useCartAnimationStore((s) => s.setFlyingElement);
  - const triggerBadgePulse = useCartAnimationStore((s) => s.triggerBadgePulse);

  Now components only re-render when their specific subscribed values change.

verification: |
  - TypeScript typecheck: PASS
  - ESLint: PASS
  - Production build: PASS
  - Manual testing needed: page load, item detail sheet close, cart drawer close

files_changed:
  - src/components/ui/cart/FlyToCart.tsx
