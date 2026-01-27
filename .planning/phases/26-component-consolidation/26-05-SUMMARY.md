---
phase: 26-component-consolidation
plan: 05
subsystem: ui-components
tags: [menu, component-migration, consolidation]
depends_on:
  requires: ["26-02", "26-03"]
  provides: ["ui/menu barrel export", "clean menu component names"]
  affects: ["26-06", "26-07"]
tech_stack:
  added: []
  patterns: ["barrel exports", "Drawer position=bottom for mobile sheets"]
key_files:
  created:
    - src/components/ui/menu/index.ts
    - src/components/ui/menu/CategoryTabs.tsx
    - src/components/ui/menu/ItemDetailSheet.tsx
    - src/components/ui/menu/MenuContent.tsx
    - src/components/ui/menu/MenuGrid.tsx
    - src/components/ui/menu/MenuSection.tsx
    - src/components/ui/menu/MenuSkeleton.tsx
    - src/components/ui/menu/SearchInput.tsx
    - src/components/ui/menu/BlurImage.tsx
    - src/components/ui/menu/EmojiPlaceholder.tsx
    - src/components/ui/menu/FavoriteButton.tsx
    - src/components/ui/menu/SearchAutocomplete.tsx
  modified:
    - src/app/(public)/menu/page.tsx
    - src/components/homepage/HomepageMenuSection.tsx
    - src/components/menu/menu-skeleton.tsx
    - src/components/menu/UnifiedMenuItemCard/CardImage.tsx
    - src/components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
    - src/components/ui-v8/index.ts
decisions:
  - key: "drawer-for-mobile-sheets"
    choice: "Use Drawer with position='bottom' for mobile sheets"
    rationale: "BottomSheet merged into Drawer in 26-02, consistent API"
  - key: "v8-suffix-removal"
    choice: "Remove all V8 suffixes from menu components"
    rationale: "V8 suffix was temporary during transition, consolidation makes it unnecessary"
  - key: "backwards-compat-exports"
    choice: "Keep V8-named exports in ui-v8/index.ts as aliases"
    rationale: "Prevents breaks during incremental migration"
metrics:
  duration: "22min"
  completed: "2026-01-27"
---

# Phase 26 Plan 05: Menu Components Migration Summary

Menu components migrated from ui-v8/menu/ to ui/menu/ with V8 suffix removal and clean barrel exports.

## What Was Done

### Task 1: Move Menu Components
- Created `src/components/ui/menu/` directory
- Moved 11 components from `ui-v8/menu/` to `ui/menu/`
- Renamed V8-suffixed files to clean names:
  - `CategoryTabsV8.tsx` -> `CategoryTabs.tsx`
  - `ItemDetailSheetV8.tsx` -> `ItemDetailSheet.tsx`
  - `MenuContentV8.tsx` -> `MenuContent.tsx`
  - `MenuGridV8.tsx` -> `MenuGrid.tsx`
  - `MenuSectionV8.tsx` -> `MenuSection.tsx`
  - `MenuSkeletonV8.tsx` -> `MenuSkeleton.tsx`
  - `SearchInputV8.tsx` -> `SearchInput.tsx`

### Task 2: Update Component Names and Imports
- Removed V8 suffix from all component exports and props types
- Updated `ItemDetailSheet` to use `Drawer` with `position="bottom"` (replacing BottomSheet)
- Updated `ItemDetailSheet` to import Modal from `@/components/ui/Modal`
- Updated internal cross-references between menu components
- Updated all consumers:
  - `src/app/(public)/menu/page.tsx`
  - `src/components/homepage/HomepageMenuSection.tsx`
  - `src/components/menu/menu-skeleton.tsx`
  - `src/components/menu/UnifiedMenuItemCard/CardImage.tsx`
  - `src/components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx`

### Task 3: Create Barrel Export
- Created clean `index.ts` with all 11 components and types exported
- Added backwards-compat aliases in `ui-v8/index.ts`

## Component Inventory

| Component | Old Name | New Name | Notes |
|-----------|----------|----------|-------|
| CategoryTabs | CategoryTabsV8 | CategoryTabs | Scrollspy category navigation |
| ItemDetailSheet | ItemDetailSheetV8 | ItemDetailSheet | Uses Drawer for mobile, Modal for desktop |
| MenuContent | MenuContentV8 | MenuContent | Full menu page composition |
| MenuGrid | MenuGridV8 | MenuGrid | Responsive menu item grid |
| MenuSection | MenuSectionV8 | MenuSection | Category section wrapper |
| MenuSkeleton | MenuSkeletonV8 | MenuSkeleton | Loading skeleton |
| MenuItemCardSkeleton | MenuItemCardV8Skeleton | MenuItemCardSkeleton | Card skeleton |
| SearchSkeleton | SearchSkeletonV8 | SearchSkeleton | Search bar skeleton |
| SearchInput | SearchInputV8 | SearchInput | Search with autocomplete |
| SearchAutocomplete | - | SearchAutocomplete | Unchanged (no V8 suffix) |
| BlurImage | - | BlurImage | Unchanged |
| EmojiPlaceholder | - | EmojiPlaceholder | Unchanged |
| FavoriteButton | - | FavoriteButton | Unchanged |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cart component imports already migrated**
- **Found during:** Task 2
- **Issue:** Files already had cart component imports updated to ui/cart (by lint rule)
- **Fix:** Included these files in the commit as they're related consolidation work
- **Files affected:** providers.tsx, AddButton.tsx, menu-header.tsx

## Verification Results

```
- All 12 files exist in src/components/ui/menu/: PASS
- No V8 suffix in component exports: PASS
- No imports from ui-v8 in menu files: PASS
- Barrel export exists: PASS
- TypeScript check: PASS
```

## Commits

| Hash | Message |
|------|---------|
| 688be4c | feat(26-05): migrate menu components from ui-v8 to ui |

## Next Phase Readiness

Ready for 26-06 (cart component migration) and 26-07 (transitions migration).

**Dependencies satisfied:**
- Modal in ui/ (from 26-02)
- Drawer with position="bottom" (from 26-02)
- Menu components now in ui/menu (this plan)

**Blockers:** None
