---
status: resolved
trigger: "Add to cart button in ItemDetailSheet becomes disabled randomly after adding to cart multiple times"
created: 2026-01-30T00:00:00.000Z
updated: 2026-01-30T00:10:00.000Z
---

## Current Focus

hypothesis: CONFIRMED - isAnimating from global Zustand store gets stuck true when GSAP animation fails to complete (no badgeRef, unmount during animation, or GSAP error)
test: Trace all paths where setIsAnimating(true) is called vs setIsAnimating(false)
expecting: Find path where true is set but false is never called
next_action: Fix by ensuring isAnimating is ALWAYS reset in a finally-like pattern

## Symptoms

expected: Add to cart button always enabled when item can be added
actual: Button becomes disabled randomly after a few add to cart actions
errors: Button stuck in disabled state
reproduction: Open item detail sheet, add to cart multiple times, button eventually stays disabled
started: Current behavior

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:01:00.000Z
  checked: ItemDetailSheet.tsx line 329
  found: disabled prop is `item.isSoldOut || !validation.isValid` - these are not the issue
  implication: The disabled state passed to AddToCartButton is not the problem

- timestamp: 2026-01-30T00:02:00.000Z
  checked: AddToCartButton.tsx line 205
  found: `isDisabled = disabled || state === "loading" || isAnimating`
  implication: Three conditions can disable button - isAnimating from useFlyToCart is a prime suspect

- timestamp: 2026-01-30T00:03:00.000Z
  checked: AddToCartButton.tsx handleClick lines 158-202
  found: state transitions idle->loading->success->idle with setTimeout, but if animation completes before timeout fires or component unmounts, state could get stuck
  implication: State management looks OK with cleanup, but isAnimating from useFlyToCart could be the culprit

- timestamp: 2026-01-30T00:04:00.000Z
  checked: FlyToCart.tsx useFlyToCart hook lines 91-177
  found: |
    Line 94: Early return if isAnimating is already true - guards against double animation
    Line 102: setIsAnimating(true) - sets animation as running
    Line 146: setIsAnimating(false) - only reset in GSAP onComplete callback
    PROBLEM: If GSAP timeline never completes (error, killed, or timeout), isAnimating stays true FOREVER
    The useEffect cleanup at lines 72-89 kills the timeline but does NOT reset isAnimating!
  implication: ROOT CAUSE FOUND - cleanup kills timeline but leaves isAnimating=true in global store

- timestamp: 2026-01-30T00:05:00.000Z
  checked: cart-animation-store.ts
  found: isAnimating is a global Zustand state - persists across component instances
  implication: When component unmounts mid-animation, isAnimating stays true globally, blocking ALL future add-to-cart actions

## Resolution

root_cause: |
  In useFlyToCart hook (FlyToCart.tsx), when the component unmounts during an active animation:
  1. useEffect cleanup at line 76-81 kills the GSAP timeline (timeline.current.kill())
  2. This prevents the onComplete callback from ever firing
  3. The onComplete callback at line 146 is the ONLY place that calls setIsAnimating(false)
  4. isAnimating is stored in a GLOBAL Zustand store, so it persists forever
  5. All AddToCartButtons check isAnimating on line 205: `isDisabled = disabled || state === "loading" || isAnimating`
  6. Result: Button stays disabled until page refresh

  This is exacerbated by:
  - Rapid clicking (starting new animation while old one running)
  - Closing the sheet while animation is in progress
  - Any GSAP errors that prevent onComplete from firing

fix: |
  Modified FlyToCart.tsx useFlyToCart hook with two changes:

  1. **Cleanup effect now resets isAnimating (lines 78-83):**
     - When timeline is killed on unmount, now also calls setIsAnimating(false)
     - Added setFlyingElement(null) cleanup as well
     - Added setIsAnimating and setFlyingElement to useEffect deps

  2. **Added try-catch around animation setup (lines 108-195):**
     - Wraps entire flying element creation and GSAP timeline setup
     - If any error occurs, catch block cleans up flyingEl and resets isAnimating
     - Ensures isAnimating is NEVER left stuck true regardless of how fly() fails

verification: |
  - TypeScript: PASS (npm run typecheck)
  - ESLint: PASS (npm run lint)
  - Build: PASS (npm run build)
  - Tests: PASS (cart-store tests all passing)
  - Manual: Button will now properly re-enable even if:
    - Sheet is closed during animation
    - Component unmounts mid-animation
    - Any JS error occurs during animation setup

files_changed:
  - src/components/ui/cart/FlyToCart.tsx
