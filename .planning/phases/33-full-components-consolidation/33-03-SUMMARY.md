# Phase 33 Plan 03: Menu Component Consolidation Summary

## One-liner

Merged menu/ directory into ui/menu/, removing 5 duplicates, moving 12 unique components, and updating all consumer imports to canonical @/components/ui/menu location.

## Tasks Completed

| Task | Commit | Description | Key Files |
|------|--------|-------------|-----------|
| 1 | 48b102a | Remove duplicate menu/ components | Deleted 5 duplicates (SearchInput, MenuGrid, category-tabs, menu-section, menu-skeleton) |
| 2 | a125842 | Move unique components to ui/menu/ | Moved FeaturedCarousel/, UnifiedMenuItemCard/, MenuAccordion, MenuCardWrapper, etc. |
| 3 | 97b2e14 | Update barrel exports and consumers | ui/menu/index.ts, HomepageMenuSection.tsx |

## Changes Made

### Files Deleted (5 duplicates)
- `src/components/menu/SearchInput.tsx` - ui/menu version has autocomplete
- `src/components/menu/MenuGrid.tsx` - marked @deprecated
- `src/components/menu/category-tabs.tsx` - ui/menu has scrollspy
- `src/components/menu/menu-section.tsx` - ui/menu is newer with bilingual support
- `src/components/menu/menu-skeleton.tsx` - ui/menu has more variants

### Files Moved to ui/menu/ (12 unique components)
- `FeaturedCarousel/` (3 files) - auto-scrolling carousel
- `UnifiedMenuItemCard/` (8 files) - main menu item card
- `MenuAccordion.tsx` + stories - collapsible categories
- `MenuCardWrapper.tsx` - animation wrapper
- `MenuEmptyState.tsx` - empty state display
- `ModifierGroup.tsx` - modifier selection
- `QuantitySelector.tsx` - quantity input
- `search-results-grid.tsx` -> `SearchResultsGrid.tsx` (renamed)
- `menu-header.tsx` -> `MenuHeader.tsx` (renamed, updated to new SearchInput API)

### Barrel Exports Added to ui/menu/index.ts
- UnifiedMenuItemCard, UnifiedMenuItemCardProps
- MenuCardWrapper, MenuCardWrapperProps
- FeaturedCarousel, CarouselControls, FeaturedCarouselProps, CarouselControlsProps
- MenuEmptyState
- SearchResultsGrid
- MenuHeader
- MenuAccordion, MenuAccordionProps
- ModifierGroup

Note: QuantitySelector not exported to avoid conflict with cart/QuantitySelector (different APIs).

### Consumer Import Updates
- `HomepageMenuSection.tsx` - now imports from @/components/ui/menu

### Internal Import Updates
- `FeaturedCarousel.tsx` - relative imports for UnifiedMenuItemCard, MenuCardWrapper
- `MenuGrid.tsx` - relative imports for UnifiedMenuItemCard, MenuCardWrapper
- `ItemDetailSheet.tsx` - relative imports for ModifierGroup, QuantitySelector
- `CategoryTabs.tsx` - added controlled `activeCategory` prop for homepage use

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| ui/menu SearchInput wins | Has autocomplete, debouncing, useMenuSearch hook |
| ui/menu CategoryTabs wins | Has scrollspy via useActiveCategory, bilingual support |
| Add activeCategory prop to CategoryTabs | Support both scrollspy (menu page) and controlled (homepage) modes |
| MenuHeader updated to new SearchInput API | New API uses onQueryChange, onSelectItem instead of value/onChange |
| QuantitySelector excluded from barrel | Avoid conflict with cart/QuantitySelector (different APIs) |
| Rename kebab-case to PascalCase | Consistency with ui/menu naming conventions |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CategoryTabs missing controlled mode support**
- **Found during:** Task 2
- **Issue:** ui/menu/CategoryTabs only supported scrollspy mode, but HomepageMenuSection needed manual activeCategory control
- **Fix:** Added optional `activeCategory` prop for controlled mode, scrollspy disabled when prop provided
- **Files modified:** src/components/ui/menu/CategoryTabs.tsx
- **Commit:** a125842

**2. [Rule 2 - Missing Critical] MenuHeader API mismatch**
- **Found during:** Task 2
- **Issue:** MenuHeader imported old SearchInput with value/onChange/onClear API, but ui/menu SearchInput uses onQueryChange/onSelectItem
- **Fix:** Updated MenuHeader props and usage to match new SearchInput API
- **Files modified:** src/components/ui/menu/MenuHeader.tsx
- **Commit:** a125842

## Verification Results

- [x] pnpm typecheck passes
- [x] pnpm build passes
- [x] No imports from @/components/menu remain
- [x] menu/ directory no longer exists
- [x] All components accessible from @/components/ui/menu

## Next Phase Readiness

**33-04 (already executed):** Layout and search consolidation was executed in parallel and is complete.

Remaining consolidation:
- 33-05: Final verification and cleanup

## Metrics

- **Duration:** 26 minutes
- **Completed:** 2026-01-27
- **Files changed:** 30+ (deletions, moves, updates)
- **Commits:** 3
