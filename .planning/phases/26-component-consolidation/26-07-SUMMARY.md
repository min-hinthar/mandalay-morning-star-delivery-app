---
phase: 26-component-consolidation
plan: 07
status: complete
subsystem: ui
tags: [imports, barrel-exports, consolidation, migration]
requires: [26-04, 26-05, 26-06]
provides: [unified-imports, clean-barrel-export]
affects: []
tech-stack:
  added: []
  patterns: [barrel-exports, path-aliases]
key-files:
  created: []
  modified:
    - src/components/ui/index.ts
    - src/components/checkout/AddressStepV8.tsx
    - src/components/menu/MenuGrid.tsx
    - src/components/menu/menu-section.tsx
    - src/components/ui-v8/ToastProvider.tsx
decisions:
  - Remove duplicate SearchInput from main barrel (menu version is canonical)
  - Remove duplicate CartEmptyState from EmptyState.tsx (cart version is canonical)
  - Use Drawer position="bottom" to replace BottomSheet
metrics:
  duration: 8min
  completed: 2026-01-27
---

# Phase 26 Plan 07: Consumer Import Consolidation Summary

**One-liner:** Unified barrel export with subdirectory re-exports, migrated last ui-v8 import.

## What Was Done

### Task 1: Main Barrel Export Updated
- Added re-exports for all 5 subdirectories: cart, menu, navigation, scroll, transitions
- Removed duplicate `SearchInput` export (menu/SearchInput.tsx is the canonical version with autocomplete)
- Removed duplicate `CartEmptyState` from EmptyState.tsx (cart/CartEmptyState.tsx is the animated version)
- All components now accessible via `@/components/ui`

### Task 2-3: Consumer Imports Updated
- **AddressStepV8.tsx**: Migrated from `@/components/ui-v8` to `@/components/ui`
  - Changed `BottomSheet` to `Drawer position="bottom"` per design decision
- **MenuGrid.tsx**: Updated deprecated comment to point to `@/components/ui/menu`
- **menu-section.tsx**: Updated deprecated comment to point to `@/components/ui/menu`
- **ToastProvider.tsx**: Fixed example import in JSDoc

## Verification Results

| Check | Result |
|-------|--------|
| No ui-v8 imports outside ui-v8/ | PASS |
| TypeScript | PASS |
| Build | PASS |

## Commits

| Hash | Message |
|------|---------|
| f220352 | feat(26-07): add subdirectory re-exports to main ui barrel |
| 8a19f78 | refactor(26-07): update consumer imports from ui-v8 to ui |

## Files Changed

| File | Change |
|------|--------|
| src/components/ui/index.ts | Added 5 subdirectory re-exports, removed duplicates |
| src/components/checkout/AddressStepV8.tsx | Import from ui/, use Drawer position="bottom" |
| src/components/menu/MenuGrid.tsx | Updated deprecated comment |
| src/components/menu/menu-section.tsx | Updated deprecated comment |
| src/components/ui-v8/ToastProvider.tsx | Fixed example import path |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed duplicate SearchInput export**
- **Found during:** Task 1
- **Issue:** Both `ui/search-input.tsx` and `ui/menu/SearchInput.tsx` export `SearchInput` with different APIs
- **Fix:** Removed the simpler one from main barrel, keeping menu version (has autocomplete)
- **Files modified:** src/components/ui/index.ts

**2. [Rule 3 - Blocking] Removed duplicate CartEmptyState export**
- **Found during:** Task 1
- **Issue:** Both `ui/EmptyState.tsx` and `ui/cart/CartEmptyState.tsx` export `CartEmptyState`
- **Fix:** Removed from EmptyState.tsx export, keeping cart version (has animations)
- **Files modified:** src/components/ui/index.ts

## Current State

All consumer files now import from `@/components/ui` instead of `@/components/ui-v8`. The main barrel export provides unified access to all UI components including subdirectory exports.

### Import Paths Available

```typescript
// Direct from main barrel
import { Modal, Drawer, Button, CartBar, MenuContent } from "@/components/ui";

// Or from subdirectories
import { CartBar, CartButton } from "@/components/ui/cart";
import { MenuContent, ItemDetailSheet } from "@/components/ui/menu";
import { Header, BottomNav } from "@/components/ui/navigation";
import { ScrollChoreographer } from "@/components/ui/scroll";
import { PageTransition } from "@/components/ui/transitions";
```

## Next Phase Readiness

Plan 26-08 (cleanup) can proceed:
- All imports consolidated to ui/
- ui-v8/ directory can be analyzed for remaining unused files
- Ready for final cleanup and deletion of deprecated components
