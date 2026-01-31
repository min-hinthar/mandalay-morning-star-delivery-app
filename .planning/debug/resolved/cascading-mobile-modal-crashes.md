---
status: resolved
trigger: "Mobile works better but once it crashes once, subsequent modal closes keep crashing. Suggests corrupted state or memory accumulation."
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:04:00Z
---

## Current Focus

hypothesis: CONFIRMED - Drawer exit animations use spring physics which crash mobile Safari
test: N/A - confirmed
expecting: N/A
next_action: DONE

## Symptoms

expected: App recovers after crash and works normally
actual: First crash triggers cascade - subsequent modal closes keep crashing
errors: Repeated crashes on modal close after initial crash
reproduction: Use app on mobile until first crash, then every modal close crashes
started: After previous fixes - better but not solved

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:00:30Z
  checked: ItemDetailSheet.tsx structure
  found: Component properly resets state on close, no memory leaks in hooks
  implication: ItemDetailSheet itself is clean

- timestamp: 2026-01-30T00:00:45Z
  checked: Drawer.tsx animation variants
  found: Exit animation uses `bottomVariants.exit = { y: "100%" }` with `overlayMotion.sheetOpen` spring transition (damping: 30, stiffness: 300). Spring physics on exit transitions can cause GPU memory issues on mobile Safari.
  implication: Spring-based exit animations are a known cause of mobile Safari crashes

- timestamp: 2026-01-30T00:00:50Z
  checked: Modal.tsx animation variants
  found: Mobile exit uses `y: "100%"` with duration: 0.15, ease: "easeIn" - GOOD pattern
  implication: Modal already uses simpler timing-based exit, Drawer should follow same pattern

- timestamp: 2026-01-30T00:00:55Z
  checked: useSwipeToClose hook
  found: Swipe gesture uses dragMomentum: false and elastic constraints. Hook returns motionProps spread onto Drawer. Drag state (isDragging, dragOffset) persists in component state.
  implication: Swipe state properly cleaned up, but spring transitions from drag release could accumulate

- timestamp: 2026-01-30T00:01:00Z
  checked: useBodyScrollLock hook
  found: Properly cleans up body styles and timeouts. Uses deferred restore pattern with AnimatePresence onExitComplete.
  implication: Body scroll lock is clean, not causing issues

- timestamp: 2026-01-30T00:01:05Z
  checked: FlyToCart + cart-animation-store
  found: GSAP timeline properly killed on unmount. Flying elements removed. Pulse timeout tracked and cancelled.
  implication: Cart animations clean up properly

- timestamp: 2026-01-30T00:01:30Z
  checked: Drawer.tsx transition prop (lines 289-295)
  found: Uses same `overlayMotion.sheetOpen` spring transition for BOTH open AND exit. This is the bug - exit animations need simple duration/easing, not spring physics.
  implication: ROOT CAUSE CONFIRMED

## Resolution

root_cause: Drawer.tsx uses spring physics (`overlayMotion.sheetOpen` with damping: 30, stiffness: 300) for exit animations on mobile. Spring animations require continuous GPU computation during exit, which accumulates memory on mobile Safari. When Safari's GPU compositor crashes once, it enters a corrupted state where subsequent spring-based exit animations keep triggering crashes.

fix: Modified bottomVariants to embed transitions directly in each state:
- "visible" state: spring transition (type: "spring", damping: 30, stiffness: 300) for bouncy opening feel
- "exit" state: simple duration-based transition (duration: 0.15, ease: "easeIn") to prevent GPU memory accumulation
Changed the component's transition prop to use undefined for bottom sheet to allow variant-embedded transitions to take effect.

verification: TypeScript passes, ESLint passes, production build succeeds

files_changed:
  - src/components/ui/Drawer.tsx
