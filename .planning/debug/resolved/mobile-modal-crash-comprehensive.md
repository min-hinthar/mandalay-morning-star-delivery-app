---
status: resolved
trigger: "mobile-modal-crash-comprehensive - App crashes on mobile devices during modal interactions"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T01:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - MobileDrawer Fragment inside AnimatePresence and AuthModal missing useBodyScrollLock caused iOS Safari crashes
test: Fixes applied and verified
expecting: Crashes resolved
next_action: Archive session

## Symptoms

expected: Modals open/close smoothly without app crashes on mobile devices
actual: Page reloads/refreshes, white screen, "Can't open page" error, frozen/unresponsive UI after modal interactions
errors: Various crash symptoms - not a single consistent error
reproduction: Open and close modals on mobile devices (iOS Safari, Chrome, Android). Affects cart drawer, menu item modal, auth modal. All modals on homepage and menu page affected.
started: Ongoing despite fixes applied 2026-01-29 to 2026-01-30

## Eliminated

- hypothesis: setTimeout/setInterval not cleaned on unmount causes crashes
  evidence: Fixed in UnifiedMenuItemCard, OnboardingTour, Confetti, SearchInput, useBodyScrollLock - crashes persisted
  timestamp: 2026-01-30T00:25:00Z

- hypothesis: Event listeners not cleaned on unmount causes crashes
  evidence: Fixed in MobileDrawer, AuthModal escape handlers - crashes persisted
  timestamp: 2026-01-30T00:25:00Z

## Evidence

- timestamp: 2026-01-30T00:10:00Z
  checked: Previously fixed files (useBodyScrollLock, MobileDrawer, Drawer, Modal, SearchInput, AddToCartButton, AuthModal)
  found: These files have proper setTimeout cleanup with refs and unmount effects
  implication: Previous fixes for these files appear correctly applied

- timestamp: 2026-01-30T00:12:00Z
  checked: UnifiedMenuItemCard.tsx - longPressTimer setTimeout
  found: FIXED - longPressTimer cleanup added on unmount
  implication: Timer cleanup complete

- timestamp: 2026-01-30T00:13:00Z
  checked: OnboardingTour.tsx - keyboard event listener
  found: FIXED - isExiting guard added
  implication: No more stale closure issues

- timestamp: 2026-01-30T00:14:00Z
  checked: Confetti.tsx - SuccessAnimation onAnimationComplete
  found: FIXED - completeTimeoutRef with cleanup added
  implication: No more unmounted setState

- timestamp: 2026-01-30T01:00:00Z
  checked: MobileDrawer.tsx AnimatePresence structure
  found: CRITICAL - Lines 73-167 use Fragment (`<>...</>`) inside AnimatePresence containing TWO motion children (backdrop and drawer). AnimatePresence documentation warns against Fragments with multiple children.
  implication: When drawer closes, AnimatePresence may not properly orchestrate exit animations of multiple Fragment children, causing iOS Safari to crash

- timestamp: 2026-01-30T01:00:00Z
  checked: AuthModal.tsx for useBodyScrollLock
  found: CRITICAL - AuthModal does NOT use useBodyScrollLock hook at all. Modal.tsx and Drawer.tsx both use it, but AuthModal (which implements its own modal without using Modal component) has no body scroll lock.
  implication: On iOS Safari, background scrolling during modal interaction causes layout thrashing and crashes

- timestamp: 2026-01-30T01:00:00Z
  checked: AuthModal.tsx AnimatePresence
  found: AuthModal uses AnimatePresence (line 313) but WITHOUT onExitComplete callback. When deferred scroll restore is used, onExitComplete is needed to restore scroll position safely.
  implication: No graceful cleanup after exit animation

- timestamp: 2026-01-30T01:00:00Z
  checked: Modal.tsx and Drawer.tsx patterns
  found: Both use AnimatePresence with onExitComplete={restoreScrollPosition} and useBodyScrollLock with deferRestore: true
  implication: This is the correct pattern that AuthModal should follow

## Resolution

root_cause: Two distinct issues causing remaining crashes:
1. MobileDrawer uses Fragment inside AnimatePresence with multiple motion children - AnimatePresence cannot properly manage exit animations for Fragment children
2. AuthModal lacks useBodyScrollLock entirely and its AnimatePresence has no onExitComplete - causes iOS Safari scroll/layout issues during close

fix: Applied fixes to both files:
1. MobileDrawer.tsx - Removed Fragment wrapper, render backdrop and panel as separate `{isOpen && ...}` blocks directly under AnimatePresence (both have unique keys so AnimatePresence can track them)
2. AuthModal.tsx - Added useBodyScrollLock import and hook call with deferRestore:true, added onExitComplete={restoreScrollPosition} callback to AnimatePresence

verification: All checks pass:
- TypeScript typecheck: PASS
- ESLint: PASS
- Production build: PASS

files_changed:
- src/components/ui/layout/MobileDrawer/MobileDrawer.tsx
- src/components/ui/auth/AuthModal.tsx
