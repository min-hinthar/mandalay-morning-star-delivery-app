---
status: resolved
trigger: "Crashes still happening - randomly on homepage, MORE AGGRESSIVELY on menu page"
created: 2026-01-30T10:00:00Z
updated: 2026-01-30T10:30:00Z
---

## Current Focus

hypothesis: CategoryTabs requestAnimationFrame not cleaned up on unmount causing state update on unmounted component
test: Check for requestAnimationFrame cleanup in CategoryTabs component
expecting: Finding missing cancelAnimationFrame in cleanup
next_action: Fix CategoryTabs requestAnimationFrame cleanup

## Symptoms

expected: Modals open/close smoothly on mobile without crashes
actual: Crashes on mobile - more aggressive on menu page than homepage
errors: iOS Safari crashes during modal interactions
reproduction: Navigate to menu page, interact with modals/drawers
started: Persisting after multiple rounds of fixes

## Eliminated

- hypothesis: useBodyScrollLock cleanup issues
  evidence: Already has proper timeout cleanup (Round 1 & 3 fixes)
  timestamp: Previous debug sessions

- hypothesis: MobileDrawer event listener accumulation
  evidence: Fixed in Round 1 with proper cleanup
  timestamp: Previous debug sessions

- hypothesis: UnifiedMenuItemCard longPressTimer
  evidence: Fixed with cleanup useEffect
  timestamp: Round 2 fixes

## Evidence

- timestamp: 2026-01-30T10:00:00Z
  checked: CategoryTabs.tsx lines 133-177
  found: requestAnimationFrame used WITHOUT cancelAnimationFrame cleanup in cleanup function. Line 177 only cancels rafId, but rafId is set inside the rAF callback, not preserved for cleanup.
  implication: CRITICAL - If component unmounts during the rAF, state update (scrollTo) will fire on unmounted component

- timestamp: 2026-01-30T10:00:00Z
  checked: useCardSound.ts
  found: AudioContext is created lazily but NEVER closed/disconnected on unmount
  implication: AudioContext resources leak, may contribute to memory pressure on mobile

- timestamp: 2026-01-30T10:00:00Z
  checked: FlyToCart.tsx useFlyToCart hook
  found: Creates DOM elements (flyingEl) and appends to body. Cleanup only handles flyingRef.current but new elements created dynamically may not be tracked properly if component unmounts mid-animation
  implication: Potential DOM element leaks and GSAP timeline not being killed on unmount

- timestamp: 2026-01-30T10:00:00Z
  checked: FeaturedCarousel.tsx (homepage) vs MenuContent + CategoryTabs + MenuGrid (menu page)
  found: Menu page has IntersectionObserver in both useActiveCategory AND FeaturedCarousel. Multiple IntersectionObservers and ResizeObserver in CategoryTabs. Homepage only has FeaturedCarousel.
  implication: Menu page has MORE observers = more potential cleanup issues

- timestamp: 2026-01-30T10:00:00Z
  checked: AddToCartButton.tsx handleClick
  found: Uses Promise-based setTimeout (await new Promise) but isMountedRef guard ONLY checks after the timeout, not during the entire async operation. If multiple rapid clicks occur, multiple async operations could be in flight.
  implication: Potential race condition with multiple state updates during unmount

## Resolution

root_cause: Multiple cleanup issues specific to menu page:
1. CategoryTabs requestAnimationFrame not properly cancelled (rafId assigned inside callback, no mount guard)
2. useCardSound AudioContext never closed on unmount
3. FlyToCart GSAP timeline not killed on unmount
4. AddToCartButton async state updates via Promise-based setTimeout lacked proper cleanup

fix: Applied 4 targeted fixes:
1. CategoryTabs: Added isMounted guard and proper rafId tracking with cancelAnimationFrame
2. useCardSound: Added useEffect cleanup that closes AudioContext on unmount
3. FlyToCart: Added timelineRef to track GSAP timeline, kill on unmount
4. AddToCartButton: Replaced async/await setTimeout with tracked timeout Set that clears on unmount

verification:
- TypeScript compilation: PASS
- ESLint: PASS (0 errors, 0 warnings)
- Stylelint: PASS
- Build: PASS
- Tests: 343/343 PASS

files_changed:
- src/components/ui/menu/CategoryTabs.tsx - Fixed requestAnimationFrame cleanup with isMounted guard
- src/components/ui/menu/UnifiedMenuItemCard/use-card-sound.ts - Added AudioContext cleanup on unmount
- src/components/ui/cart/FlyToCart.tsx - Added GSAP timeline kill on unmount
- src/components/ui/cart/AddToCartButton.tsx - Added timeout tracking Set with proper cleanup
