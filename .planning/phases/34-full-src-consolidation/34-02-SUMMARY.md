---
phase: 34-full-src-consolidation
plan: 02
subsystem: ui
tags: [design-system, tokens, z-index, motion, imports]

# Dependency graph
requires:
  - phase: 34-01
    provides: lib/design-system/tokens/ directory with z-index.ts and motion.ts
provides:
  - All 21 z-index consumers using @/lib/design-system/tokens/z-index
  - All 5 motion consumers using @/lib/design-system/tokens/motion
  - Zero remaining @/design-system/tokens/ imports
affects: [34-03, 34-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Design tokens import from lib/design-system/tokens/"

key-files:
  created: []
  modified:
    - src/components/ui/Backdrop.tsx
    - src/components/ui/Toast.tsx
    - src/components/ui/Tooltip.tsx
    - src/components/ui/Dropdown.tsx
    - src/components/ui/Drawer.tsx
    - src/components/ui/Modal.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui/navigation/Header.tsx
    - src/components/ui/layout/AdminLayout.tsx
    - src/components/ui/layout/AppHeader/AppHeader.tsx
    - src/components/ui/layout/AppHeader/AccountIndicator.tsx
    - src/components/ui/layout/MobileDrawer/MobileDrawer.tsx
    - src/components/ui/scroll/SectionNavDots.tsx
    - src/components/ui/cart/CartBar.tsx
    - src/components/ui/cart/FlyToCart.tsx
    - src/components/ui/menu/SearchAutocomplete.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/GlassOverlay.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/DietaryBadges.tsx
    - src/components/ui/search/CommandPalette/CommandPalette.tsx

key-decisions: []

patterns-established:
  - "z-index imports: @/lib/design-system/tokens/z-index"
  - "motion imports: @/lib/design-system/tokens/motion"

# Metrics
duration: 8min
completed: 2026-01-28
---

# Phase 34 Plan 02: Design-System Token Import Migration Summary

**Migrated 26 design-system token imports across 21 files to new lib/design-system/tokens/ location**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T00:35:00Z
- **Completed:** 2026-01-28T00:43:00Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments
- Migrated 21 z-index imports from @/design-system/tokens/z-index to @/lib/design-system/tokens/z-index
- Migrated 5 motion imports from @/design-system/tokens/motion to @/lib/design-system/tokens/motion
- Verified build and typecheck pass with new import paths
- Zero remaining imports from old @/design-system/tokens/ path

## Task Commits

Each task was committed atomically:

1. **Task 1: Update z-index imports (21 files)** - `a51aa6a` (refactor)
2. **Task 2: Update motion imports (5 files)** - `086fc65` (refactor)
3. **Task 3: Verify build passes** - verification only, no commit

## Files Created/Modified

**UI Core Components:**
- `src/components/ui/Backdrop.tsx` - zIndex + overlayMotion
- `src/components/ui/Toast.tsx` - zIndex + overlayMotion
- `src/components/ui/Tooltip.tsx` - zIndex + overlayMotion
- `src/components/ui/Dropdown.tsx` - zIndex + overlayMotion
- `src/components/ui/Drawer.tsx` - zIndex + overlayMotion
- `src/components/ui/Modal.tsx` - zIndex
- `src/components/ui/dropdown-menu.tsx` - zClass

**Layout Components:**
- `src/components/ui/navigation/Header.tsx` - zClass
- `src/components/ui/layout/AdminLayout.tsx` - zClass
- `src/components/ui/layout/AppHeader/AppHeader.tsx` - zClass
- `src/components/ui/layout/AppHeader/AccountIndicator.tsx` - zClass
- `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx` - zClass

**Menu Components:**
- `src/components/ui/menu/SearchAutocomplete.tsx` - zClass
- `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` - zClass
- `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - zClass
- `src/components/ui/menu/UnifiedMenuItemCard/GlassOverlay.tsx` - zClass
- `src/components/ui/menu/UnifiedMenuItemCard/DietaryBadges.tsx` - zClass

**Other Components:**
- `src/components/ui/scroll/SectionNavDots.tsx` - zClass
- `src/components/ui/cart/CartBar.tsx` - zIndex
- `src/components/ui/cart/FlyToCart.tsx` - zIndex
- `src/components/ui/search/CommandPalette/CommandPalette.tsx` - zClass

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all imports migrated cleanly with no errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All token consumers now use @/lib/design-system/tokens/
- Old @/design-system/tokens/ directory can be deleted in 34-03
- Build and typecheck verified passing

---
*Phase: 34-full-src-consolidation*
*Completed: 2026-01-28*
