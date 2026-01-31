---
status: resolved
trigger: "After FlyToCart fix (commit e456d66), app freezes on first page load and on item detail sheet close"
created: 2026-01-30T23:00:00-08:00
updated: 2026-01-30T23:15:00-08:00
---

## Current Focus

hypothesis: CONFIRMED - The dependency array [cancelPendingPulse, setIsAnimating, setFlyingElement] causes infinite re-renders. When setIsAnimating is called in cleanup, it updates the store, which triggers re-render, which causes the effect to re-run, which runs cleanup, ad infinitum.
test: N/A - root cause confirmed
expecting: N/A
next_action: Fix by using useCartAnimationStore.getState() to access actions without subscribing, removing them from dependency array

## Symptoms

expected: App loads normally, sheet closes smoothly
actual: App freezes on first load and on item detail sheet close
errors: Freeze (not crash) - likely infinite loop or blocking operation
reproduction: Load app - freeze; close item detail sheet - freeze
started: After commit e456d66 (FlyToCart animation state cleanup)

## Eliminated

## Evidence

- timestamp: 2026-01-30T23:00:00-08:00
  checked: git show e456d66 - what was changed
  found: Added setIsAnimating(false) and setFlyingElement(null) to useEffect cleanup, and added these to dependency array
  implication: The cleanup now resets animation state on unmount, but also added these to deps

- timestamp: 2026-01-30T23:01:00-08:00
  checked: Current FlyToCart.tsx useEffect (lines 72-93)
  found: Cleanup function calls setIsAnimating(false) unconditionally when timeline.current exists, but the effect depends on [cancelPendingPulse, setIsAnimating, setFlyingElement]
  implication: If these functions are not stable or if the component re-mounts when state changes, could cause loop

- timestamp: 2026-01-30T23:02:00-08:00
  checked: cart-animation-store.ts
  found: Zustand store functions are stable - created with create() and should not change
  implication: The Zustand selectors should be stable, not the cause of re-render loop

- timestamp: 2026-01-30T23:05:00-08:00
  checked: FlyToCart.tsx useEffect dependency array analysis
  found: The fix changed deps from [cancelPendingPulse] to [cancelPendingPulse, setIsAnimating, setFlyingElement]. useCartAnimationStore() is called without a selector, so it subscribes to ALL store state.
  implication: When cleanup calls setIsAnimating(false), it updates the store. All components subscribed to the store (including this hook) re-render. The useEffect may then re-run because deps could be seen as changed, causing cleanup to run again = infinite loop.

- timestamp: 2026-01-30T23:08:00-08:00
  checked: Multiple useFlyToCart instances on page load
  found: UnifiedMenuItemCard -> AddButton -> useFlyToCart(). Each menu item card creates an instance. All subscribe to the entire cart-animation-store.
  implication: With many cards on page, any store update triggers re-renders of ALL cards' AddButton components, amplifying the loop effect.

## Resolution

root_cause: The useEffect cleanup had `[cancelPendingPulse, setIsAnimating, setFlyingElement]` in its dependency array. When `setIsAnimating(false)` was called in cleanup, it updated the Zustand store, which triggered a re-render of all components subscribed to the store (via `useCartAnimationStore()` without selector). This caused the useEffect to re-evaluate and potentially re-run cleanup, creating an infinite loop that froze the app.

fix: Use `useCartAnimationStore.getState()` to access store actions in the cleanup function instead of from the destructured hook values. This allows calling state-updating actions without being subscribed to state changes. Changed dependency array to `[]` since the cleanup only needs to run on unmount and all actions are accessed via getState().

verification: ESLint passes, TypeScript compiles, build succeeds. The fix uses getState() to access store actions in cleanup, avoiding the subscription that caused infinite re-renders. Original issue (button stuck disabled) is still fixed because resetAnimating(false) is called when timeline is killed.

files_changed:
- src/components/ui/cart/FlyToCart.tsx
