# Task: V1-S1-004 — Menu Grid Layout

> **Sprint**: 1 (Menu Browse)
> **Priority**: P0
> **Depends On**: V1-S1-003 (Item Card)
> **Branch**: `feat/menu-grid-v1`

---

## Objective

Create the responsive menu grid layout that displays items by category. The grid should be responsive (1/2/3/4 columns), include category section headers, skeleton loading states, and empty state handling.

---

## Acceptance Criteria

- [ ] Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
- [ ] Category sections with sticky headers
- [ ] Section headers show category name + item count
- [ ] Skeleton loading state during fetch
- [ ] Empty state if no items (category or search)
- [ ] "Menu coming soon" if no active categories
- [ ] Smooth grid transitions
- [ ] Proper spacing between sections
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. MenuGrid Component

Create `src/components/menu/MenuGrid.tsx`:

```typescript
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MenuSection } from './MenuSection';
import { MenuEmptyState } from './MenuEmptyState';
import type { MenuCategory, MenuItem } from '@/types/menu';

interface MenuGridProps {
  categories: MenuCategory[];
  onItemSelect: (item: MenuItem) => void;
  isSearchMode?: boolean;
  searchQuery?: string;
}

export function MenuGrid({
  categories,
  onItemSelect,
  isSearchMode = false,
  searchQuery = '',
}: MenuGridProps) {
  // Filter out empty categories
  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

  if (nonEmptyCategories.length === 0) {
    if (isSearchMode) {
      return (
        <MenuEmptyState
          type="no-results"
          searchQuery={searchQuery}
        />
      );
    }
    return <MenuEmptyState type="no-menu" />;
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-8">
      <AnimatePresence mode="popLayout">
        {nonEmptyCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <MenuSection
              id={`category-${category.slug}`}
              category={category}
              onItemSelect={onItemSelect}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 2. MenuSection Component

Update `src/components/menu/MenuSection.tsx`:

```typescript
'use client';

import { ItemCard } from './ItemCard';
import type { MenuCategory, MenuItem } from '@/types/menu';

interface MenuSectionProps {
  id: string;
  category: MenuCategory;
  onItemSelect: (item: MenuItem) => void;
}

export function MenuSection({ id, category, onItemSelect }: MenuSectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      {/* Sticky Category Header */}
      <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border/50">
        <h2 className="font-display text-xl text-brand-red flex items-baseline gap-2">
          {category.name}
          <span className="text-sm font-normal text-muted-foreground">
            ({category.items.length} {category.items.length === 1 ? 'item' : 'items'})
          </span>
        </h2>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {category.items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onSelect={onItemSelect}
          />
        ))}
      </div>
    </section>
  );
}
```

### 3. Empty States

Create `src/components/menu/MenuEmptyState.tsx`:

```typescript
import { Search, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuEmptyStateProps {
  type: 'no-menu' | 'no-results';
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function MenuEmptyState({
  type,
  searchQuery,
  onClearSearch,
}: MenuEmptyStateProps) {
  if (type === 'no-menu') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <UtensilsCrossed className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Menu Coming Soon
        </h2>
        <p className="text-muted-foreground max-w-md">
          We're preparing something delicious for you. Check back soon to see our
          full menu of authentic Burmese dishes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-xl font-display text-foreground mb-2">
        No Results Found
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        We couldn't find any dishes matching "{searchQuery}".
        Try a different search term or browse our categories.
      </p>
      {onClearSearch && (
        <Button onClick={onClearSearch} variant="outline">
          Clear Search
        </Button>
      )}
      <div className="mt-6 text-sm text-muted-foreground">
        <p className="font-medium mb-2">Popular searches:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Mohinga', 'Curry', 'Noodles', 'Seafood'].map((term) => (
            <span
              key={term}
              className="px-3 py-1 bg-muted rounded-full text-foreground"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. Grid Skeleton

Update `src/components/menu/MenuSkeleton.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { ItemCardSkeleton } from './ItemCardSkeleton';

export function MenuSkeleton() {
  return (
    <div>
      {/* Tab Skeleton */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="px-4 pb-8 pt-6 space-y-8">
        {Array.from({ length: 3 }).map((_, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section Header */}
            <div className="mb-4">
              <Skeleton className="h-7 w-48" />
            </div>

            {/* Item Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, cardIdx) => (
                <ItemCardSkeleton key={cardIdx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. SearchResults Grid

Create `src/components/menu/SearchResultsGrid.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { ItemCard } from './ItemCard';
import { MenuEmptyState } from './MenuEmptyState';
import type { MenuItem } from '@/types/menu';

interface SearchResultsGridProps {
  items: MenuItem[];
  query: string;
  onItemSelect: (item: MenuItem) => void;
  onClearSearch: () => void;
}

export function SearchResultsGrid({
  items,
  query,
  onItemSelect,
  onClearSearch,
}: SearchResultsGridProps) {
  if (items.length === 0) {
    return (
      <MenuEmptyState
        type="no-results"
        searchQuery={query}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className="px-4 pb-8 pt-6">
      <div className="mb-4">
        <h2 className="font-display text-xl text-foreground">
          Search Results
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({items.length} {items.length === 1 ? 'item' : 'items'} for "{query}")
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <ItemCard item={item} onSelect={onItemSelect} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## Test Plan

### Visual Testing

1. **Grid Responsiveness**
   - [ ] 1 column on mobile (<640px)
   - [ ] 2 columns on tablet (640-1024px)
   - [ ] 3 columns on desktop (1024-1280px)
   - [ ] 4 columns on large screens (>1280px)

2. **Section Headers**
   - [ ] Category name displays
   - [ ] Item count shows
   - [ ] Sticky behavior works

3. **Empty States**
   - [ ] "Menu Coming Soon" shows when no categories
   - [ ] "No Results" shows for empty search
   - [ ] Popular searches displayed

4. **Loading States**
   - [ ] Skeleton shows during fetch
   - [ ] Smooth transition to content

### Accessibility Testing

- [ ] Section landmarks (region/section)
- [ ] Headings hierarchy (h2 for categories)
- [ ] Skip links if needed

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Responsive grid layout (1/2/3/4 cols)
2. [ ] Category sections with headers
3. [ ] Sticky section headers
4. [ ] Item count in headers
5. [ ] Empty state: no menu
6. [ ] Empty state: no search results
7. [ ] Skeleton loading state
8. [ ] Search results grid
9. [ ] Smooth animations
10. [ ] `pnpm lint` passes
11. [ ] `pnpm typecheck` passes
12. [ ] `pnpm build` succeeds
13. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use `scroll-mt-20` for scroll margin to account for sticky header
- Section headers sticky at `top-[60px]` (below main tabs)
- Grid breakpoints: sm:640px, lg:1024px, xl:1280px
- Use `AnimatePresence` with `mode="popLayout"` for smooth transitions
- Empty state shows "popular searches" as helpful suggestions
- Stagger animation delay: `index * 0.05` for sections, `index * 0.03` for items

---

*Task ready for implementation*
