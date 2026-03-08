---
status: awaiting_human_verify
trigger: "Menu modal on desktop views cannot scroll or click except on menu item texts"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:30:00Z
---

## Current Focus

hypothesis: Modal content wrapper applies p-6 pt-14 padding and max-h constraints that conflict with ItemDetailSheet's own layout (h-full, nested overflow-y-auto, own close button). Dual close buttons, double padding, and unresolvable h-full create layout/interaction issues on desktop.
test: Remove Modal's default padding from ItemDetailSheet usage via contentClassName prop; disable Modal's close button since ItemDetailSheet has its own
expecting: Content fills dialog properly without double padding/buttons; scroll and click work correctly on desktop
next_action: Await human verification

## Symptoms

expected: Menu modal should be fully scrollable and all elements clickable on desktop viewports
actual: Cannot scroll or click within the menu modal on desktop, except directly on menu item text elements
errors: No console errors reported
reproduction: Open the menu modal on a desktop viewport. Try scrolling or clicking on areas other than menu item text.
started: Unknown - may have been introduced by recent animation or layout changes

## Eliminated

- hypothesis: pointer-events: none on overlay/container elements
  evidence: Searched all Modal, ItemDetailSheet, and globals.css code - no pointer-events: none on any interactive element
  timestamp: investigation phase

- hypothesis: z-index stacking issue between modal layers
  evidence: Backdrop z-index=modal, container z-index=modal+1, dialog stopPropagation works correctly
  timestamp: investigation phase

- hypothesis: Invisible element blocking interaction
  evidence: No fixed/absolute positioned elements overlap the content area unexpectedly
  timestamp: investigation phase

- hypothesis: 3D tilt/transform code affecting hit testing
  evidence: Tilt is only on menu cards (in the grid), not inside the modal. Also enableTilt: false for menu variant.
  timestamp: investigation phase

- hypothesis: Radix UI Dialog blocking
  evidence: ItemDetailSheet uses custom Modal component, not Radix Dialog
  timestamp: investigation phase

- hypothesis: useBodyScrollLock blocking modal interaction
  evidence: position:fixed on body doesn't prevent child scroll containers from scrolling
  timestamp: investigation phase

- hypothesis: useMediaQuery returning wrong value
  evidence: Defaults to false (desktop), correctly returns false for (max-width: 639px) on desktop
  timestamp: investigation phase

## Evidence

- timestamp: investigation
  checked: Modal.tsx content wrapper div (line 348-356)
  found: Content wrapper applies p-6, pt-14 (when showCloseButton=true), overflow-y-auto, max-h-[calc(85vh-2rem)]
  implication: ItemDetailSheet content gets wrapped with unwanted 24px side padding and 56px top padding

- timestamp: investigation
  checked: ItemDetailSheet className="overflow-hidden p-0"
  found: p-0 goes on dialog element, NOT on content wrapper; content wrapper still gets p-6 pt-14
  implication: Double padding - 24px from Modal + 16px from ItemDetailSheet content areas

- timestamp: investigation
  checked: ItemDetailSheet renderContent h-full
  found: h-full doesn't resolve because parent content wrapper has max-h but no explicit height
  implication: flex-1 on scrollable area doesn't constrain height, inner overflow-y-auto never activates, nested scroll issue

- timestamp: investigation
  checked: Dual close buttons
  found: Modal renders its own close button (absolute z-10, 40x40px) AND ItemDetailSheet renders close button on hero image
  implication: Redundant UI, pt-14 padding only exists to clear Modal's close button which isn't needed

- timestamp: investigation
  checked: Content wrapper max-h-[calc(85vh-2rem)] with pt-14
  found: Effective content area is 85vh - 2rem - 3.5rem - padding = significantly reduced
  implication: Less content visible, more reliance on scrolling which may not work correctly with nested overflow-y-auto

## Resolution

root_cause: Modal's content wrapper applies default padding (p-6, pt-14) and scroll behavior that conflicts with ItemDetailSheet's own layout management. The className="overflow-hidden p-0" on the dialog doesn't affect the inner content wrapper, creating double padding, dual close buttons, and a nested scroll container where h-full cannot resolve (parent has max-h but no height).

fix: 1) Added contentClassName prop to Modal for overriding content wrapper styles. 2) ItemDetailSheet now passes contentClassName="!p-0 !pt-0" to remove Modal's wrapper padding. 3) Set showCloseButton={false} since ItemDetailSheet has its own close button on the hero image, eliminating the redundant Modal close button and the pt-14 clearance padding.

verification: Typecheck passes, build passes. Awaiting human verification on desktop.

files_changed:
- src/components/ui/Modal/types.ts (added contentClassName prop)
- src/components/ui/Modal/Modal.tsx (accept and apply contentClassName)
- src/components/ui/menu/ItemDetailSheet.tsx (use contentClassName, disable Modal close button)
