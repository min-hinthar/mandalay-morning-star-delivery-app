---
status: verifying
trigger: "Menu details should be fully scrollable on mobile - currently only image area responds to touch scroll"
created: 2026-01-28T00:00:00Z
updated: 2026-01-28T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - touch-action: pan-x from swipe gesture blocks vertical scrolling
test: Added touch-action: pan-y override to scroll containers
expecting: Vertical scrolling should now work on all areas of the detail sheet
next_action: Verify fix works on mobile device or emulator

## Symptoms

expected: Touching any part of the menu detail sheet should allow scrolling
actual: Scrolling only works when touching the image area
errors: None reported
reproduction: Open any menu item detail sheet and try to scroll
started: Current behavior

## Eliminated

## Evidence

- timestamp: 2026-01-28T00:01:00Z
  checked: ItemDetailSheet.tsx structure
  found: Component renders in Drawer (bottom sheet on mobile). Inner content has "overflow-y-auto overscroll-contain" on scrollable div (line 222)
  implication: Scroll container exists, but something must be blocking touch events

- timestamp: 2026-01-28T00:02:00Z
  checked: Drawer.tsx swipe gesture
  found: useSwipeToClose hook applies `style: { touchAction: direction === "down" ? "pan-x" : "pan-y" }` (swipe-gestures.ts line 382)
  implication: For bottom sheets (direction="down"), touch-action is set to "pan-x" which BLOCKS vertical scrolling (pan-y)

- timestamp: 2026-01-28T00:03:00Z
  checked: Drawer.tsx content wrapper
  found: Bottom sheet content wrapper (lines 310-319) has `overflow-y-auto overscroll-contain` but inherits touch-action: pan-x from parent motion.div
  implication: This is the root cause - swipe gesture's touch-action: pan-x blocks vertical scroll touch events

- timestamp: 2026-01-28T00:04:00Z
  checked: Why image area might scroll
  found: Image is in AnimatedImage with fill/object-cover - no special scroll handling. But the image area is ABOVE the scrollable content div, so it's in a different touch region.
  implication: Need to verify - the image is NOT in the scrollable container, it's a sibling. The scrollable div starts AFTER the image.

- timestamp: 2026-01-28T00:05:00Z
  checked: Build verification
  found: TypeScript typecheck passes, production build succeeds
  implication: Fix compiles correctly, ready for runtime verification

## Resolution

root_cause: The useSwipeToClose hook sets `touchAction: "pan-x"` on the drawer container (line 382 of swipe-gestures.ts), which prevents vertical scrolling. The scrollable content div inherits this restriction, blocking touch scroll on mobile.

fix: Added `style={{ touchAction: "pan-y" }}` to:
1. Drawer.tsx line 317 - the bottom sheet content wrapper
2. ItemDetailSheet.tsx line 224 - the scrollable content area

This overrides the parent's pan-x restriction, allowing vertical scrolling in the content areas while preserving the swipe-to-close gesture on the drag handle (which has touch-none class).

verification: TypeScript passes, build passes. Needs runtime verification on mobile device.

files_changed:
- src/components/ui/Drawer.tsx
- src/components/ui/menu/ItemDetailSheet.tsx
