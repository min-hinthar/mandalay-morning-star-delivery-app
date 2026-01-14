# Task: V1-S1-002 — Category Tabs Component

> **Sprint**: 1 (Menu Browse)
> **Priority**: P0
> **Depends On**: V1-S1-001 (Menu Data Layer)
> **Branch**: `feat/category-tabs-v1`

---

## Objective

Enhance the category tabs component from V0 with improved UX: "All" pseudo-tab, better sticky behavior, scroll-spy synchronization, and refined visual polish. Tabs should work seamlessly on mobile (horizontal scroll) and desktop.

---

## Acceptance Criteria

- [ ] "All" pseudo-tab shows all items (first tab)
- [ ] Horizontal scrollable tabs on mobile
- [ ] Sticky below header on scroll (top: 0)
- [ ] Active tab visually highlighted (brand-red background)
- [ ] Clicking tab scrolls to corresponding section
- [ ] Scroll position updates active tab (scroll-spy)
- [ ] Active tab auto-scrolls into view
- [ ] Order matches `sortOrder` from API
- [ ] Only active categories displayed
- [ ] Touch targets minimum 44px
- [ ] Smooth scroll behavior
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Enhanced CategoryTabs Component

Update `src/components/menu/CategoryTabs.tsx`:

```typescript
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { MenuCategory } from '@/types/menu';

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string | null; // null = "All"
  onCategoryClick: (slug: string | null) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryTabsProps) {
  const tabRefs = useRef<Map<string | null, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeCategory);
    const container = containerRef.current;

    if (activeTab && container) {
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if tab is out of view
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeCategory]);

  const setTabRef = useCallback(
    (slug: string | null) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(slug, el);
      }
    },
    []
  );

  // All categories plus "All" tab
  const tabs = [
    { slug: null, name: 'All' },
    ...categories.map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeCategory === tab.slug;
          return (
            <motion.button
              key={tab.slug ?? 'all'}
              ref={setTabRef(tab.slug)}
              onClick={() => onCategoryClick(tab.slug)}
              className={cn(
                'relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium',
                'min-h-[44px] min-w-[44px]', // Touch target
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
                isActive
                  ? 'text-white'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              )}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-brand-red rounded-full"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{tab.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

### 2. Scroll-Spy Hook

Create `src/lib/hooks/useScrollSpy.ts`:

```typescript
import { useEffect, useState, useRef } from 'react';

interface UseScrollSpyOptions {
  offset?: number;
  rootMargin?: string;
}

export function useScrollSpy(
  sectionIds: string[],
  options: UseScrollSpyOptions = {}
) {
  const { offset = 100 } = options;
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      // Find the section that's currently in view
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveId(id);
            return;
          }
        }
      }

      // If at top, show "All"
      if (window.scrollY < 100) {
        setActiveId(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, offset]);

  return activeId;
}
```

### 3. Integration with MenuContent

Update `src/components/menu/MenuContent.tsx` to use enhanced tabs:

```typescript
'use client';

import { useCallback, useMemo } from 'react';
import { CategoryTabs } from './CategoryTabs';
import { MenuSection } from './MenuSection';
import { useScrollSpy } from '@/lib/hooks/useScrollSpy';
import type { MenuCategory } from '@/types/menu';

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const sectionIds = useMemo(
    () => categories.map((c) => `category-${c.slug}`),
    [categories]
  );

  const activeSectionId = useScrollSpy(sectionIds);

  // Convert section ID back to category slug
  const activeCategory = activeSectionId
    ? activeSectionId.replace('category-', '')
    : null;

  const scrollToCategory = useCallback((slug: string | null) => {
    if (slug === null) {
      // "All" tab - scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(`category-${slug}`);
    if (element) {
      const yOffset = -80; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
      />

      <div className="px-4 pb-8 pt-2">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            id={`category-${category.slug}`}
            category={category}
          />
        ))}
      </div>
    </>
  );
}
```

### 4. Styling Updates

Add to `src/app/globals.css`:

```css
/* Hide scrollbar for category tabs */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## Test Plan

### Visual Testing

1. **"All" Tab**
   - [ ] "All" is first tab
   - [ ] Clicking "All" scrolls to top
   - [ ] "All" is active when at top of page

2. **Tab Behavior**
   - [ ] All 8 category tabs visible
   - [ ] Active tab highlighted with brand-red
   - [ ] Horizontal scroll works on mobile
   - [ ] Tabs stay sticky on scroll

3. **Scroll-Spy**
   - [ ] Scrolling updates active tab
   - [ ] Active tab scrolls into view automatically

4. **Animations**
   - [ ] Smooth background transition between tabs
   - [ ] Scale animation on tap

### Accessibility Testing

- [ ] Tabs focusable via keyboard
- [ ] Focus ring visible
- [ ] Tab role and aria attributes

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] "All" pseudo-tab implemented
2. [ ] Horizontal scroll on mobile
3. [ ] Sticky positioning works
4. [ ] Active tab styling with Framer Motion
5. [ ] Scroll-spy updates active tab
6. [ ] Active tab auto-scrolls into view
7. [ ] Touch targets ≥ 44px
8. [ ] Keyboard accessible
9. [ ] `pnpm lint` passes
10. [ ] `pnpm typecheck` passes
11. [ ] `pnpm build` succeeds
12. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use `layoutId` for shared layout animation (active tab background)
- The "All" tab uses `null` as its slug value
- Section IDs should be `category-{slug}` format
- Scroll-spy offset accounts for sticky header height (80px)
- Use `backdrop-blur-sm` for modern sticky header look
- Respect `prefers-reduced-motion` for accessibility

---

*Task ready for implementation*
