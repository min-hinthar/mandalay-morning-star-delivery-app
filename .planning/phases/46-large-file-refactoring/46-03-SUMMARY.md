---
phase: 46-large-file-refactoring
plan: 03
subsystem: ui
tags: [react, barrel-exports, component-splitting, subfolder-pattern]

requires:
  - phase: 46-01
    provides: "Subfolder split pattern for leaf components"
  - phase: 46-02
    provides: "Subfolder split pattern for admin/account components"
provides:
  - "8 shared UI components split into subfolder/index.tsx pattern"
  - "Complete barrel re-exports for FormValidation (20), Modal (10), skeleton (11)"
  - "Hero.tsx split into 4 sub-files"
  - "UnifiedMenuItemCard documented as irreducible"
affects: [46-06, 46-07]

tech-stack:
  added: []
  patterns:
    - "Subfolder barrel pattern for high-export-count components"
    - "Constants extraction to reduce main component file size"

key-files:
  created:
    - "src/components/ui/FormValidation/index.tsx"
    - "src/components/ui/Modal/index.tsx"
    - "src/components/ui/skeleton/index.tsx"
    - "src/components/ui/admin/ExpandableTableRow/index.tsx"
    - "src/components/ui/checkout/AddressInput/index.tsx"
    - "src/components/ui/checkout/TimeSlotPicker/index.tsx"
    - "src/components/ui/orders/tracking/DeliveryMap/index.tsx"
    - "src/components/ui/orders/tracking/StatusTimeline/index.tsx"
    - "src/components/ui/homepage/Hero/index.tsx"
  modified:
    - "src/components/ui/index.ts (import paths resolve to subfolders)"

key-decisions:
  - "Hero.tsx split: sub-components (AnimatedHeadline, StatItem, GradientFallback, HeroContent) are self-contained with no shared state/refs, clean split"
  - "UnifiedMenuItemCard.tsx left as-is: 540 lines but tightly coupled tilt physics, cart integration, touch handling, and long-press detection through shared refs/state"
  - "ValidatedInputs split into 3 files (ValidatedInput, ValidatedTextarea, ValidatedForm) to keep all under 400 lines"
  - "Modal constants extracted to separate file to bring Modal.tsx from 483 to 385 lines"

patterns-established:
  - "High-export barrels: count exports in original, verify barrel matches exactly"
  - "Constants extraction: move animation variants and config objects to constants.ts when component exceeds 400 lines"

duration: 30min
completed: 2026-02-06
---

# Phase 46 Plan 03: Shared UI Component Splits Summary

**Split 8 shared UI components (FormValidation 20 exports, Modal 10, skeleton 11, plus 5 mid-tier) into subfolder pattern with complete barrel re-exports; Hero split, UnifiedMenuItemCard documented as irreducible**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-02-06T15:03:09Z
- **Completed:** 2026-02-06T15:33:00Z
- **Tasks:** 2
- **Files modified:** 52 (originals deleted, sub-files created, barrel indexes)

## Accomplishments

- FormValidation (1031 lines, 20 exports) split into 8 sub-files, all under 400 lines
- Modal (746 lines, 10 exports) split into 6 sub-files, all under 400 lines
- skeleton (468 lines, 11 exports) split into 5 sub-files
- 5 additional shared components split: ExpandableTableRow, AddressInput, TimeSlotPicker, DeliveryMap, StatusTimeline
- Hero.tsx (518 lines) successfully split into 4 sub-files
- UnifiedMenuItemCard.tsx evaluated and documented as irreducible (540 lines, already has 7 extracted sub-components)
- Zero TypeScript errors, zero lint errors across all splits

## Task Commits

1. **Task 1: Split FormValidation, Modal, skeleton** - `918161d` (refactor)
2. **Task 2: Split 5 shared components + Hero** - `3171c90` (refactor, merged with docs commit by lint-staged)

## Files Created/Modified

### FormValidation/ (8 files from 1)
- `FormValidation/types.ts` - ValidationRule, ValidationState, FieldValidation
- `FormValidation/validationRules.ts` - validationRules factory, combineRules
- `FormValidation/useFieldValidation.ts` - useFieldValidation hook
- `FormValidation/FormValidationProvider.tsx` - Provider, useFormValidation, useFormValidationOptional
- `FormValidation/ValidatedInput.tsx` - ValidatedInput with shake/icon animations
- `FormValidation/ValidatedTextarea.tsx` - ValidatedTextarea with char count
- `FormValidation/ValidatedForm.tsx` - ValidatedForm wrapper
- `FormValidation/ValidationMessage.tsx` - ValidationMessage, InlineError
- `FormValidation/index.tsx` - Barrel (20 exports)

### Modal/ (7 files from 1)
- `Modal/types.ts` - ModalProps, UseModalReturn, ConfirmModalProps, etc.
- `Modal/constants.ts` - Size config, animation variants
- `Modal/useModal.ts` - useModal hook
- `Modal/ModalHeader.tsx` - ModalHeader, ModalFooter
- `Modal/Modal.tsx` - Main modal with focus trap, scroll lock, swipe
- `Modal/ConfirmModal.tsx` - ConfirmModal dialog
- `Modal/index.tsx` - Barrel (10 exports)

### skeleton/ (5 files from 1)
- `skeleton/base.tsx` - Skeleton component with shimmer/pulse/wave/grain
- `skeleton/text-skeletons.tsx` - SkeletonText, SkeletonAvatar
- `skeleton/card-skeletons.tsx` - SkeletonCard, SkeletonMenuItem
- `skeleton/table-skeletons.tsx` - SkeletonTableRow
- `skeleton/index.tsx` - Barrel (11 exports)

### ExpandableTableRow/ (4 files from 1)
- `ExpandableTableRow/ExpandableTableRow.tsx` - Row with expand/collapse
- `ExpandableTableRow/PreviewPanels.tsx` - Quick, Route, Driver preview panels
- `ExpandableTableRow/useExpandedRows.ts` - Row expansion state hook
- `ExpandableTableRow/index.tsx` - Barrel (5 exports)

### AddressInput/ (6 files from 1)
- `AddressInput/types.ts` - AddressInputProps, AddressAutocompleteResult
- `AddressInput/AddressCard.tsx` - Selectable address card
- `AddressInput/MapPreview.tsx` - Coverage route map preview
- `AddressInput/AddressAutocomplete.tsx` - Google Places autocomplete
- `AddressInput/AddressInput.tsx` - Main component
- `AddressInput/index.tsx` - Barrel (6 exports)

### TimeSlotPicker/ (4 files from 1)
- `TimeSlotPicker/DatePill.tsx` - Selectable date pill
- `TimeSlotPicker/TimeSlotPill.tsx` - Time slot button
- `TimeSlotPicker/TimeSlotPicker.tsx` - Main component
- `TimeSlotPicker/index.tsx` - Barrel (3 exports)

### DeliveryMap/ (4 files from 1)
- `DeliveryMap/constants.ts` - Map styles, container config
- `DeliveryMap/DeliveryMapSkeleton.tsx` - Loading skeleton
- `DeliveryMap/DeliveryMap.tsx` - Main map with markers/polyline
- `DeliveryMap/index.tsx` - Barrel (2 exports)

### StatusTimeline/ (5 files from 1)
- `StatusTimeline/constants.ts` - STATUS_ORDER, STATUS_CONFIG
- `StatusTimeline/TimelineStep.tsx` - Individual timeline step
- `StatusTimeline/CancelledState.tsx` - Cancelled order display
- `StatusTimeline/StatusTimeline.tsx` - Main timeline component
- `StatusTimeline/index.tsx` - Barrel (3 exports)

### Hero/ (5 files from 1)
- `Hero/types.ts` - HeroProps
- `Hero/HeroSubComponents.tsx` - AnimatedHeadline, StatItem, GradientFallback
- `Hero/HeroContent.tsx` - Text/CTA overlay content
- `Hero/Hero.tsx` - Main hero with parallax layers
- `Hero/index.tsx` - Barrel (2 exports)

## Decisions Made

1. **Hero.tsx: SPLIT** - Sub-components (AnimatedHeadline, StatItem, GradientFallback, HeroContent) don't share state/refs with the parent Hero via closures. Each receives props and uses its own hooks. Clean separation.

2. **UnifiedMenuItemCard.tsx: LEAVE AS-IS** - Already in a subfolder with 7 extracted files (GlassOverlay, CardImage, CardContent, AddButton, DietaryBadges, FavoriteButton, types). The remaining 540 lines is a single render function with tightly interwoven:
   - Tilt physics (useMotionValue, useSpring, useTransform for 3D rotation)
   - Cart integration (useCart, quantity tracking, add/increment/decrement handlers)
   - Favorites (controlled + uncontrolled modes)
   - Touch handling (long-press detection with 500ms timer, scroll cancellation)
   - Mouse tracking (tilt coords shared between handleMouseMove, handleMouseLeave, handleTouchEnd)
   Splitting further would require passing 10+ props/refs between files for no readability gain. Documented as irreducible at current architecture.

3. **ValidatedInputs further split** - Original plan had ValidatedInput + ValidatedTextarea + ValidatedForm in one file (631 lines). Split into 3 separate files to meet 400-line limit.

4. **Modal constants extraction** - Extracted animation variants and size config to constants.ts, reducing Modal.tsx from 483 to 385 lines.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ValidatedInputs.tsx exceeded 400 lines**
- **Found during:** Task 1
- **Issue:** Combined ValidatedInput + ValidatedTextarea + ValidatedForm was 631 lines
- **Fix:** Split into 3 separate files: ValidatedInput.tsx (334), ValidatedTextarea.tsx (279), ValidatedForm.tsx (53)
- **Files modified:** FormValidation/ValidatedInput.tsx, FormValidation/ValidatedTextarea.tsx, FormValidation/ValidatedForm.tsx
- **Verification:** pnpm typecheck passes, all under 400 lines
- **Committed in:** 918161d

**2. [Rule 3 - Blocking] Modal.tsx exceeded 400 lines**
- **Found during:** Task 1
- **Issue:** Modal.tsx was 483 lines even after type/hook extraction
- **Fix:** Extracted animation variants and size config to constants.ts, removed section comment headers
- **Files modified:** Modal/constants.ts, Modal/Modal.tsx
- **Verification:** pnpm typecheck passes, Modal.tsx at 385 lines
- **Committed in:** 918161d

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to meet 400-line success criterion. No scope creep.

## Issues Encountered

- lint-staged backup/restore stash mechanism interfered with git commits, causing one commit (Task 1) to be reset and requiring re-commit. Task 2 files were folded into a docs commit (3171c90) by the stash restore process. All code changes are correct and committed; only commit attribution was affected.
- `pnpm build` fails due to Google Fonts network error (Playfair Display fetch failure) - unrelated to code changes, sandbox network issue. Typecheck and lint both pass cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 9 components now split (8 planned + Hero evaluation resulted in split)
- UnifiedMenuItemCard documented as irreducible with clear rationale
- All barrel re-exports verified complete via typecheck
- Ready for 46-04 (admin page splits) and beyond

---
*Phase: 46-large-file-refactoring*
*Completed: 2026-02-06*
