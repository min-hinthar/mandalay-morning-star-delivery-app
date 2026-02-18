# Phase 55: Search Enhancement - Research

**Researched:** 2026-02-10
**Domain:** Client-side fuzzy search, cmdk command palette, search UX
**Confidence:** HIGH

## Summary

The existing CommandPalette uses `cmdk@1.1.1` with `shouldFilter={false}` and manual `.includes()` filtering. The menu has ~78 items across 8 categories -- small enough for client-side fuzzy search. Menu data is already loaded into memory via `useMenu()` (React Query, 5-min stale time) and passed as flat `MenuItem[]` to the palette.

The recommended approach: integrate **Fuse.js** as the fuzzy matching engine, keep `shouldFilter={false}` on cmdk, and pipe Fuse results into the existing Command.List structure. This gives typo tolerance ("mohiga" -> "Mohinga") without a server round-trip. The existing `useRecentSearches` hook and empty-state patterns are solid foundations to build on.

Order history search requires a separate data fetch (user's orders from Supabase) since order data is not preloaded like menu data. A lightweight client-side search over the user's order item names (name_snapshot field) is sufficient.

**Primary recommendation:** Use Fuse.js 7.x for client-side fuzzy matching on the already-loaded menu data, enhance the existing CommandPalette component in-place, add category tabs within the results area, and upgrade result cards to the rich layout described in CONTEXT.md.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Rich card layout (not compact list rows)
- Each card shows: food thumbnail (64px medium), item name, base price, category tag badge, dietary/spice tags
- Sold-out items appear grayed out with "Sold out" badge (not hidden)
- Background highlight on matched text (accent/yellow background on the matched portion)
- Staggered fade-in animation for results appearing
- 8-10 results visible before scrolling
- Tapping a result navigates to item detail page (not quick-add)
- Base price only (no "from $X" modifier ranges)
- Show popularity indicator ("Popular" / "Bestseller" badge) on top items
- Category-based emoji fallback when thumbnail is missing/loading
- Skeleton card loading state while results compute
- Search fields: name + description + category + ingredients/allergens
- Live as-you-type with ~100-150ms debounce (nearly instant)
- Support both Burmese script and English transliteration input
- No phonetic matching -- fuzzy is sufficient
- Tabbed categories at top of results (not section headers)
- Default "All" tab shows all results
- Only categories with matching results shown as tabs (no empty categories)
- Horizontal scroll for tab overflow
- Active tab has filled/solid primary-color background
- Fade crossfade animation when switching category tabs
- Keep existing CommandPalette trigger (enhance results, not entry point)
- Auto-focus on open (keyboard appears immediately)
- Clear button (X) inside search input
- Recent searches stored and shown (last 5-10) when search opened with empty input
- Initial state: recent searches + popular items
- Individual recent search delete via swipe/X + "Clear all" option
- Search state persists when navigating to item detail and coming back
- Search scope: menu items + order history
- Order history results in separate "From your orders" section below menu results
- Empty state: "No results" message + popular items to browse
- Dismiss behavior: based on existing overlay patterns
- Keyboard navigation: based on existing keyboard support
- Recent search tap behavior: re-run vs fill input (Claude's Discretion)

### Claude's Discretion

- Search overlay visual style (full-screen vs dropdown -- based on existing CommandPalette)
- Theme treatment (inherit app theme or dark overlay)
- Fuzzy matching library and tuning parameters
- Client-side vs server-side matching decision
- Result ranking algorithm (name-first priority vs combined relevance score)
- Partial and multi-word matching strategies
- Score threshold for filtering low-quality matches
- Burmese script fuzzy tolerance level
- Tab result counts display
- Tab ordering (menu order vs match count)
- "All" tab internal grouping
- Keyboard navigation support
- Recent search tap behavior
- Voice search inclusion
- Dismiss methods

### Deferred Ideas (OUT OF SCOPE)

- Browse-by-category mode (tapping category tabs without a query) -- could be its own phase
- Full ingredient/allergen filtering (dedicated allergy filter UI) -- separate from text search
  </user_constraints>

## Standard Stack

### Core

| Library       | Version                     | Purpose                  | Why Standard                                                                                                                                                                                               |
| ------------- | --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fuse.js       | 7.1.0                       | Client-side fuzzy search | Zero-dependency, ~5kB gzipped, battle-tested for small-to-medium datasets. Supports weighted keys, match highlighting, configurable threshold. Standard choice for client-side fuzzy search in React apps. |
| cmdk          | 1.1.1 (already installed)   | Command palette shell    | Already in use. `shouldFilter={false}` mode lets us inject Fuse results while keeping keyboard navigation and accessibility.                                                                               |
| framer-motion | 12.26.1 (already installed) | Animations               | Already in use for stagger, fade, spring animations throughout the app.                                                                                                                                    |

### Supporting

| Library               | Version                    | Purpose             | When to Use                                                                                       |
| --------------------- | -------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| @tanstack/react-query | 5.90.1 (already installed) | Order history fetch | Already used for menu data. Use for fetching user's order history for "From your orders" section. |

### Alternatives Considered

| Instead of         | Could Use                    | Tradeoff                                                                                                                                              |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuse.js            | MiniSearch                   | MiniSearch is faster for large datasets (10k+), but more complex API. For ~78 items, Fuse.js is simpler and sufficient.                               |
| Fuse.js            | FlexSearch                   | Better raw performance but larger bundle (~15kB), more complex tokenizer config. Overkill for this menu size.                                         |
| Client-side search | Server-side Supabase `ilike` | Current `/api/menu/search` route uses `ilike` -- no fuzzy/typo tolerance. Would need pg_trgm extension. Client-side avoids latency and works offline. |

**Installation:**

```bash
pnpm add fuse.js
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── search/
│       ├── index.ts                    # Barrel exports
│       ├── use-fuzzy-search.ts         # useFuzzySearch hook (Fuse.js wrapper)
│       ├── search-config.ts            # Fuse.js configuration constants
│       └── category-helpers.ts         # Category grouping/filtering utilities
├── components/ui/search/
│   └── CommandPalette/
│       ├── index.ts                    # Updated barrel
│       ├── CommandPalette.tsx           # Enhanced main component
│       ├── SearchInput.tsx             # Keep existing (add clear button)
│       ├── SearchResults.tsx           # Rewrite: rich cards, match highlighting
│       ├── SearchResultCard.tsx        # NEW: individual rich result card
│       ├── SearchCategoryTabs.tsx      # NEW: result category tabs
│       ├── SearchEmptyState.tsx        # Enhanced: recent + popular + no results
│       ├── SearchOrderHistory.tsx      # NEW: "From your orders" section
│       └── SearchSkeleton.tsx          # NEW: skeleton loading cards
```

### Pattern 1: Fuse.js with cmdk shouldFilter={false}

**What:** Use Fuse.js for matching, pipe results into cmdk's Command.List with manual filtering.
**When to use:** When cmdk's built-in filter is insufficient (no fuzzy/typo tolerance).
**Example:**

```typescript
// Source: Context7 /websites/fusejs_io + /pacocoursey/cmdk
import Fuse from 'fuse.js';
import { Command } from 'cmdk';

const fuse = new Fuse(menuItems, {
  keys: [
    { name: 'nameEn', weight: 3 },
    { name: 'nameMy', weight: 2 },
    { name: 'descriptionEn', weight: 1 },
    { name: 'tags', weight: 0.5 },
    { name: 'allergens', weight: 0.5 },
  ],
  threshold: 0.4,
  distance: 200,
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
});

// In component:
<Command shouldFilter={false}>
  <Command.Input value={query} onValueChange={setQuery} />
  <Command.List>
    {fuseResults.map(result => (
      <Command.Item key={result.item.id} value={result.item.nameEn}>
        <SearchResultCard item={result.item} matches={result.matches} />
      </Command.Item>
    ))}
  </Command.List>
</Command>
```

### Pattern 2: Category Grouping from Fuse Results

**What:** Post-process Fuse results to group by category, derive tab list from matched items.
**When to use:** For the tabbed category filter within search results.
**Example:**

```typescript
// Derive categories from search results
const groupedResults = useMemo(() => {
  const groups = new Map<string, FuseResult<MenuItem>[]>();
  for (const result of fuseResults) {
    const catId = result.item.categoryId; // Need to add to MenuItem or derive from menuData
    if (!groups.has(catId)) groups.set(catId, []);
    groups.get(catId)!.push(result);
  }
  return groups;
}, [fuseResults]);

// Only show tabs for categories with results
const activeTabs = categories.filter((c) => groupedResults.has(c.id));
```

### Pattern 3: Match Highlighting with Fuse includeMatches

**What:** Use Fuse.js `matches` array to highlight matching text with background color.
**When to use:** For the "accent/yellow background on the matched portion" requirement.
**Example:**

```typescript
// Source: Fuse.js docs - includeMatches option
function HighlightedText({ text, matches, fieldKey }: Props) {
  const fieldMatches = matches?.filter(m => m.key === fieldKey) ?? [];
  if (fieldMatches.length === 0) return <>{text}</>;

  const indices = fieldMatches.flatMap(m => m.indices);
  // Sort and merge overlapping ranges
  const merged = mergeRanges(indices);

  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  for (const [start, end] of merged) {
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <mark key={start} className="bg-amber-200 dark:bg-amber-800/50 rounded px-0.5">
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
```

### Pattern 4: Enriching MenuItem with Category Info

**What:** The current `MenuItem` type has no `categoryId` or `categoryName`. The flat `menuItems` array in AppHeader loses category context.
**When to use:** Category tabs in search results need category info per item.
**How to solve:** Either:

- (a) Add `categoryId` + `categoryName` to the `MenuItem` type and populate when flattening in AppHeader, or
- (b) Pass the full `categories` array to CommandPalette instead of flat `menuItems`, and derive both the flat list and category map inside the component.

**Recommendation:** Option (b) -- pass `categories: MenuCategory[]` to CommandPalette. This preserves category relationships and avoids type changes.

```typescript
// In AppHeader:
const categories = menuData?.data?.categories ?? [];

<CommandPalette
  open={isPaletteOpen}
  onOpenChange={(open) => !open && closePalette()}
  categories={categories}  // Changed from menuItems
/>

// In CommandPalette:
const menuItems = useMemo(
  () => categories.flatMap(c => c.items.map(item => ({ ...item, _categoryName: c.name, _categorySlug: c.slug }))),
  [categories]
);
```

### Pattern 5: Search State Persistence Across Navigation

**What:** User searches, taps a result (navigates to item detail), presses back, and expects search state intact.
**When to use:** Required by "Search state persists when navigating to item detail and coming back."
**How:** Don't close the palette on item select. Instead, push the item detail route with the palette staying open in the background, or use a sheet/modal for item detail that overlays the search. The current pattern navigates via `router.push('/menu?item=slug')` which closes the palette.

**Recommendation:** Change the item select handler to open the `ItemDetailSheet` directly (like MenuContent does) rather than navigating. This keeps the palette open underneath the sheet. When the sheet closes, the user is back in the search palette with their query intact.

### Anti-Patterns to Avoid

- **Server-side search for menu items:** The menu data is already loaded client-side via `useMenu()`. Adding a server round-trip per keystroke adds latency and defeats offline support. Use Fuse.js client-side.
- **Re-creating Fuse instance on every render:** Fuse index construction is O(n). Use `useMemo` with `menuItems` as dependency.
- **Searching with cmdk's built-in filter:** cmdk uses basic string matching (similar to `.includes()`). It has no fuzzy/typo tolerance. Must use `shouldFilter={false}`.
- **Applying debounce to Fuse.js:** Fuse.js on ~78 items completes in <1ms. Debounce adds perceived latency. Only debounce if we add server-side order history search.

## Don't Hand-Roll

| Problem                     | Don't Build                      | Use Instead                               | Why                                                                           |
| --------------------------- | -------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Fuzzy string matching       | Custom Levenshtein/edit-distance | Fuse.js                                   | Scoring, weighting, match indices, threshold tuning -- hundreds of edge cases |
| Match highlighting          | Custom regex-based highlight     | Fuse.js `includeMatches` + indices        | Handles overlapping matches, multi-field matches, Unicode properly            |
| Command palette a11y        | Custom keyboard navigation       | cmdk (already used)                       | Arrow key navigation, screen reader support, focus management built-in        |
| Search debouncing           | Custom setTimeout logic          | `useDebounce` hook (already exists)       | SSR-safe, cleanup on unmount, already in codebase                             |
| Recent searches persistence | Custom storage logic             | `useRecentSearches` hook (already exists) | localStorage with SSR guard, dedup, max limit -- already built                |

**Key insight:** The two hardest parts (fuzzy matching + a11y command palette) are already solved by Fuse.js and cmdk. The implementation work is integration and UI enhancement.

## Common Pitfalls

### Pitfall 1: Fuse.js threshold too strict for Burmese dish names

**What goes wrong:** "mohiga" doesn't match "Mohinga" because the default threshold (0.6) is too strict for short words with transposition errors.
**Why it happens:** Fuse.js scoring is sensitive to string length. Short strings (5-8 chars) need a more lenient threshold.
**How to avoid:** Use `threshold: 0.4` + `ignoreLocation: true` + `distance: 200`. Test with specific Burmese dish name typos: "mohiga"->"Mohinga", "lahpet"->"Laphet", "kyayo"->"Kyay-O".
**Warning signs:** Primary success criterion test fails ("mohiga" doesn't find "Mohinga").

### Pitfall 2: Category info lost when flattening menuItems

**What goes wrong:** The current code flattens `categories.flatMap(c => c.items)` in AppHeader, losing which category each item belongs to.
**Why it happens:** `MenuItem` type has no `categoryId` or `categoryName` field.
**How to avoid:** Pass full `categories[]` to CommandPalette. Derive a `categoryMap` inside the component for O(1) lookups.
**Warning signs:** Category tabs can't be populated because items have no category reference.

### Pitfall 3: Fuse.js index recreation on every search

**What goes wrong:** Performance degrades with repeated Fuse instantiation.
**Why it happens:** Creating `new Fuse(items, options)` in render or effect without memoization.
**How to avoid:** Memoize: `const fuse = useMemo(() => new Fuse(items, config), [items])`. Only recreate when menu data changes.
**Warning signs:** React DevTools shows unnecessary re-renders, search feels sluggish.

### Pitfall 4: Order history requires auth-gated fetch

**What goes wrong:** Order history search fails for unauthenticated users or shows stale data.
**Why it happens:** Order data is not preloaded like menu data. Requires authenticated Supabase query.
**How to avoid:** Use React Query with `enabled: !!user` guard. Show "Sign in to search your orders" message for unauthenticated users. Cache order items separately from the full orders list.
**Warning signs:** 401 errors in console, empty "From your orders" section when logged in.

### Pitfall 5: Search state lost on item navigation

**What goes wrong:** User searches, taps a result, gets redirected to `/menu?item=slug`, palette closes, search query is cleared.
**Why it happens:** Current `handleSelectItem` calls `router.push()` which triggers route change, and `handleOpenChange(false)` which resets query to "".
**How to avoid:** Open item detail as a sheet overlay on top of the search palette, instead of navigating. Keep palette open with query intact.
**Warning signs:** Users have to re-type their search after viewing an item and going back.

### Pitfall 6: Mobile Safari backdrop-blur crashes

**What goes wrong:** Adding backdrop-blur to the search results area crashes Mobile Safari.
**Why it happens:** Known issue documented in codebase (see existing MOBILE CRASH PREVENTION comments).
**How to avoid:** Follow existing pattern: `sm:backdrop-blur-xl` (blur only on desktop). Use solid background on mobile.
**Warning signs:** Safari freezes or goes white on iOS.

## Code Examples

### Fuse.js Search Hook

```typescript
// Source: Fuse.js docs (Context7 /websites/fusejs_io)
import Fuse from "fuse.js";
import { useMemo } from "react";
import type { MenuItem, MenuCategory } from "@/types/menu";

export interface EnrichedMenuItem extends MenuItem {
  _categoryName: string;
  _categorySlug: string;
}

export interface FuseSearchResult {
  item: EnrichedMenuItem;
  score?: number;
  matches?: readonly Fuse.FuseResultMatch[];
}

const FUSE_CONFIG: Fuse.IFuseOptions<EnrichedMenuItem> = {
  keys: [
    { name: "nameEn", weight: 3 },
    { name: "nameMy", weight: 2 },
    { name: "descriptionEn", weight: 1 },
    { name: "_categoryName", weight: 0.5 },
    { name: "tags", weight: 0.5 },
    { name: "allergens", weight: 0.5 },
  ],
  threshold: 0.4, // Lenient for short Burmese names
  distance: 200, // Allow matches anywhere in string
  ignoreLocation: true, // Don't penalize by position
  includeMatches: true, // For highlight indices
  includeScore: true, // For score-based filtering
  minMatchCharLength: 2, // Skip single-char queries
  shouldSort: true, // Sort by relevance score
};

export function useFuzzySearch(categories: MenuCategory[]) {
  // Enrich items with category info
  const enrichedItems = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({
          ...item,
          _categoryName: cat.name,
          _categorySlug: cat.slug,
        }))
      ),
    [categories]
  );

  // Create Fuse index (only when items change)
  const fuse = useMemo(() => new Fuse(enrichedItems, FUSE_CONFIG), [enrichedItems]);

  return { fuse, enrichedItems };
}
```

### Category Tab Derivation

```typescript
// Derive tab list from search results
function useCategoryTabs(
  results: FuseSearchResult[],
  categories: MenuCategory[],
  activeTab: string | null
) {
  const categoriesWithResults = useMemo(() => {
    const slugSet = new Set(results.map((r) => r.item._categorySlug));
    return categories
      .filter((c) => slugSet.has(c.slug))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: results.filter((r) => r.item._categorySlug === c.slug).length,
      }));
  }, [results, categories]);

  const filteredResults = useMemo(() => {
    if (!activeTab) return results; // "All" tab
    return results.filter((r) => r.item._categorySlug === activeTab);
  }, [results, activeTab]);

  return { categoriesWithResults, filteredResults };
}
```

### Category Emoji Fallbacks

```typescript
// Map category slugs to emoji fallbacks for missing thumbnails
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "all-day-breakfast": "\u{1F373}", // cooking/egg
  "rice-noodles-soups": "\u{1F35C}", // steaming bowl
  sides: "\u{1F961}", // takeout box
  "curries-a-la-carte": "\u{1F35B}", // curry rice
  vegetables: "\u{1F966}", // broccoli
  "seafood-curries": "\u{1F990}", // shrimp
  "appetizers-salads": "\u{1F957}", // green salad
  drinks: "\u{1F9CB}", // bubble tea
};

function getCategoryEmoji(categorySlug: string): string {
  return CATEGORY_EMOJI_MAP[categorySlug] ?? "\u{1F35C}"; // default: steaming bowl
}
```

### Order History Search

```typescript
// Fetch user's order items for "From your orders" search
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface OrderHistoryItem {
  orderId: string;
  nameSnapshot: string;
  placedAt: string;
  quantity: number;
}

function useOrderHistorySearch(query: string, userId?: string) {
  // Fetch all order items (small dataset per user)
  const { data: orderItems } = useQuery({
    queryKey: ["order-items-for-search", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("order_items")
        .select("name_snapshot, quantity, orders!inner(id, placed_at, user_id)")
        .eq("orders.user_id", userId!)
        .order("orders(placed_at)", { ascending: false })
        .limit(100);
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Client-side fuzzy search on fetched order items
  const fuse = useMemo(() => {
    if (!orderItems) return null;
    return new Fuse(orderItems, {
      keys: ["name_snapshot"],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [orderItems]);

  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse.search(query).slice(0, 5); // Max 5 order history results
  }, [fuse, query]);

  return results;
}
```

## Discretion Recommendations

### Search Overlay Style

**Recommendation:** Keep existing CommandPalette overlay style (centered dialog with backdrop). The current implementation is well-tuned for mobile and desktop. Do not switch to full-screen -- it would lose the quick-dismiss affordance.

### Theme Treatment

**Recommendation:** Inherit app theme (already does via semantic tokens). The dark mode glassmorphism override in the existing component handles this correctly.

### Fuzzy Matching Library

**Recommendation:** Fuse.js 7.1.0. Reasons: ~5kB gzipped, zero dependencies, sufficient for ~78 items, excellent `includeMatches` for highlighting, well-documented. MiniSearch and FlexSearch are overkill for this dataset size.

### Client-side vs Server-side

**Recommendation:** Client-side for menu search (data already loaded). Server-side initial fetch + client-side Fuse for order history (fetch once, search locally).

### Result Ranking Algorithm

**Recommendation:** Name-first weighted scoring via Fuse.js key weights:

- `nameEn`: weight 3 (primary match target)
- `nameMy`: weight 2 (Burmese name support)
- `descriptionEn`: weight 1
- `_categoryName`: weight 0.5
- `tags` + `allergens`: weight 0.5 each

### Multi-word Query Handling

**Recommendation:** Fuse.js handles multi-word queries by matching each word independently by default. Use `useExtendedSearch: false` (the default) -- Fuse treats the whole query as a single fuzzy pattern. For "shan noodle", Fuse will match items containing similar patterns. This works well for dish names.

### Score Threshold

**Recommendation:** Filter results with `score > 0.7` (Fuse scores are 0=perfect match, 1=no match). Threshold of 0.4 in config handles fuzziness; post-filter removes garbage results.

### Burmese Script Fuzzy Tolerance

**Recommendation:** Fuse.js works character-by-character and is Unicode-aware. Burmese script (Myanmar Unicode) will work for exact and near-exact matches. Full Burmese fuzzy tolerance (handling similar-looking characters) would require custom preprocessing. For v1, accept that Burmese script search will be slightly less fuzzy than English. Flag for future enhancement if needed.

### Tab Result Counts

**Recommendation:** Show count in parentheses next to category name: "Soups (3)". Low implementation cost, high utility.

### Tab Ordering

**Recommendation:** Menu sort order (same order as the main menu page). Consistency with the browsing experience is more important than dynamic reordering by match count.

### "All" Tab Internal Layout

**Recommendation:** Flat relevance-sorted list (Fuse.js default sorting). Adding sub-headers within "All" would add visual noise. The category tabs provide the grouping affordance.

### Recent Search Tap Behavior

**Recommendation:** Fill input and immediately run search (not just fill). This matches user expectation -- tapping a recent search should show results, not require a second action.

### Voice Search

**Recommendation:** Skip for this phase. Adds significant complexity (Web Speech API, browser support matrix, UX for recording state). Low priority for a food delivery app with a small menu.

### Dismiss Methods

**Recommendation:** Keep existing: click backdrop, press Escape, tap mobile X button. Add: swipe down on mobile (consistent with sheet patterns). The current `handleOpenChange(false)` handler supports all these.

## State of the Art

| Old Approach                                    | Current Approach                         | When Changed | Impact                                         |
| ----------------------------------------------- | ---------------------------------------- | ------------ | ---------------------------------------------- |
| `.includes()` substring matching                | Fuse.js fuzzy with weighted keys         | This phase   | "mohiga" -> "Mohinga" works                    |
| Flat result list                                | Tabbed category grouping                 | This phase   | Easier to find items in specific categories    |
| Text-only result rows                           | Rich cards with thumbnails, badges, tags | This phase   | Visual browsing, sold-out awareness            |
| Server-side `ilike` search (existing API route) | Client-side Fuse.js                      | This phase   | Instant results, works offline, typo tolerance |

**Deprecated/outdated:**

- The existing `/api/menu/search` route using Supabase `ilike` can remain for any non-JS clients but is no longer the primary search path.
- The `SearchInput` component in `ui/menu/` (uses `useMenuSearch` server-side hook + `SearchAutocomplete` dropdown) is a separate search entry point on the menu page. It can coexist or be replaced depending on scope. For this phase, focus on the CommandPalette.

## Open Questions

1. **MenuItem type extension for categoryId**
   - What we know: Current `MenuItem` type has no category reference. Items are nested under `MenuCategory.items[]`.
   - What's unclear: Whether to modify the `MenuItem` type globally or use a local enriched type.
   - Recommendation: Use local `EnrichedMenuItem` type with `_categoryName` and `_categorySlug` prefixed with underscore to signal internal-only fields. Avoid changing the shared `MenuItem` type.

2. **Item detail without navigation**
   - What we know: Current flow navigates to `/menu?item=slug`. This closes the palette and loses search state.
   - What's unclear: Whether the `ItemDetailSheet` can be rendered outside the menu page context (it needs `onAddToCart` which uses `useCart`).
   - Recommendation: Import `ItemDetailSheet` into CommandPalette and use `useCart` directly. The sheet is a client component that works anywhere.

3. **Order history data availability**
   - What we know: OrdersTab fetches orders with `order_items (quantity)` but not `name_snapshot`. The reorder API route does access `name_snapshot`.
   - What's unclear: Whether a dedicated lightweight query for order item names exists.
   - Recommendation: Create a React Query hook that fetches `order_items.name_snapshot` joined with `orders.placed_at` for the authenticated user. Cache with 5-min stale time.

4. **"Popular" badge data source**
   - What we know: The seed data has a `tags: ["popular"]` field on some items. The `POPULAR_ITEM_SLUGS` in `SearchEmptyState` is hardcoded.
   - What's unclear: Whether there's a dynamic popularity signal (order count) or if `tags.includes("popular")` is the only source.
   - Recommendation: Use `tags.includes("popular")` for now. A dynamic popularity ranking can be a future enhancement.

## Sources

### Primary (HIGH confidence)

- Context7 `/websites/fusejs_io` - Fuse.js configuration, weighted search, scoring theory, includeMatches
- Context7 `/pacocoursey/cmdk` - shouldFilter={false}, custom filter functions, keyboard navigation, Command.Group
- Codebase analysis: `src/components/ui/search/CommandPalette/`, `src/lib/hooks/useMenu.ts`, `src/types/menu.ts`

### Secondary (MEDIUM confidence)

- npm info fuse.js: version 7.1.0, unpacked size 456kB (but tree-shakeable, gzipped ~5kB for core)
- Codebase: `data/menul.seed.yaml` -- 78 menu items across 8 categories
- Codebase: existing `useRecentSearches`, `useDebounce`, `staggerItem` patterns

### Tertiary (LOW confidence)

- Fuse.js performance on Burmese Unicode script (not explicitly tested in docs, relies on general Unicode support)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- Fuse.js is the de facto standard for client-side fuzzy search, verified via Context7
- Architecture: HIGH -- Building on existing cmdk + React Query patterns already proven in codebase
- Pitfalls: HIGH -- Derived from actual codebase analysis (`.includes()` limitation, category info loss, Safari blur crashes)
- Burmese script support: MEDIUM -- Fuse.js is Unicode-aware but specific Burmese fuzzy tolerance untested

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days -- stable domain, no fast-moving dependencies)
