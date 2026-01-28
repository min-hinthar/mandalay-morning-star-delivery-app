---
status: verifying
trigger: "Swiping down to close menu item details causes app to crash or reload"
created: 2026-01-28T00:00:00Z
updated: 2026-01-28T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Style prop overwrite and redundant y transform
test: N/A - root cause found
expecting: N/A
next_action: Apply fix to Drawer.tsx - remove redundant y, merge styles properly

## Symptoms

expected: Swiping down on menu detail sheet should smoothly close it
actual: App crashes or reloads when swiping down to close
errors: Likely crash/reload - uncaught exceptions, null references
reproduction: Open menu item detail sheet, swipe down to close
started: Possibly after commit bf0d254 that added touchAction: "pan-y"

## Eliminated

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
    - dragOffset is used in style y transform when isDragging
    - Content wrapper has touchAction: "pan-y" on line 317
  implication: Potential touchAction conflict - swipe hook uses "pan-x", content uses "pan-y"

- timestamp: 2026-01-28T00:03:00Z
  checked: ItemDetailSheet.tsx scrollable content
  found: |
    - Scrollable content div (line 223-225) has touchAction: "pan-y"
    - This is nested inside Drawer which also has touchAction on content wrapper
    - Multiple touchAction declarations may cause browser conflicts
  implication: Multiple touchAction settings could cause unpredictable behavior

- timestamp: 2026-01-28T00:04:00Z
  checked: Drawer.tsx lines 266-283 - style prop handling
  found: |
    Critical issue: swipeProps spread AFTER explicit style prop
    - Line 266-269: style={{ y: dragOffset, height: "90vh" }}
    - Line 283: {...swipeProps} where swipeProps.style = { touchAction: "pan-x" }
    - Spread overwrites entire style object - y transform is LOST
    - Framer Motion drag="y" then has no corresponding style.y
  implication: Style overwrite causes visual glitch and potential crash

- timestamp: 2026-01-28T00:05:00Z
  checked: Double y-transform application
  found: |
    When drag="y" is set, Framer Motion controls the y position.
    But Drawer also manually sets y: isDragging ? dragOffset : 0
    This creates competing transforms that can fight each other.
    When isDragging becomes false, y jumps to 0 while animation continues.
  implication: Double application of y transform causes jank/crash

## Resolution

root_cause: |
  Two related issues in Drawer.tsx causing swipe-to-close crash:

  1. STYLE PROP OVERWRITE: The swipeProps spread on line 283 contains
     style: { touchAction: "pan-x" } which overwrites the explicit style prop
     on line 266-269 that sets y and height values.

  2. REDUNDANT Y TRANSFORM: The explicit y: dragOffset in style is redundant
     because Framer Motion's drag="y" already controls the y position.
     This creates conflicting transforms when they disagree.

fix: |
  Reorganized prop order and style merging in Drawer.tsx:

  BEFORE (broken):
  - style={{ y: dragOffset, height: "90vh" }}  // set first
  - {...swipeProps}  // spread last - OVERWRITES style entirely!

  AFTER (fixed):
  - {...swipeProps}  // spread first
  - style={{ ...swipeProps.style, height: "90vh" }}  // set last, MERGE styles

  Key changes:
  1. Moved swipeProps spread BEFORE style prop
  2. Merged swipeProps.style with our height value
  3. Removed redundant y: dragOffset (Framer handles y via drag="y")
  4. Removed unused dragOffset destructuring

verification: |
  - TypeScript: PASS (pnpm typecheck)
  - Linting: PASS (no new errors from changes)
  - Build: pending

files_changed:
  - src/components/ui/Drawer.tsx
