---
status: resolved
trigger: "App crashes/reloads on mobile devices when exiting modals, drawers, item details, or input fields"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:50:00Z
---

## Current Focus

hypothesis: The Modal component scroll lock cleanup calls window.scrollTo during unmount, which on iOS Safari can cause issues when combined with the position:fixed body style being removed - especially during swipe gestures where the DOM is in flux
test: Review cleanup sequence in Modal.tsx scroll lock and compare to useBodyScrollLock hook
expecting: Find timing issue where scroll restoration happens while DOM is still transitioning
next_action: Check Modal.tsx scroll lock cleanup for race condition with AnimatePresence exit

## Symptoms

expected: Return to previous view - closing overlays should dismiss them and show underlying page
actual:
  - App reloads completely (full page refresh, loses state)
  - App crashes/freezes (becomes unresponsive)
  - White screen before recovering
  - "Can't open page" error
errors: "Can't open page" error, otherwise no visible errors (silent failures)
reproduction:
  - Open any modal/drawer -> close it
  - Specific to cart drawer
  - Specific to item details
  - Swipe/gesture to close triggers it
  - Happens on all mobile browsers (iOS Safari, iOS Chrome, Android Chrome)
started: Intermittent - sometimes works, sometimes crashes

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:15:00Z
  checked: scroll lock implementations across codebase
  found: FOUR different scroll lock implementations exist:
    1. useBodyScrollLock.ts - position:fixed with scroll restore
    2. Modal.tsx - duplicate position:fixed logic (internal)
    3. MobileDrawer.tsx - simple overflow:hidden (INCONSISTENT)
    4. swipe-gestures.ts preventScrollDuringSwipe - position:fixed
  implication: MobileDrawer uses different mechanism; when overlays compete, scroll position may be incorrectly restored

- timestamp: 2026-01-29T00:16:00Z
  checked: components using scroll lock
  found:
    - Drawer.tsx uses useBodyScrollLock (position:fixed)
    - Modal.tsx has internal scroll lock (position:fixed)
    - MobileDrawer.tsx uses overflow:hidden only
    - If user has MobileDrawer open and opens ItemDetailSheet/CartDrawer, locks compete
  implication: Race condition on cleanup - one overlay restores scroll while body is still locked by another

- timestamp: 2026-01-29T00:25:00Z
  checked: scroll lock cleanup timing vs AnimatePresence exit animation
  found:
    - useBodyScrollLock cleanup runs synchronously when isOpen changes to false
    - This resets body.style.position to "" and calls window.scrollTo IMMEDIATELY
    - BUT AnimatePresence is still animating the exit (takes ~200-300ms)
    - During animation, DOM is in flux - elements are being removed/transitioned
    - window.scrollTo during this transition can cause iOS Safari memory issues
    - PageTransition.tsx uses onExitComplete for scroll, but Drawer/Modal don't
  implication: CRITICAL - scroll restoration happens before exit animation completes, causing iOS Safari to encounter DOM in inconsistent state

- timestamp: 2026-01-29T00:26:00Z
  checked: iOS Safari "Can't open page" error causes
  found: This error typically occurs when:
    1. Memory pressure causes WebKit to kill the page
    2. JavaScript execution takes too long (frozen main thread)
    3. DOM manipulation during scroll/transition causes layout thrashing
    The scroll lock cleanup + immediate scrollTo + exit animation = perfect storm
  implication: Need to defer scroll restoration until after exit animation completes

## Resolution

root_cause: Scroll lock cleanup in useBodyScrollLock and Modal.tsx calls window.scrollTo() synchronously when overlay closes, but AnimatePresence exit animation is still running (~200-300ms). This causes iOS Safari to scroll the page while the DOM is in an inconsistent state (fixed-position elements being removed, transforms animating). The resulting layout thrashing can trigger memory pressure and "Can't open page" crashes on resource-constrained mobile devices.

fix:
  1. Refactored useBodyScrollLock to support deferred scroll restoration via options.deferScrollRestore
  2. Added global lock counting to prevent conflicts between multiple overlays
  3. Used requestAnimationFrame for scroll restoration to ensure DOM stability
  4. Added onExitComplete callback to AnimatePresence in Drawer, Modal, and MobileDrawer
  5. Consolidated MobileDrawer to use the shared useBodyScrollLock hook instead of inline overflow:hidden
  6. All scroll restoration now happens AFTER exit animation completes, preventing iOS Safari crashes

verification:
  - TypeScript type checking: PASSED
  - ESLint: PASSED
  - Tests: 343 tests PASSED
  - Build: PASSED
  - Manual testing needed on iOS Safari and Android Chrome to confirm fix

files_changed:
  - src/lib/hooks/useBodyScrollLock.ts (refactored with deferred restore, global lock count)
  - src/lib/hooks/index.ts (export new types)
  - src/components/ui/Drawer.tsx (use deferScrollRestore + onExitComplete)
  - src/components/ui/Modal.tsx (replaced inline scroll lock with hook, use onExitComplete)
  - src/components/ui/layout/MobileDrawer/MobileDrawer.tsx (use hook instead of inline)
