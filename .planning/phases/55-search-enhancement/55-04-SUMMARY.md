---
phase: 55-search-enhancement
plan: 04
subsystem: ui
tags: [command-palette, item-detail-sheet, search-persistence, next-image, search-result-card]

# Dependency graph
requires:
  - phase: 55-02
    provides: SearchResultCard, SearchResults, SearchCategoryTabs
  - phase: 55-03
    provides: SearchEmptyState, SearchOrderHistory, SearchInput clear, NoResultsState
provides:
  - "ItemDetailSheet integrated into CommandPalette for search state persistence"
  - "Hero image fix: Next.js Image replaces plain img for Google Drive URL proxy"
  - "SearchResultCard tag cleanup: _optional filter, formatTagLabel, consolidated layout"
  - "className pass-through on ItemDetailSheet for z-index override capability"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [next-image-proxy-for-google-drive, tag-label-formatting, className-passthrough]

key-files:
  modified:
    - src/components/ui/search/CommandPalette/CommandPalette.tsx
    - src/components/ui/menu/ItemDetailSheet.tsx
    - src/components/ui/search/CommandPalette/SearchResultCard.tsx

key-decisions:
  - "SRCH-04-NEXTIMAGE: Replaced plain <img> with Next.js <Image> in ItemDetailSheet hero — Google Drive thumbnail URLs fail with direct loading (redirects/cookies), must proxy through /_next/image"
  - "SRCH-04-TAGFILTER: Added !t.endsWith('_optional') to SearchResultCard tag filter — removes raw 'spicy_optional' text from display"
  - "SRCH-04-TAGLABEL: formatTagLabel() capitalizes and formats tag slugs for display ('vegetarian' → 'Vegetarian', 'very-spicy' → 'Very spicy')"
  - "SRCH-04-CONSOLIDATE: Category badge + dietary tags consolidated to single line with dot separator, allergen badge on its own line (safety-critical)"
  - "SRCH-04-CLASSNAME: Added className prop pass-through on ItemDetailSheet for future z-index override capability"

patterns-established:
  - "Google Drive image URLs must go through Next.js Image proxy (/_next/image) — plain <img> tags fail silently (naturalWidth: 0)"
  - "Tag display: filter meta tags, format with capitalize + dash-to-space, color-code by category (green=vegetarian, red=spicy, orange=allergen)"

# Metrics
duration: ~45min (across 2 sessions)
completed: 2026-02-11
---

# Phase 55 Plan 04: ItemDetailSheet Integration & Polish Summary

**Integrated ItemDetailSheet into CommandPalette for search state persistence, fixed hero image loading for Google Drive URLs, and cleaned up SearchResultCard tag display**

## Performance

- **Duration:** ~45 min (across 2 sessions)
- **Completed:** 2026-02-11
- **Tasks:** 3 (integration, image fix, tag cleanup)
- **Files modified:** 3

## Accomplishments
- ItemDetailSheet integrated into CommandPalette: tapping a search result opens item detail as overlay without closing the palette, query and results preserved
- handleAddToCart wired to useCartStore.getState().addItem() for adding items from search
- handleCloseItemDetail returns to search with query intact; handleOpenChange(false) clears all state
- Fixed hero image in ItemDetailSheet: replaced plain `<img>` with Next.js `<Image>` component — Google Drive thumbnail URLs fail with direct loading due to redirects/cookies, now proxied through `/_next/image`
- SearchResultCard tag filter enhanced: `_optional` suffix tags filtered out (no more raw "spicy_optional")
- Tag labels capitalized via `formatTagLabel()`: "vegetarian" → "Vegetarian", "very-spicy" → "Very spicy"
- Category badge + dietary tags consolidated to single line with `·` separator, allergen badge on its own safety-critical line
- Added `className` prop pass-through on ItemDetailSheet for z-index override capability

## Task Commits

1. **ItemDetailSheet integration into CommandPalette** - `9a5f0e9` (feat)
2. **Search matching tightening, allergen fix, autofocus + ESC** - `1d73741` (fix)
3. **Hero image fix + SearchResultCard tag cleanup** - `bcf97d2` (fix)

## Files Modified
- `src/components/ui/search/CommandPalette/CommandPalette.tsx` - Integrated ItemDetailSheet with selectedItem state, handleAddToCart, handleCloseItemDetail
- `src/components/ui/menu/ItemDetailSheet.tsx` - Replaced `<img>` with `<Image>`, added className pass-through prop
- `src/components/ui/search/CommandPalette/SearchResultCard.tsx` - Tag filter (_optional), formatTagLabel(), consolidated layout

## Decisions Made
- **Next.js Image for Google Drive URLs:** Plain `<img>` tags fail silently (naturalWidth: 0, complete: true) because Google Drive thumbnail URLs respond with redirects + cookies that browsers block for cross-origin requests. Next.js `<Image>` proxies through `/_next/image`, bypassing CORS. `drive.google.com` was already in `next.config.ts` remotePatterns.
- **Tag filter consolidation:** `_optional` suffix tags (e.g., "spicy_optional") are redundant with the base tag and produce raw ugly text. Filtered alongside existing `contains_*` and meta tag exclusions.
- **Single-line category + tags:** Reduced vertical clutter from 3 lines (category, tags, allergens) to 2 lines (category · tags, allergens). Allergen badge stays on its own line for safety-critical visibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Google Drive image URLs broken with plain img tag**
- **Found during:** Playwright visual verification
- **Issue:** ItemDetailSheet used `<img src={item.imageUrl}>` which fails for Google Drive thumbnail URLs (naturalWidth: 0)
- **Fix:** Replaced with Next.js `<Image>` component with `fill`, `sizes`, and `priority` props
- **Files modified:** src/components/ui/menu/ItemDetailSheet.tsx
- **Verification:** Playwright confirms naturalWidth: 512 after fix

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Image fix was a genuine bug not anticipated in plan. No scope creep.

## Verification

- `pnpm typecheck` — passed
- `pnpm lint` — passed
- `pnpm lint:css` — passed
- `pnpm test` — 339 tests passed
- `pnpm build` — succeeded
- Playwright: Mohinga photo loads correctly (naturalWidth: 512) through /_next/image proxy
- Playwright: Search state preserved after closing item detail sheet
- Playwright: Tag display shows "Vegetables · Vegetarian" (capitalized, no raw slugs)
- Playwright: Allergen badge shows "Soy" on separate line

## Success Criteria Verification

- **SRCH-01:** "mohiga" finds "Mohinga" ✓ (fuzzy matching with Fuse.js)
- **SRCH-02:** Category tabs appear and filter results ✓
- **SRCH-03:** 64px food thumbnails display in result cards ✓ (with emoji fallback)
- **Search state persistence:** Tapping result opens ItemDetailSheet, closing returns to search with query intact ✓
- **Add to cart from search:** Works via useCartStore.getState().addItem() ✓
- **No deferred ideas implemented:** No browse-by-category, no allergen filter UI ✓

## User Setup Required
None - no external service configuration required.

## Phase 55 Complete
All 4 plans executed. Search enhancement fully deployed:
- Plan 01: Fuse.js integration, search lib, hooks, AppHeader rewiring
- Plan 02: Rich SearchResultCard, HighlightedText, CategoryTabs, SearchSkeleton
- Plan 03: SearchEmptyState lifecycle, SearchOrderHistory, clear button, no-results fallback
- Plan 04: ItemDetailSheet integration, hero image fix, tag cleanup

---
*Phase: 55-search-enhancement*
*Completed: 2026-02-11*
