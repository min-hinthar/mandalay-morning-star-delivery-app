# Phase 55: Search Enhancement - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the existing CommandPalette/search to find Burmese dishes accurately even with typos. Add fuzzy matching, category grouping via tabs, food thumbnails, and search history. Scope includes menu item search and order history search. Does not include new navigation triggers or browse-by-category features.

</domain>

<decisions>
## Implementation Decisions

### Result Presentation
- Rich card layout (not compact list rows)
- Each card shows: food thumbnail (64px medium), item name, base price, category tag badge, dietary/spice tags
- Sold-out items appear grayed out with "Sold out" badge (not hidden)
- Background highlight on matched text (accent/yellow background on the matched portion)
- Staggered fade-in animation for results appearing
- 8-10 results visible before scrolling
- Tapping a result navigates to item detail page (not quick-add)
- Base price only (no "from $X" modifier ranges)
- Show popularity indicator ("Popular" / "Bestseller" badge) on top items
- Category-based emoji fallback when thumbnail is missing/loading (e.g., bowl emoji for soups, rice emoji for rice dishes)
- Skeleton card loading state while results compute
- Search overlay style: Claude's Discretion (based on existing CommandPalette)
- Theme: Claude's Discretion (inherit app theme or dark overlay)

### Matching Behavior
- Search fields: name + description + category + ingredients/allergens
- Live as-you-type with ~100-150ms debounce (nearly instant)
- Support both Burmese script and English transliteration input
- No phonetic matching — fuzzy is sufficient
- Fuzzy tolerance and ranking strategy: Claude's Discretion (tune for Burmese dish names)
- Partial matching strategy: Claude's Discretion
- Multi-word query handling: Claude's Discretion
- Score threshold filtering: Claude's Discretion
- Client-side vs server-side matching: Claude's Discretion
- Burmese script fuzzy tolerance: Claude's Discretion (evaluate feasibility)

### Category Grouping
- Tabbed categories at top of results (not section headers)
- Default "All" tab shows all results
- Only categories with matching results shown as tabs (no empty categories)
- Horizontal scroll for tab overflow
- Active tab has filled/solid primary-color background
- Fade crossfade animation when switching category tabs
- Tab result counts: Claude's Discretion
- Tab ordering: Claude's Discretion (menu order vs result count)
- "All" tab internal layout: Claude's Discretion (grouped sub-headers vs flat relevance list)
- Tabs only filter search results (no standalone browse mode)

### Search Interaction
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
- Dismiss behavior: Claude's Discretion (based on existing overlay patterns)
- Keyboard navigation: Claude's Discretion (based on existing keyboard support)
- Recent search tap behavior: Claude's Discretion (re-run vs fill input)
- Voice search: Claude's Discretion (evaluate value vs complexity)

### Claude's Discretion
- Search overlay visual style (full-screen vs dropdown — based on existing CommandPalette)
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

</decisions>

<specifics>
## Specific Ideas

- "mohiga" must find "Mohinga" — this is the primary fuzzy matching use case for Burmese dish names
- Order history search lets customers find "that thing from last week" — separate section below menu results
- Category-based emoji fallbacks for missing thumbnails (food emoji matching the category)
- Popular/bestseller badges provide social proof in search results
- Dietary/spice tags help customers with allergies find safe food quickly

</specifics>

<deferred>
## Deferred Ideas

- Browse-by-category mode (tapping category tabs without a query) — could be its own phase
- Full ingredient/allergen filtering (dedicated allergy filter UI) — separate from text search

</deferred>

---

*Phase: 55-search-enhancement*
*Context gathered: 2026-02-10*
