---
phase: 116-micro-interactions-polish
plan: 01
subsystem: cart-ux
tags: [toast, undo, cart, micro-interactions]
dependency_graph:
  requires: []
  provides: [toast-action-button, cart-undo]
  affects: [cart-store, toast-system]
tech_stack:
  added: []
  patterns: [snapshot-undo, toast-action-button, countdown-bar]
key_files:
  created:
    - src/lib/hooks/__tests__/useToastV8.test.ts
  modified:
    - src/lib/hooks/useToastV8.ts
    - src/components/ui/Toast.tsx
    - src/lib/stores/cart-store.ts
    - src/components/ui/cart/ClearCartConfirmation.tsx
    - src/components/ui/cart/CartItem/CartItem.tsx
decisions:
  - "Renamed internal ToastAction type to ToastDispatchAction to avoid collision with new ToastActionButton interface"
  - "Used triggerHaptic from @/lib/swipe-gestures/utils (supports 'success' pattern) rather than motion-tokens (only light/medium/heavy)"
  - "Cart undo restore uses addItem for single-item undo (dedup-safe) and set({items: snapshot}) for clear-cart undo (exact restore)"
metrics:
  duration: 7min
  completed: 2026-04-11
  tasks: 2
  files: 6
---

# Phase 116 Plan 01: Toast Action + Cart Undo Summary

Toast system extended with action buttons and countdown bar; cart remove/clear wired with 5-second undo via snapshot restore.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Extend toast with action button + countdown bar | dc9c2f17 (RED), 3bf99f9f (GREEN) | Done |
| 2 | Wire cart undo for removeItem, clearCart, update copy | 360ab9e5 | Done |

## Changes Made

### Task 1: Toast Action Extension (TDD)
- Added `ToastActionButton` interface (`label: string, onClick: () => void`) to `Toast` and `ToastOptions`
- Added `triggerAction()` method to toast return object -- clears auto-dismiss timer and dismisses after action
- Added action button rendering in `ToastCard` with 44px touch target (`h-11`), `focus-visible:ring-2`
- Added countdown progress bar (3px height, rAF-driven 100% to 0% animation) for action toasts
- Imported `spring.snappyButton` for action button tap feedback, gated via `useAnimationPreference`
- Renamed internal `ToastAction` -> `ToastDispatchAction` to avoid name collision
- Backward compatible: toasts without action render identically

### Task 2: Cart Undo Wiring
- `removeItem`: snapshots item before removal, shows undo toast with `addItem` restore
- `clearCart`: snapshots all items, shows undo toast with `set({items: snapshot})` restore
- Undo triggers `triggerHaptic("success")` from swipe-gestures/utils
- `ClearCartConfirmation.tsx`: "cannot be undone" -> "You can undo this for 5 seconds"
- Removed duplicate toast call from `CartItem.tsx` `handleKeyDown` (store now handles it)
- Removed unused `toast` import from `CartItem.tsx`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ToastAction name collision**
- **Found during:** Task 1
- **Issue:** New `ToastAction` interface collided with existing `type ToastAction` (reducer dispatch union)
- **Fix:** Renamed interface to `ToastActionButton`, renamed reducer type to `ToastDispatchAction`
- **Files modified:** src/lib/hooks/useToastV8.ts
- **Commit:** 3bf99f9f

**2. [Rule 1 - Bug] Fixed type mismatch in undo restore**
- **Found during:** Task 2
- **Issue:** `nameMy ?? undefined` and `imageUrl ?? undefined` produced `string | undefined` but `addItem` expects `string | null`
- **Fix:** Pass `snapshot.nameMy` and `snapshot.imageUrl` directly (already `string | null`)
- **Files modified:** src/lib/stores/cart-store.ts
- **Commit:** 360ab9e5

## Verification

- pnpm typecheck: PASS (0 errors)
- pnpm test: PASS (1036 tests, 68 files, 0 failures)
- All acceptance criteria verified via grep checks

## Self-Check: PASSED

All 7 files found, all 3 commits verified.
