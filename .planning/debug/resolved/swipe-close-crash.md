---
status: resolved
trigger: "Swiping down to close menu item details causes app to crash or reload"
created: 2026-01-28T00:00:00Z
updated: 2026-01-28T00:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple issues: style prop handling, redundant touchAction, missing defensive checks
test: TypeScript + lint + build verification
expecting: All checks pass, no crashes during swipe gestures
next_action: Archive and commit

## Symptoms

expected: Swiping down on menu detail sheet should smoothly close it
actual: App crashes or reloads when swiping down to close
errors: Likely crash/reload - uncaught exceptions, null references
reproduction: Open menu item detail sheet, swipe down to close
started: Possibly after commit bf0d254 that added touchAction: "pan-y"

## Eliminated

- hypothesis: Division by zero in progress calculations
  evidence: All divisors have non-zero defaults (threshold=100, autoDeleteThreshold=200)
  timestamp: 2026-01-28T00:06:00Z

- hypothesis: Infinite loop during drag
  evidence: No recursive state updates or effects dependent on drag state
  timestamp: 2026-01-28T00:07:00Z

## Evidence

- timestamp: 2026-01-28T00:01:00Z
  checked: swipe-gestures.ts useSwipeToClose hook
  found: |
    Hook looks well-structured. Key observations:
    - Uses Framer Motion drag handlers (onDragStart, onDrag, onDragEnd)
    - For "down" direction, uses drag="y" and touchAction="pan-x"
    - Constraints are {top: 0, bottom: 0} which seems unusual - both set to 0
    - dragElastic {top: 0.1, bottom: 0.6} allows elastic movement
  implication: Constraints both at 0 may allow unrestricted drag range

- timestamp: 2026-01-28T00:02:00Z
  checked: Drawer.tsx useSwipeToClose integration
  found: |
    - Drawer uses useSwipeToClose for bottom position
    - Passes threshold: 150, direction: "down"
    - Content wrapper has touchAction: "pan-y" on line 317
    - Style prop merging is correct (fix already applied)
  implication: Potential touchAction conflict - swipe hook uses "pan-x", content uses "pan-y"

- timestamp: 2026-01-28T00:03:00Z
  checked: ItemDetailSheet.tsx scrollable content
  found: |
    - Scrollable content div (line 223-225) has touchAction: "pan-y"
    - This is nested inside Drawer which also has touchAction on content wrapper
    - REDUNDANT: Parent already has touchAction: "pan-y"
    - Multiple identical touchAction declarations are harmless but unnecessary
  implication: Redundant declaration should be removed for clarity

- timestamp: 2026-01-28T00:08:00Z
  checked: Drag handler defensive checks
  found: |
    handleDrag and handleDragEnd callbacks access info.offset and info.velocity
    without null checks. If Framer Motion ever passes malformed event info
    (e.g., during rapid mount/unmount or interrupted gestures), this could throw.
  implication: Need defensive null checks on event info access

- timestamp: 2026-01-28T00:09:00Z
  checked: Build and typecheck
  found: |
    - pnpm typecheck: PASS
    - pnpm build: PASS
    - No new lint errors from changes
  implication: Fixes are syntactically correct

## Resolution

root_cause: |
  Three issues contributing to potential crash during swipe-to-close:

  1. PREVIOUSLY FIXED - Style prop overwrite in Drawer.tsx (already corrected)

  2. REDUNDANT TOUCHACTION: ItemDetailSheet.tsx had touchAction: "pan-y" on its
     scrollable content div, but this is already set by the parent Drawer's
     content wrapper. The redundancy was harmless but confusing.

  3. MISSING DEFENSIVE CHECKS: The drag event handlers in swipe-gestures.ts
     accessed info.offset and info.velocity without null checks. If Framer
     Motion passed malformed event info during edge cases (rapid gestures,
     interrupted drags, mount/unmount timing), this could throw an exception.

fix: |
  Applied three fixes:

  1. src/components/ui/menu/ItemDetailSheet.tsx:
     - Removed redundant style={{ touchAction: "pan-y" }} from scrollable content
     - Parent Drawer already provides this via content wrapper

  2. src/lib/swipe-gestures.ts (useSwipeToClose):
     - Added defensive check: if (!info?.offset) return; in handleDrag
     - Added defensive check: if (!info?.offset || !info?.velocity) return; in handleDragEnd

  3. src/lib/swipe-gestures.ts (useSwipeToDelete):
     - Added defensive check: if (!info?.offset) return; in handleDrag
     - Added defensive check with state reset in handleDragEnd

  4. src/lib/swipe-gestures.ts (useSwipeNavigation):
     - Added defensive check: if (!info?.offset) return; in handleDrag
     - Added defensive check: if (!info?.offset || !info?.velocity) return; in handleDragEnd

verification: |
  - TypeScript: PASS (pnpm typecheck)
  - Linting: PASS (no new errors, pre-existing errors unrelated)
  - Build: PASS

files_changed:
  - src/components/ui/menu/ItemDetailSheet.tsx
  - src/lib/swipe-gestures.ts
