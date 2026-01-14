# Task: V1-S1-001 — Menu Data Layer ✅

> **Sprint**: 1 (Menu Browse)
> **Priority**: P0
> **Depends On**: V0 completion
> **Branch**: `feat/menu-data-layer`
> **Status**: Complete (2026-01-14)

---

## Objective

Create the menu API routes and React Query hooks for fetching menu data. This establishes the data fetching foundation for all menu-related features. The API should return the complete menu structure with categories, items, modifier groups, and options.

---

## Acceptance Criteria

- [x] `GET /api/menu` returns full menu with categories and modifiers
- [x] `GET /api/menu/search?q=` returns filtered items
- [x] Response follows standard envelope pattern
- [x] React Query hooks (`useMenu`, `useMenuSearch`) created
- [x] Menu types defined in `types/menu.ts`
- [x] API responses are cached (5 min stale time)
- [x] Error states handled gracefully
- [x] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Menu Types

Create `src/types/menu.ts`:

```typescript
export interface ModifierOption {
  id: string;
  slug: string;
  name: string;
  priceDeltaCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  slug: string;
  name: string;
  selectionType: 'single' | 'multiple';
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  slug: string;
  nameEn: string;
  nameMy: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isActive: boolean;
  isSoldOut: boolean;
  tags: string[];
  allergens: string[];
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuResponse {
  data: {
    categories: MenuCategory[];
  };
  meta: {
    timestamp: string;
  };
}

export interface MenuSearchResponse {
  data: {
    items: MenuItem[];
    query: string;
    count: number;
  };
  meta: {
    timestamp: string;
  };
}
```

### 2. Menu API Route

Create `src/app/api/menu/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MenuCategory, MenuItem, ModifierGroup } from '@/types/menu';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('id, slug, name, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (catError) throw catError;

    // Fetch items with modifier groups
    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select(`
        id,
        slug,
        name_en,
        name_my,
        description_en,
        image_url,
        base_price_cents,
        is_active,
        is_sold_out,
        tags,
        allergens,
        category_id,
        item_modifier_groups (
          modifier_groups (
            id,
            slug,
            name,
            selection_type,
            min_select,
            max_select,
            modifier_options (
              id,
              slug,
              name,
              price_delta_cents,
              is_active,
              sort_order
            )
          )
        )
      `)
      .eq('is_active', true)
      .order('name_en');

    if (itemError) throw itemError;

    // Transform to response format
    const categoryMap = new Map<string, MenuCategory>();

    for (const cat of categories || []) {
      categoryMap.set(cat.id, {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        sortOrder: cat.sort_order,
        items: [],
      });
    }

    for (const item of items || []) {
      const category = categoryMap.get(item.category_id);
      if (!category) continue;

      // Transform modifier groups
      const modifierGroups: ModifierGroup[] = (item.item_modifier_groups || [])
        .map((img: any) => img.modifier_groups)
        .filter(Boolean)
        .map((mg: any) => ({
          id: mg.id,
          slug: mg.slug,
          name: mg.name,
          selectionType: mg.selection_type,
          minSelect: mg.min_select,
          maxSelect: mg.max_select,
          options: (mg.modifier_options || [])
            .filter((opt: any) => opt.is_active)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((opt: any) => ({
              id: opt.id,
              slug: opt.slug,
              name: opt.name,
              priceDeltaCents: opt.price_delta_cents,
              isActive: opt.is_active,
              sortOrder: opt.sort_order,
            })),
        }));

      const menuItem: MenuItem = {
        id: item.id,
        slug: item.slug,
        nameEn: item.name_en,
        nameMy: item.name_my,
        descriptionEn: item.description_en,
        imageUrl: item.image_url,
        basePriceCents: item.base_price_cents,
        isActive: item.is_active,
        isSoldOut: item.is_sold_out,
        tags: item.tags || [],
        allergens: item.allergens || [],
        modifierGroups,
      };

      category.items.push(menuItem);
    }

    const response: MenuResponse = {
      data: {
        categories: Array.from(categoryMap.values())
          .sort((a, b) => a.sortOrder - b.sortOrder),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } },
      { status: 500 }
    );
  }
}
```

### 3. Search API Route

Create `src/app/api/menu/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { MenuItem, ModifierGroup, MenuSearchResponse } from '@/types/menu';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = searchSchema.safeParse({ q: searchParams.get('q') });

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
        { status: 400 }
      );
    }

    const query = result.data.q.toLowerCase();
    const supabase = await createClient();

    // Search items by name_en, name_my, description_en
    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        slug,
        name_en,
        name_my,
        description_en,
        image_url,
        base_price_cents,
        is_active,
        is_sold_out,
        tags,
        allergens,
        category_id,
        item_modifier_groups (
          modifier_groups (
            id,
            slug,
            name,
            selection_type,
            min_select,
            max_select,
            modifier_options (
              id,
              slug,
              name,
              price_delta_cents,
              is_active,
              sort_order
            )
          )
        )
      `)
      .eq('is_active', true)
      .or(`name_en.ilike.%${query}%,name_my.ilike.%${query}%,description_en.ilike.%${query}%`)
      .order('name_en');

    if (error) throw error;

    // Transform items
    const menuItems: MenuItem[] = (items || []).map((item: any) => {
      const modifierGroups: ModifierGroup[] = (item.item_modifier_groups || [])
        .map((img: any) => img.modifier_groups)
        .filter(Boolean)
        .map((mg: any) => ({
          id: mg.id,
          slug: mg.slug,
          name: mg.name,
          selectionType: mg.selection_type,
          minSelect: mg.min_select,
          maxSelect: mg.max_select,
          options: (mg.modifier_options || [])
            .filter((opt: any) => opt.is_active)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((opt: any) => ({
              id: opt.id,
              slug: opt.slug,
              name: opt.name,
              priceDeltaCents: opt.price_delta_cents,
              isActive: opt.is_active,
              sortOrder: opt.sort_order,
            })),
        }));

      return {
        id: item.id,
        slug: item.slug,
        nameEn: item.name_en,
        nameMy: item.name_my,
        descriptionEn: item.description_en,
        imageUrl: item.image_url,
        basePriceCents: item.base_price_cents,
        isActive: item.is_active,
        isSoldOut: item.is_sold_out,
        tags: item.tags || [],
        allergens: item.allergens || [],
        modifierGroups,
      };
    });

    const response: MenuSearchResponse = {
      data: {
        items: menuItems,
        query: result.data.q,
        count: menuItems.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Menu search error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search menu' } },
      { status: 500 }
    );
  }
}
```

### 4. React Query Setup

Install React Query:

```bash
pnpm add @tanstack/react-query
```

Create `src/lib/providers/query-provider.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Update `src/app/providers.tsx` to include QueryProvider.

### 5. Menu Hooks

Create `src/lib/hooks/useMenu.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import type { MenuResponse, MenuSearchResponse } from '@/types/menu';

export function useMenu() {
  return useQuery<MenuResponse>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMenuSearch(query: string) {
  return useQuery<MenuSearchResponse>({
    queryKey: ['menu', 'search', query],
    queryFn: async () => {
      const res = await fetch(`/api/menu/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search menu');
      return res.json();
    },
    enabled: query.length > 0,
    staleTime: 60 * 1000, // 1 minute for search results
  });
}
```

---

## Test Plan

### API Tests

```bash
# Test menu endpoint
curl http://localhost:3000/api/menu | jq '.data.categories | length'
# Expected: 8 categories

# Test search endpoint
curl "http://localhost:3000/api/menu/search?q=chicken" | jq '.data.count'
# Expected: Items containing "chicken"

# Test invalid search
curl "http://localhost:3000/api/menu/search?q=" | jq '.error.code'
# Expected: "VALIDATION_ERROR"
```

### Hook Tests

```typescript
// Test useMenu hook returns data
// Test useMenuSearch hook with query
// Test error handling
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [x] Menu types defined in `src/types/menu.ts`
2. [x] `GET /api/menu` returns all categories with items
3. [x] `GET /api/menu/search` returns filtered results
4. [x] Response envelope pattern used
5. [x] Zod validation on search endpoint
6. [x] React Query provider configured
7. [x] `useMenu` hook works correctly
8. [x] `useMenuSearch` hook works correctly
9. [x] API returns modifiers with items
10. [x] Error handling implemented
11. [x] `pnpm lint` passes
12. [x] `pnpm typecheck` passes
13. [x] `pnpm build` succeeds
14. [x] `docs/project_status.md` updated, completion percentage updated

---

## Notes for Codex

- Use `createClient` from `@/lib/supabase/server` for API routes
- Transform snake_case DB fields to camelCase in response
- Modifier options must be sorted by `sort_order`
- Only return active items and options
- The `item_modifier_groups` join table links items to modifier groups
- Edge caching via `export const revalidate = 300`

---

*Task ready for implementation*
