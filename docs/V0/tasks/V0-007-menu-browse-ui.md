# Task: V0-007 — Menu Browse UI

> **Priority**: P1
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-006 (Menu Seeding)
> **Branch**: `project-init`

---

## Objective

Build the menu browse page at `/menu` with category tabs, item cards grid, and responsive mobile-first design. Users should be able to browse all 47 items across 8 categories with smooth scrolling between sections.

---

## Acceptance Criteria

- [ ] Menu page at `/menu` loads all items from database
- [ ] 8 category tabs visible in sticky header
- [ ] Tab click scrolls to corresponding section
- [ ] All 47 items render in correct categories
- [ ] Item cards show: name (EN/MY), price, allergen badges
- [ ] Sold out items visually distinct
- [ ] Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] Loading skeletons during data fetch
- [ ] Page loads < 3s on throttled 3G
- [ ] Mobile touch targets minimum 44px
- [ ] Smooth scroll behavior

---

## Technical Specification

### 1. Menu Data Fetching

Create `src/lib/queries/menu.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export interface MenuItem {
  id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  category: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export async function getMenuWithCategories(): Promise<MenuCategory[]> {
  const supabase = await createClient();

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("id, slug, name, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (catError) throw catError;

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select(`
      id,
      slug,
      name_en,
      name_my,
      description_en,
      base_price_cents,
      image_url,
      is_sold_out,
      allergens,
      tags,
      category_id
    `)
    .eq("is_active", true)
    .order("name_en");

  if (itemError) throw itemError;

  // Group items by category
  const categoryMap = new Map<string, MenuCategory>();

  for (const cat of categories || []) {
    categoryMap.set(cat.id, {
      ...cat,
      items: [],
    });
  }

  for (const item of items || []) {
    const category = categoryMap.get(item.category_id);
    if (category) {
      category.items.push({
        ...item,
        category: {
          id: category.id,
          slug: category.slug,
          name: category.name,
        },
      });
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.sort_order - b.sort_order);
}
```

### 2. Menu Page

Update `src/app/(public)/menu/page.tsx`:

```typescript
import { Suspense } from "react";
import { getMenuWithCategories } from "@/lib/queries/menu";
import { MenuContent } from "@/components/menu/menu-content";
import { MenuSkeleton } from "@/components/menu/menu-skeleton";

export const metadata = {
  title: "Menu | Mandalay Morning Star",
  description: "Browse our authentic Burmese menu - 47 dishes across 8 categories",
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<MenuSkeleton />}>
        <MenuLoader />
      </Suspense>
    </main>
  );
}

async function MenuLoader() {
  const categories = await getMenuWithCategories();
  return <MenuContent categories={categories} />;
}
```

### 3. Menu Content Component

Create `src/components/menu/menu-content.tsx`:

```typescript
"use client";

import { useRef, useState, useEffect } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { CategoryTabs } from "./category-tabs";
import { MenuSection } from "./menu-section";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug || "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Track scroll position to update active tab
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for sticky header

      for (const category of categories) {
        const element = sectionRefs.current.get(category.slug);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category.slug);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const scrollToCategory = (slug: string) => {
    const element = sectionRefs.current.get(slug);
    if (element) {
      const yOffset = -80; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const setSectionRef = (slug: string) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(slug, el);
    }
  };

  return (
    <>
      {/* Sticky Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
      />

      {/* Menu Sections */}
      <div className="px-4 pb-8 pt-2">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            category={category}
            ref={setSectionRef(category.slug)}
          />
        ))}
      </div>
    </>
  );
}
```

### 4. Category Tabs Component

Create `src/components/menu/category-tabs.tsx`:

```typescript
"use client";

import { useRef, useEffect } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { cn } from "@/lib/utils/cn";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryClick }: CategoryTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeCategory);
    const container = containerRef.current;

    if (activeTab && container) {
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      // Check if tab is out of view
      if (tabLeft < scrollLeft || tabLeft + tabWidth > scrollLeft + containerWidth) {
        container.scrollTo({
          left: tabLeft - containerWidth / 2 + tabWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-gray-200">
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            ref={(el) => {
              if (el) tabRefs.current.set(category.slug, el);
            }}
            onClick={() => onCategoryClick(category.slug)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              "min-h-[44px] min-w-[44px]", // Touch target
              activeCategory === category.slug
                ? "bg-brand-red text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 5. Menu Section Component

Create `src/components/menu/menu-section.tsx`:

```typescript
import { forwardRef } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { MenuItemCard } from "./menu-item-card";

interface MenuSectionProps {
  category: MenuCategory;
}

export const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  function MenuSection({ category }, ref) {
    return (
      <section ref={ref} id={category.slug} className="pt-6">
        <h2 className="text-xl font-display text-brand-red mb-4 sticky top-[60px] bg-background py-2 z-[5]">
          {category.name}
          <span className="text-sm font-normal text-muted ml-2">
            ({category.items.length})
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  }
);
```

### 6. Menu Item Card Component

Create `src/components/menu/menu-item-card.tsx`:

```typescript
import Image from "next/image";
import { MenuItem } from "@/lib/queries/menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface MenuItemCardProps {
  item: MenuItem;
}

// Allergen display mapping
const allergenLabels: Record<string, string> = {
  peanuts: "Peanuts",
  tree_nuts: "Tree Nuts",
  egg: "Egg",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  gluten_wheat: "Gluten",
  sesame: "Sesame",
  dairy: "Dairy",
};

export function MenuItemCard({ item }: MenuItemCardProps) {
  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        item.is_sold_out && "opacity-60"
      )}
    >
      {/* Image placeholder - will add real images later */}
      {item.image_url ? (
        <div className="relative h-40 bg-gray-100">
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {item.is_sold_out && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Sold Out</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-gold/20 to-brand-red/10 flex items-center justify-center">
          {item.is_sold_out ? (
            <span className="text-muted font-medium">Sold Out</span>
          ) : (
            <span className="text-4xl">🍜</span>
          )}
        </div>
      )}

      <CardContent className="p-4">
        {/* Name */}
        <div className="mb-2">
          <h3 className="font-medium text-foreground leading-tight">
            {item.name_en}
          </h3>
          {item.name_my && (
            <p className="text-sm text-muted font-burmese">{item.name_my}</p>
          )}
        </div>

        {/* Description */}
        {item.description_en && (
          <p className="text-sm text-muted line-clamp-2 mb-3">
            {item.description_en}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-red">
            {formatPrice(item.base_price_cents)}
          </span>

          {item.is_sold_out && (
            <Badge variant="secondary" className="bg-gray-200">
              Sold Out
            </Badge>
          )}
        </div>

        {/* Allergens */}
        {hasAllergens && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.allergens.map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs bg-amber-50 text-amber-700 border-amber-200"
              >
                {allergenLabels[allergen] || allergen}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 7. Menu Skeleton Component

Create `src/components/menu/menu-skeleton.tsx`:

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function MenuSkeleton() {
  return (
    <div>
      {/* Tab skeleton */}
      <div className="sticky top-0 z-10 bg-background border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-4 pb-8 pt-6">
        {[...Array(3)].map((_, sectionIdx) => (
          <div key={sectionIdx} className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, cardIdx) => (
                <div key={cardIdx} className="rounded-lg border p-4">
                  <Skeleton className="h-32 w-full mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8. Export Components

Create `src/components/menu/index.ts`:

```typescript
export { MenuContent } from "./menu-content";
export { CategoryTabs } from "./category-tabs";
export { MenuSection } from "./menu-section";
export { MenuItemCard } from "./menu-item-card";
export { MenuSkeleton } from "./menu-skeleton";
```

### 9. Add Burmese Font Support

Update `src/app/layout.tsx` to include Padauk font:

```typescript
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Add to globals.css or as inline style
// .font-burmese { font-family: 'Padauk', sans-serif; }
```

Add to `src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Padauk:wght@400;700&display=swap');

.font-burmese {
  font-family: 'Padauk', sans-serif;
}
```

---

## Test Plan

### Visual Testing

1. **Category Tabs**
   - [ ] All 8 tabs visible
   - [ ] Active tab highlighted
   - [ ] Horizontal scroll on mobile
   - [ ] Tabs stay sticky on scroll

2. **Item Cards**
   - [ ] Name displays in English
   - [ ] Burmese name displays below
   - [ ] Price formatted correctly ($X.XX)
   - [ ] Allergen badges visible
   - [ ] Sold out styling applied

3. **Grid Layout**
   - [ ] 1 column on mobile (<640px)
   - [ ] 2 columns on tablet (640-1024px)
   - [ ] 3 columns on desktop (>1024px)

4. **Navigation**
   - [ ] Tab click scrolls to section
   - [ ] Scroll updates active tab
   - [ ] Smooth scroll behavior

### Performance Testing

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000/menu --view

# Check load time with throttling
# Chrome DevTools > Network > Slow 3G
# Page should load < 3s
```

### Data Verification

- [ ] All 47 items render
- [ ] Items in correct categories
- [ ] Prices match seed data
- [ ] Allergens display correctly

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Menu page loads all data from database
2. [ ] 8 category tabs in sticky header
3. [ ] All 47 items render correctly
4. [ ] Responsive grid layout works
5. [ ] Tab click scrolls to section
6. [ ] Scroll updates active tab
7. [ ] Allergen badges display
8. [ ] Sold out items styled differently
9. [ ] Loading skeleton shows during fetch
10. [ ] Burmese text renders correctly
11. [ ] Mobile touch targets ≥44px
12. [ ] Page loads < 3s on slow connection
13. [ ] `pnpm lint` passes
14. [ ] `pnpm typecheck` passes
15. [ ] `pnpm build` succeeds
16. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use Server Components for data fetching (no useEffect for initial load)
- Client Components only for interactivity (tabs, scroll tracking)
- The `forwardRef` pattern allows parent to track section positions
- Allergen mapping handles database values to display labels
- Images are optional for V0; placeholder gradient used
- Smooth scroll behavior respects user motion preferences

---

## Future Enhancements (V1)

- Item detail modal with modifiers
- Add to cart button
- Search/filter functionality
- Real food images
- Popular/featured badges

---

*Task created: 2026-01-12 | Ready for implementation*
