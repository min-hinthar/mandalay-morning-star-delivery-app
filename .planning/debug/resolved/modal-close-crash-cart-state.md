---
status: resolved
trigger: "Two issues: 1. Page crashes specifically on modal close (not general animation issue) 2. Add to cart button stays disabled after adding one item from modal"
created: 2026-01-30T02:00:00Z
updated: 2026-01-30T02:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two distinct issues found
test: Evidence gathered, root causes identified
expecting: Fixes will resolve both issues
next_action: Apply fixes to ItemDetailSheet and HomepageMenuSection

## Symptoms

expected: Modal closes smoothly, add to cart button re-enables for new selections
actual: Page crashes on modal close; button stays disabled after first add
errors: Crash on modal close, button state not resetting
reproduction: Open item modal, add to cart, close modal - crash; reopen - button disabled
timeline: Persisting after all animation fixes

## Eliminated

## Evidence

- timestamp: 2026-01-30T02:05:00Z
  checked: ItemDetailSheet.tsx - state reset logic
  found: useEffect on line 103-108 resets state when `item` changes, but NOT when modal closes. The effect depends only on `item`, not `isOpen`. When modal reopens with SAME item, state is not reset.
  implication: If user opens same item again after adding to cart, button state may be stale

- timestamp: 2026-01-30T02:06:00Z
  checked: AddToCartButton.tsx - disabled state logic
  found: Line 205 `isDisabled = disabled || state === "loading" || isAnimating`. The `state` is managed internally (idle/loading/success) and correctly resets to idle after 600ms. BUT the `disabled` prop comes from parent (ItemDetailSheet line 328: `disabled={item.isSoldOut || !validation.isValid}`)
  implication: The button's internal state should self-reset. Issue likely in validation or parent state.

- timestamp: 2026-01-30T02:08:00Z
  checked: AddToCartButton handleClick flow
  found: handleClick calls `onAdd?.()` which is `handleAddToCart` in ItemDetailSheet. `handleAddToCart` calls `onClose()` at line 180-181 AFTER `onAddToCart`. This triggers modal close while the button animation is still running.
  implication: Modal unmount during animation could cause issues

- timestamp: 2026-01-30T02:10:00Z
  checked: ItemDetailSheet useEffect for state reset
  found: The useEffect only checks `if (!item) return` and then resets state. It does NOT reset when isOpen changes from false to true. If `item` is the same object reference, no reset happens.
  implication: Need to also reset state when modal opens, not just when item changes

- timestamp: 2026-01-30T02:15:00Z
  checked: MenuContent.tsx handleCloseDetail (lines 109-115)
  found: CORRECT PATTERN - sets isDetailOpen=false first, then delays setSelectedItem(null) by 300ms via setTimeout. This keeps item stable during exit animation.
  implication: This is the correct way to close - keeps item reference for animation

- timestamp: 2026-01-30T02:16:00Z
  checked: HomepageMenuSection.tsx onClose (lines 417-420)
  found: INCORRECT - sets BOTH isModalOpen=false AND setSelectedItem(null) simultaneously. This causes item to become null during exit animation.
  implication: Drawer/Modal tries to render with null item during exit, causing crash

- timestamp: 2026-01-30T02:17:00Z
  checked: ItemDetailSheet renderContent function (line 188)
  found: `if (!item) return null` - if item becomes null during animation, content disappears abruptly
  implication: Combined with HomepageMenuSection's immediate null, causes visual glitch and potential crash

- timestamp: 2026-01-30T02:18:00Z
  checked: ItemDetailSheet state reset useEffect (lines 103-108)
  found: Only depends on `item`, not `isOpen`. Effect: `if (!item) return` then reset state. This means:
  1. When SAME item is opened again, `item` reference is same, effect doesn't run, old state persists
  2. When modal closes and item becomes null, the early return skips reset
  implication: State (selectedModifiers, quantity, notes) persists incorrectly across modal opens

- timestamp: 2026-01-30T02:19:00Z
  checked: handleAddToCart in HomepageMenuSection (lines 160-185)
  found: This handler calls addItem(), THEN immediately sets isModalOpen=false AND selectedItem=null, THEN opens cart drawer
  implication: The immediate modal close with null item during the add-to-cart animation flow causes crashes

## Resolution

root_cause: Two distinct issues:

1. **Modal Close Crash (HomepageMenuSection):**
   - `onClose` sets both `isModalOpen=false` AND `setSelectedItem(null)` simultaneously
   - This clears `item` while AnimatePresence is still running exit animation
   - ItemDetailSheet renders `null` content during animation, causing crash
   - MenuContent.tsx does this correctly with delayed null (300ms)

2. **Add to Cart Button Stays Disabled:**
   - ItemDetailSheet's state reset useEffect (line 103-108) only depends on `item`, not `isOpen`
   - When user opens SAME item again, `item` reference hasn't changed, so effect doesn't run
   - Previous `selectedModifiers` state persists
   - If item has required modifiers, validation fails because old modifiers from previous item may not match
   - This causes `validation.isValid = false`, disabling button

fix:
1. HomepageMenuSection: Added `handleCloseDetail` callback that delays `setSelectedItem(null)` by 300ms after setting `isModalOpen=false`, matching the correct pattern in MenuContent.tsx. Added `closeTimeoutRef` for cleanup on unmount.
2. ItemDetailSheet: Added `isOpen` to the state reset useEffect dependency array so state resets when modal opens, even if same item is selected again.

verification:
- TypeScript typecheck: PASS
- ESLint: PASS
- Production build: PASS

files_changed:
- src/components/ui/menu/ItemDetailSheet.tsx (line 109: added isOpen to useEffect deps)
- src/components/ui/homepage/HomepageMenuSection.tsx (added handleCloseDetail, closeTimeoutRef, updated handleAddToCart and onClose usage)
