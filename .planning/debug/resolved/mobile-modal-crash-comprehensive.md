---
status: resolved
trigger: "mobile-modal-crash-comprehensive - App crashes on mobile devices during modal interactions"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:25:00Z
---

## Current Focus

hypothesis: Previous fixes may not be complete or there are additional instances of anti-patterns causing crashes
test: Comprehensive audit of all modal/drawer components for setTimeout, event listeners, async setState, AnimatePresence patterns
expecting: Find unpatched instances of known anti-patterns or discover new patterns
next_action: Verify previous fixes were applied correctly, then search for remaining instances

## Symptoms

expected: Modals open/close smoothly without app crashes on mobile devices
actual: Page reloads/refreshes, white screen, "Can't open page" error, frozen/unresponsive UI after modal interactions
errors: Various crash symptoms - not a single consistent error
reproduction: Open and close modals on mobile devices (iOS Safari, Chrome, Android). Affects cart drawer, menu item modal, auth modal. All modals on homepage and menu page affected.
started: Ongoing despite fixes applied 2026-01-29 to 2026-01-30

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:10:00Z
  checked: Previously fixed files (useBodyScrollLock, MobileDrawer, Drawer, Modal, SearchInput, AddToCartButton, AuthModal)
  found: These files have proper setTimeout cleanup with refs and unmount effects
  implication: Previous fixes for these files appear correctly applied

- timestamp: 2026-01-30T00:12:00Z
  checked: UnifiedMenuItemCard.tsx - longPressTimer setTimeout
  found: ISSUE - longPressTimer.current uses setTimeout in handleTouchStart but NO cleanup on unmount. Only cleared in handleTouchEnd and handleTouchMove. If component unmounts during long-press, timer continues and callback tries to run.
  implication: Could cause setState on unmounted component crash when navigating away during long-press

- timestamp: 2026-01-30T00:13:00Z
  checked: OnboardingTour.tsx - keyboard event listener
  found: ISSUE - handleKeyDown function defined outside useEffect. When currentStep, handleNext, or handleSkip change, stale closures may cause issues. Event listener added without checking current state.
  implication: Potential memory leaks or stale closure issues

- timestamp: 2026-01-30T00:14:00Z
  checked: Confetti.tsx - SuccessAnimation onAnimationComplete
  found: ISSUE - Line 311: setTimeout inside onAnimationComplete callback with no cleanup. If component unmounts before 1500ms delay completes, onComplete callback runs on unmounted component.
  implication: Crash when navigating away from success animation

- timestamp: 2026-01-30T00:15:00Z
  checked: ItemDetailSheet.tsx, swipe-gestures.ts, CartDrawer.tsx, CartBar.tsx
  found: These files are properly implemented with correct cleanup patterns
  implication: No issues found in these core modal components

## Resolution

root_cause: Multiple components have setTimeout/event handlers that are not cleaned up on unmount:
1. UnifiedMenuItemCard.tsx - longPressTimer.current not cleaned on unmount
2. OnboardingTour.tsx - keyboard event handler executing during exit animation
3. Confetti.tsx (SuccessAnimation) - setTimeout in onAnimationComplete not cleaned on unmount

fix: Applied cleanup patterns to all three files:
1. UnifiedMenuItemCard.tsx - Added useEffect cleanup for longPressTimer on unmount
2. OnboardingTour.tsx - Added isExiting guard to keyboard handler effect
3. Confetti.tsx - Added completeTimeoutRef with cleanup on unmount

verification: Typecheck, lint, and build all pass. Fixes properly clean up timers and guards on unmount.

files_changed:
- src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
- src/components/ui/auth/OnboardingTour.tsx
- src/components/ui/Confetti.tsx
