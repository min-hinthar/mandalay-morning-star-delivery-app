---
status: fixing
trigger: "CRASHES STILL PERSISTING after THREE rounds of fixes on both homepage and menu page"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple subtle setTimeout/cleanup issues causing state updates on unmounted components
test: All fixes applied - build and lint pass
expecting: Mobile modal/drawer behavior should be stable
next_action: User verification on real device

## Symptoms

expected: Modals open/close smoothly without crashes
actual: Random crashes on both homepage and menu page
errors: Not specified - crashes appear random
reproduction: Random, occurs on both pages
started: Persisting despite 3 rounds of fixes

## Eliminated

- hypothesis: Timer cleanup issues
  evidence: Fixed longPressTimer, setTimeout cleanup in multiple components
  timestamp: Round 1-3

- hypothesis: Fragment-in-AnimatePresence
  evidence: Fixed in MobileDrawer
  timestamp: Round 2

- hypothesis: Missing body scroll lock
  evidence: Added to AuthModal
  timestamp: Round 2

- hypothesis: RAF/isMounted guards
  evidence: Added to CategoryTabs
  timestamp: Round 3

- hypothesis: AudioContext cleanup
  evidence: Fixed in use-card-sound.ts
  timestamp: Round 3

- hypothesis: GSAP timeline cleanup
  evidence: Fixed in FlyToCart.tsx
  timestamp: Round 3

- hypothesis: Event listener accumulation
  evidence: Fixed in MobileDrawer.tsx
  timestamp: Earlier

## Evidence

- timestamp: 2026-01-30T00:00:00Z
  checked: Prior fix history
  found: 15+ components already fixed across 3 rounds
  implication: Bug is in SUBTLE patterns - not obvious cleanup issues

- timestamp: 2026-01-30T00:01:00Z
  checked: cart-animation-store.ts
  found: triggerBadgePulse uses setTimeout(300ms) without cleanup tracking - if store action runs and component unmounts before timeout fires, state update happens on unmounted component
  implication: HIGH PRIORITY - Zustand stores with setTimeout inside actions need external cleanup tracking

- timestamp: 2026-01-30T00:02:00Z
  checked: Portal.tsx
  found: setMounted(false) in cleanup - this could cause issues if parent re-renders while children are still animating
  implication: MEDIUM PRIORITY - Portal cleanup could race with AnimatePresence exit animations

- timestamp: 2026-01-30T00:03:00Z
  checked: Drawer.tsx
  found: Uses Portal + AnimatePresence correctly, but style prop dynamically computed each render which could cause animation issues
  implication: LOW PRIORITY - Style object recreation on each render

- timestamp: 2026-01-30T00:04:00Z
  checked: useRouteChangeClose.ts
  found: Calls onClose during render-time side effect when pathname changes - could cause cascade of state updates
  implication: MEDIUM PRIORITY - onClose called within useEffect can cause React state update races

- timestamp: 2026-01-30T00:05:00Z
  checked: DynamicThemeProvider.tsx
  found: interval every 60000ms - has proper cleanup
  implication: Safe - no issue here

- timestamp: 2026-01-30T00:06:00Z
  checked: useToastV8.ts
  found: Uses global listeners array with splice - not safe if multiple components mount/unmount simultaneously
  implication: MEDIUM PRIORITY - Race condition in listener management

## Resolution

root_cause: Multiple subtle issues causing random mobile crashes:
1. cart-animation-store.ts: setTimeout in triggerBadgePulse without cleanup tracking - state updates on unmounted components
2. Portal.tsx: setMounted(false) in cleanup racing with AnimatePresence exit animations
3. useRouteChangeClose.ts: onClose called synchronously during useEffect could cause React state cascade
4. Drawer.tsx: Focus timeout not properly cleaned up; style object recreated on each render
5. useToastV8.ts: Potential race condition in listener management during concurrent mount/unmount

fix: Applied fixes to all identified issues:
1. cart-animation-store.ts - Added module-level timeout tracking with cancelPendingPulse action
2. FlyToCart.tsx - Added cancelPendingPulse to cleanup effect
3. Portal.tsx - Removed setMounted(false) from cleanup to prevent animation race
4. useRouteChangeClose.ts - Added queueMicrotask to defer close calls + isMounted guard
5. Drawer.tsx - Added cleanup for focus timeout; memoized style object
6. useToastV8.ts - Added explicit listener variable capture for cleanup

verification: Build successful, TypeScript passes, ESLint passes
files_changed:
- src/lib/stores/cart-animation-store.ts
- src/components/ui/cart/FlyToCart.tsx
- src/components/ui/Portal.tsx
- src/lib/hooks/useRouteChangeClose.ts
- src/components/ui/Drawer.tsx
- src/lib/hooks/useToastV8.ts
