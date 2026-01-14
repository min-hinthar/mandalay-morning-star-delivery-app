# Task: V1-S1-005 — Search Component

> **Sprint**: 1 (Menu Browse)
> **Priority**: P1
> **Depends On**: V1-S1-001 (Menu Data Layer), V1-S1-004 (Menu Grid)
> **Branch**: `feat/menu-search`

---

## Objective

Create the menu search component with debounced input, real-time filtering, expandable mobile UI, and integration with the search API. Search should filter across name_en, name_my, and description_en fields.

---

## Acceptance Criteria

- [ ] Search input in header area
- [ ] Expandable on mobile (icon → full input)
- [ ] Debounce: 300ms delay before API call
- [ ] Searches: name_en, name_my, description_en
- [ ] Results update grid in real-time
- [ ] "No results" state with suggestions
- [ ] Clear button (X) resets to category view
- [ ] Loading indicator during search
- [ ] Keyboard accessible (Esc to close on mobile)
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Debounce Hook

Create `src/lib/hooks/useDebounce.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 2. SearchInput Component

Create `src/components/menu/SearchInput.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Search menu...',
}: SearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded on mobile
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        onClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onClear]);

  const handleClear = () => {
    onClear();
    if (window.innerWidth < 640) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="relative">
      {/* Mobile: Icon button that expands */}
      <div className="sm:hidden">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                aria-label="Open search"
                className="h-10 w-10"
              >
                <Search className="h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: 'calc(100vw - 120px)', opacity: 1 }}
              exit={{ width: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10 pr-10 h-10"
                />
                {(value || isLoading) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-0 top-0 h-10 w-10"
                    aria-label="Clear search"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Always visible input */}
      <div className="hidden sm:block">
        <div className="relative w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10 h-10"
          />
          {(value || isLoading) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-0 top-0 h-10 w-10"
              aria-label="Clear search"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. MenuHeader with Search

Create `src/components/menu/MenuHeader.tsx`:

```typescript
'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from './SearchInput';

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isSearching?: boolean;
  cartItemCount?: number;
  onCartClick?: () => void;
}

export function MenuHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
  cartItemCount = 0,
  onCartClick,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo/Title */}
        <h1 className="font-display text-xl text-brand-red whitespace-nowrap">
          Our Menu
        </h1>

        {/* Search + Cart */}
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearSearch}
            isLoading={isSearching}
            placeholder="Search dishes..."
          />

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative h-10 w-10"
            aria-label={`Shopping cart with ${cartItemCount} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-brand-red text-white text-xs"
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### 4. Integration with Menu Page

Update `src/components/menu/MenuContent.tsx`:

```typescript
'use client';

import { useState, useMemo, useCallback } from 'react';
import { MenuHeader } from './MenuHeader';
import { CategoryTabs } from './CategoryTabs';
import { MenuGrid } from './MenuGrid';
import { SearchResultsGrid } from './SearchResultsGrid';
import { ItemDetailModal } from './ItemDetailModal';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMenuSearch } from '@/lib/hooks/useMenu';
import { useScrollSpy } from '@/lib/hooks/useScrollSpy';
import type { MenuCategory, MenuItem } from '@/types/menu';

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search API call
  const { data: searchResults, isLoading: isSearching } = useMenuSearch(debouncedQuery);

  // Scroll spy for category tabs
  const sectionIds = useMemo(
    () => categories.map((c) => `category-${c.slug}`),
    [categories]
  );
  const activeSectionId = useScrollSpy(sectionIds);
  const activeCategory = activeSectionId?.replace('category-', '') ?? null;

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCategoryClick = useCallback((slug: string | null) => {
    // Clear search when clicking category
    setSearchQuery('');

    if (slug === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(`category-${slug}`);
    if (element) {
      const yOffset = -140; // Header + tabs
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  const handleItemSelect = useCallback((item: MenuItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Is search active?
  const isSearchMode = searchQuery.length > 0;

  return (
    <>
      <MenuHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching && isSearchMode}
      />

      {!isSearchMode && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {isSearchMode ? (
        <SearchResultsGrid
          items={searchResults?.data.items ?? []}
          query={debouncedQuery}
          onItemSelect={handleItemSelect}
          onClearSearch={handleClearSearch}
        />
      ) : (
        <MenuGrid
          categories={categories}
          onItemSelect={handleItemSelect}
        />
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={handleCloseModal}
      />
    </>
  );
}
```

---

## Test Plan

### Functional Testing

1. **Search Input**
   - [ ] Input accepts text
   - [ ] Debounce delays API call by 300ms
   - [ ] Clear button resets input
   - [ ] Loading spinner shows during fetch

2. **Mobile Expansion**
   - [ ] Icon click expands input
   - [ ] Input focuses on expand
   - [ ] Escape key closes
   - [ ] Clear closes on mobile

3. **Search Results**
   - [ ] Results display in grid
   - [ ] "No results" shows for no matches
   - [ ] Count shows in header

4. **Integration**
   - [ ] Category tabs hidden during search
   - [ ] Clicking category clears search
   - [ ] Items are clickable

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] SearchInput component created
2. [ ] Debounce hook (300ms) working
3. [ ] Mobile expandable UI
4. [ ] Desktop always-visible UI
5. [ ] Clear button resets search
6. [ ] Loading indicator shows
7. [ ] Results grid displays
8. [ ] "No results" state works
9. [ ] Keyboard navigation (Esc)
10. [ ] Category tabs hidden during search
11. [ ] `pnpm lint` passes
12. [ ] `pnpm typecheck` passes
13. [ ] `pnpm build` succeeds
14. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use `useDebounce` hook to delay API calls
- Mobile input expands from icon button (40px → full width)
- Desktop input always visible (w-64 lg:w-80)
- Clear search when clicking category tab
- Hide category tabs when in search mode
- `type="search"` enables native clear button on some browsers
- Consider `inputmode="search"` for mobile keyboards

---

*Task ready for implementation*
