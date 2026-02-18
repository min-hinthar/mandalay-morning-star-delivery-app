---
phase: 37-codebase-cleanup
plan: 02
subsystem: tooling
tags: [eslint, circular-dependencies, madge, import-x]

# Dependency graph
requires:
  - phase: 37-01
    provides: dead code removed, barrel exports cleaned
provides:
  - Zero circular dependencies in codebase
  - ESLint import-x/no-cycle rule enforcement
  - ESLint max-lines warning for components over 400 lines
  - ESLint guard preventing navigation/ directory recreation
affects: [future-development, build-reliability]

# Tech tracking
tech-stack:
  added: [eslint-plugin-import-x]
  patterns: [direct-imports-over-barrels, type-extraction-for-cycles]

key-files:
  created:
    - src/components/ui/admin/settings/settings-types.ts
  modified:
    - eslint.config.mjs
    - package.json
    - src/components/ui/admin/settings/SettingsClient.tsx
    - src/components/ui/admin/settings/DeliverySettingsForm.tsx
    - src/components/ui/admin/settings/NotificationSettingsForm.tsx
    - src/components/ui/admin/settings/OperationsSettingsForm.tsx
    - src/components/ui/cart/CartDrawer.tsx
    - src/components/ui/cart/ClearCartConfirmation.tsx
    - src/components/ui/checkout/AddressStepV8.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
    - src/components/ui/navigation/MobileMenu.tsx
    - .planning/CLEANUP_LOG.md

key-decisions:
  - "Direct imports for overlay components (Drawer, Modal) instead of barrel imports"
  - "Type extraction to dedicated file to break settings form cycles"
  - "Relative imports within menu subdirectory to avoid barrel cycle"
  - "max-lines as warning (not error) per CONTEXT.md decision"

patterns-established:
  - "Import overlay components directly: import { Drawer } from '@/components/ui/Drawer'"
  - "Extract shared types to dedicated file when circular dependency detected"
  - "Use relative imports within same component directory instead of barrel"

# Metrics
duration: 15min
completed: 2026-02-04
---

# Phase 37 Plan 02: Circular Dependency Elimination Summary

**Zero circular dependencies with ESLint import-x/no-cycle enforcement and max-lines warning for component size**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-04T14:38:12Z
- **Completed:** 2026-02-04T14:53:00Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Eliminated all 9 circular dependencies detected by madge
- Configured ESLint import-x/no-cycle rule (error severity) to prevent future cycles
- Added max-lines warning (400 lines) for component files
- Added navigation/ directory guard to no-restricted-imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Install eslint-plugin-import-x and configure ESLint rules** - `fd4d860` (chore)
2. **Task 2: Fix circular dependencies** - `b09ad1d` (fix)
3. **Task 3: Update CLEANUP_LOG.md and verify all rules** - `cc00083` (docs)

## Files Created/Modified

- `src/components/ui/admin/settings/settings-types.ts` - Extracted types to break settings form cycles
- `eslint.config.mjs` - Added import-x/no-cycle, max-lines, navigation guard rules
- `package.json` - Added eslint-plugin-import-x dependency
- `src/components/ui/cart/CartDrawer.tsx` - Direct import for Drawer
- `src/components/ui/cart/ClearCartConfirmation.tsx` - Direct import for Modal
- `src/components/ui/checkout/AddressStepV8.tsx` - Direct imports for Modal/Drawer
- `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - Relative import for getCategoryEmoji
- `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` - Relative import for FavoriteButton
- `src/components/ui/navigation/MobileMenu.tsx` - Direct import for Drawer
- `.planning/CLEANUP_LOG.md` - Documented all fixes and ESLint rules

## Decisions Made

1. **Direct imports over barrel imports for overlay components** - Barrel re-exports create cycles when component A imports from barrel and barrel re-exports component A's directory
2. **Type extraction pattern** - Settings forms imported types from SettingsClient, creating circular dependency; extracted to settings-types.ts
3. **Relative imports within menu directory** - CardImage and UnifiedMenuItemCard use relative imports (../EmojiPlaceholder) instead of barrel (@/components/ui/menu)
4. **max-lines as warning** - Per CONTEXT.md decision, file size is warning only, not build failure

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all cycles resolved on first attempt using documented patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Codebase has zero circular dependencies
- ESLint will catch any new cycles as errors
- Build passes with 21 max-lines warnings (expected, per design)
- Ready for Phase 38 (Offline Support)

---

_Phase: 37-codebase-cleanup_
_Completed: 2026-02-04_
