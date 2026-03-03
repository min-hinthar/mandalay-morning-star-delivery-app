# Phase 92: Customer UX - Discovery & Shopping - Research

**Researched:** 2026-03-03
**Domain:** Mobile shopping UX (search, filters, sold-out sorting, cart indicators, delivery gate, offline)
**Confidence:** HIGH

## Summary

Phase 92 enhances the customer shopping experience across 11 requirements (CUX-01 through CUX-10, CUX-20). The codebase already has strong foundational components: `SearchInput` with collapsible behavior, `DietaryChipPicker` for filter chips, `CartBar` as sticky footer, `Hero` with delivery gate integration, `useDeliveryGate` with 60s polling, `useCustomerOfflineSync` for connectivity detection, and `cart-store` with `pendingSync` tracking. Most requirements involve enhancing existing components rather than building new ones.

Key architectural insight: filtering (dietary + search) should be client-side state in `MenuContent`, not API calls. The menu data is already fully loaded via `useMenu()` TanStack Query hook. Fuse.js is available for fuzzy text search. Dietary filtering is simple tag-based `Array.includes()` against `MenuItem.tags[]`. Sold-out sorting is a stable sort on `isSoldOut` field. This avoids new API endpoints and keeps the experience snappy.

**Primary recommendation:** Treat this as ~4 plans: (1) search+filters+sold-out sorting on menu page, (2) hero banner + delivery date auto-select + dynamic gate polling, (3) cart indicators (min order, sync status, offline banner), (4) modifier scroll indicator + sticky footer verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Collapsible header on scroll: full search bar + dietary chips visible at top, collapses to compact form on scroll-down, expands on scroll-up. Uses existing `useScrollDirection` hook
- Dietary filter chips: all 6 options from DietaryChipPicker in horizontally scrollable chip row
- Sold-out items: greyed out/desaturated cards with "Sold Out" badge overlay, sorted to bottom of each category
- Sold-out items still tappable -- open item detail sheet in view-only mode with disabled "Add to Cart" replaced by "Sold Out"
- Search + filters use AND logic: text + dietary chips combines both conditions
- Sync status: subtle text in cart drawer header -- "Saved" with checkmark or "Saving..." next to cart title, disappears after 2 seconds (Google Docs auto-save style)
- Offline banner: fixed amber top banner -- "You're offline -- browsing cached menu. Some items may be unavailable." Dismissible. Auto-hides on reconnect with "Back online!" toast
- Minimum order warning: displayed in CartBar sticky footer -- warning text above checkout button when below minimum, checkout button disabled
- Hero enhancement: add explicit "Next delivery: Saturday, March 7" text with cutoff info to existing Hero component. Enhance, don't rebuild
- Delivery date auto-select: first available Saturday pre-selected, user still sees date picker
- 10-second polling during final 30 minutes before cutoff, applies everywhere useDeliveryGate is used

### Claude's Discretion
- Modifier scroll indicator design (fade gradient, scroll arrows, or hybrid)
- Exact collapse animation for compact header mode
- Search input styling in compact vs expanded state
- CartBar min-order warning layout details
- Offline banner animation/transition style

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUX-01 | Search bar always visible on mobile (not collapsed to icon) | `SearchInput` has `mobileCollapsible` prop; set to `false` in MenuHeader. Collapsible header via `useScrollDirection` handles compact mode. |
| CUX-02 | Dietary filter chips above menu grid | `DietaryChipPicker` exists in account settings; migrate to menu context. `DIETARY_OPTIONS`/`DIETARY_EMOJIS` in `settings-types.ts`. Client-side filter via `MenuItem.tags[]`. |
| CUX-03 | Sold-out items sorted to bottom of search results and grid | `MenuItem.isSoldOut` field exists. Stable sort in `MenuContent` before passing to `MenuGrid`. `UnifiedMenuItemCard` already renders sold-out overlay. |
| CUX-04 | Item detail sheet shows scroll indicator when modifiers overflow | `ModifierGroup` renders inside `ItemDetailSheet` scrollable content area. Add fade gradient or scroll arrow to modifier container. |
| CUX-05 | Dynamic Saturday hero banner with next delivery date | `HeroContent` already shows `gate.deliveryDate.displayDate` and cutoff info. Enhance with explicit "Next delivery: Saturday, [date]" text. |
| CUX-06 | Minimum order warning shown inline in cart | `CheckoutGate` has `minimumShortfallCents` logic. `BusinessRules.minimumOrderCents` = 2500 ($25). Wire into `CartBar` with inline warning text. |
| CUX-07 | Sticky checkout footer on mobile | `CartBar` already is fixed bottom with iOS safe area. Verify no gaps; likely minimal work. |
| CUX-08 | First available delivery date auto-selected | `TimeStepV8` uses `getAvailableDeliveryDates()`. Auto-select first non-cutoff-passed date in `useEffect`. |
| CUX-09 | Cart sync status indicator ("Saved"/"Saving...") | `cart-store` has `pendingSync` flag and `online` listener. Add ephemeral sync indicator to `CartHeader` in `CartDrawerParts`. |
| CUX-10 | Prominent "Offline Mode" banner when browsing cached menu | `useCustomerOfflineSync` hook exists. `SimpleOfflineOverlay` pattern for reference. Create customer-specific amber banner. |
| CUX-20 | Delivery gate poll interval reduces to 10s near cutoff | `useDeliveryGate` uses static 60s `setInterval`. Add conditional interval based on `urgency === 'critical'` (totalMinutes <= 30). |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| Framer Motion (`m`) | All component animations, AnimatePresence | Project standard; spring tokens in `motion-tokens.ts` |
| Zustand | Cart store, checkout store state | Project standard for client state |
| TanStack React Query | Menu data fetching via `useMenu()` | Project standard for server state |
| Radix UI | RadioGroup, Checkbox in ModifierGroup | Project standard via shadcn/ui |
| lucide-react | Icons (Search, X, WifiOff, Check, etc.) | Project standard icon library |

### Supporting (already installed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `cn()` (clsx+twMerge) | Conditional class merging | Every component |
| `useAnimationPreference` | Reduced motion support | Every animated component |
| `useScrollDirection` | Scroll-based header collapse | MenuHeader collapsible behavior |
| `useMediaQuery` | Responsive breakpoint detection | Mobile vs desktop layout |

### No New Dependencies
All 11 requirements can be implemented with existing libraries. No new packages needed.

## Architecture Patterns

### Recommended Integration Points

```
src/
  components/ui/
    menu/
      MenuHeader.tsx          # MODIFY: always-visible search + dietary chips
      MenuContent.tsx         # MODIFY: dietary filter state + sold-out sorting
      MenuGrid.tsx            # NO CHANGE: receives sorted/filtered items
      ModifierGroup.tsx       # MODIFY: add scroll overflow indicator
      ItemDetailSheet.tsx     # NO CHANGE: already handles isSoldOut view-only
    cart/
      CartBar.tsx             # MODIFY: add min-order warning inline
      CartDrawerParts.tsx     # MODIFY: add sync status to CartHeader
    homepage/
      Hero/HeroContent.tsx    # MODIFY: add explicit delivery date text
    checkout/
      TimeStepV8.tsx          # MODIFY: auto-select first available date
    customer/
      OfflineBanner.tsx       # NEW: amber offline banner for customer pages
  lib/
    hooks/
      useDeliveryGate.ts      # MODIFY: dynamic polling interval
      useMenuFilters.ts       # NEW: dietary + text filter state hook
```

### Pattern 1: Client-Side Menu Filtering
**What:** Dietary filters + text search applied client-side to already-loaded menu data
**When to use:** Menu data is fully loaded via `useMenu()` (TanStack Query caches it)
**Why client-side:** Avoids new API endpoints; instant filter response; menu dataset is small (~30-50 items)

```typescript
// useMenuFilters.ts
interface MenuFilters {
  query: string;
  dietaryFilters: string[];  // from DIETARY_OPTIONS
}

function filterItems(items: MenuItem[], filters: MenuFilters): MenuItem[] {
  let filtered = items;

  // Text filter (fuzzy via existing name/description matching)
  if (filters.query.trim()) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(item =>
      item.nameEn.toLowerCase().includes(q) ||
      item.nameMy?.toLowerCase().includes(q) ||
      item.descriptionEn?.toLowerCase().includes(q)
    );
  }

  // Dietary filter (AND logic: item must match ALL active filters)
  if (filters.dietaryFilters.length > 0) {
    filtered = filtered.filter(item =>
      filters.dietaryFilters.every(filter => item.tags.includes(filter))
    );
  }

  return filtered;
}

// Sold-out sorting (stable sort: available first, sold-out last)
function sortSoldOutLast(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => Number(a.isSoldOut) - Number(b.isSoldOut));
}
```

### Pattern 2: Collapsible Header with Always-Visible Search
**What:** MenuHeader expands/collapses on scroll but search stays visible in both states
**When to use:** CUX-01 requirement

```typescript
// MenuHeader approach:
// - Full mode: search bar at full width + dietary chips row below
// - Compact mode: search bar condensed (shorter) + chips hidden
// - useScrollDirection drives isCollapsed
// - SearchInput with mobileCollapsible={false} (always visible)
```

### Pattern 3: Dynamic Polling Interval
**What:** useDeliveryGate adjusts polling from 60s to 10s when urgency is critical
**When to use:** CUX-20 requirement

```typescript
// In useDeliveryGate.ts:
useEffect(() => {
  setState(computeDeliveryGate(cutoffDay, cutoffHour));

  const getInterval = () => {
    const gate = computeDeliveryGate(cutoffDay, cutoffHour);
    const totalMinutes = gate.timeUntilCutoff.hours * 60 + gate.timeUntilCutoff.minutes;
    return totalMinutes <= 30 && !gate.timeUntilCutoff.isPastCutoff ? 10_000 : 60_000;
  };

  // Use setTimeout chain instead of setInterval for dynamic intervals
  let timeoutId: ReturnType<typeof setTimeout>;
  const tick = () => {
    setState(computeDeliveryGate(cutoffDay, cutoffHour));
    timeoutId = setTimeout(tick, getInterval());
  };
  timeoutId = setTimeout(tick, getInterval());

  return () => clearTimeout(timeoutId);
}, [cutoffDay, cutoffHour]);
```

### Pattern 4: Ephemeral Sync Status Indicator
**What:** "Saved" / "Saving..." text in cart drawer header that auto-hides after 2s
**When to use:** CUX-09 requirement

```typescript
// Track pendingSync items from cart store
// When items have pendingSync: show "Saving..."
// When pendingSync clears: show "Saved" + checkmark for 2s, then fade out
// Use AnimatePresence for enter/exit transitions
```

### Anti-Patterns to Avoid
- **Don't create new API endpoints for filtering:** Menu data is already loaded client-side
- **Don't use setInterval for dynamic polling:** Use setTimeout chain so interval can change
- **Don't rebuild Hero component:** Only add text to existing HeroContent
- **Don't store dietary filter state in Zustand:** URL params or component state suffice for menu page filters
- **Don't use backdrop-blur on mobile:** Project learning -- causes Safari crashes. Use solid backgrounds on mobile
- **Don't use loading="lazy" in animated containers:** Project learning -- images inside opacity:0 framer-motion wrappers never load

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll direction detection | Custom scroll listener | `useScrollDirection` hook | Already exists, handles throttle/threshold |
| Online/offline detection | `navigator.onLine` watcher | `useCustomerOfflineSync` hook | Already exists, handles 3s reconnect banner |
| Reduced motion handling | `prefers-reduced-motion` queries | `useAnimationPreference` hook | Already exists, project-wide pattern |
| Delivery date computation | Manual date math | `getDeliveryDate()`, `getAvailableDeliveryDates()` | Already exists with timezone handling |
| Business rules (min order) | Hardcoded values | `getBusinessRules()` / `BUSINESS_RULES_DEFAULTS` | `minimumOrderCents: 2500` already configured |
| Cart item total computation | Manual sum | `useCart().itemsSubtotal` | Already computed reactively |

## Common Pitfalls

### Pitfall 1: Dietary Filter Tag Mismatch
**What goes wrong:** DIETARY_OPTIONS use human labels ("Gluten-free") but `MenuItem.tags[]` may use different strings
**Why it happens:** Tags come from Supabase `tags` column, dietary options from `settings-types.ts`
**How to avoid:** Verify tag strings in DB match exactly. Check `data/menu-items.yaml` for actual tag values. May need case-insensitive comparison or mapping.
**Warning signs:** Filters produce zero results when items clearly have the dietary property

### Pitfall 2: Sold-Out Sorting Breaks Category Boundaries
**What goes wrong:** Sorting all items together instead of within each category
**Why it happens:** `MenuContent` iterates `displayCategories` -> each has its own `items[]`
**How to avoid:** Sort within `category.items` before passing to `MenuGrid`, not on the flattened array
**Warning signs:** Sold-out items from one category appearing in another

### Pitfall 3: Collapsible Header Z-Index Conflicts
**What goes wrong:** Dietary chip dropdown or search autocomplete clipped by other elements
**Why it happens:** MenuHeader uses `z-20`, other sticky elements may overlap
**How to avoid:** Use project's `zIndex` tokens from `@/lib/design-system/tokens/z-index`. Test with autocomplete dropdown visible.
**Warning signs:** Search autocomplete appearing behind menu content

### Pitfall 4: CartBar Min-Order Warning Causes Layout Shift
**What goes wrong:** Warning text appearing/disappearing causes cart bar to jump
**Why it happens:** Inserting new content above the checkout button
**How to avoid:** Reserve space or use `AnimatePresence` with `layout` animations for smooth transitions. Set min-height on warning area.
**Warning signs:** Cart bar bouncing when adding/removing items near the minimum threshold

### Pitfall 5: Dynamic Polling Interval Memory Leak
**What goes wrong:** Multiple overlapping setTimeout chains
**Why it happens:** Not cleaning up previous timeout when state changes
**How to avoid:** Clear timeout in cleanup function. Use a single timeout chain pattern, not setInterval.
**Warning signs:** Gate state updating multiple times per tick, increasing CPU usage

### Pitfall 6: Auto-Select Delivery Date Triggers on Every Render
**What goes wrong:** Delivery date selection fires repeatedly, overwriting user changes
**Why it happens:** `useEffect` with `availableDates` dependency recalculates
**How to avoid:** Only auto-select when `delivery === null` (no selection yet). Guard with `if (!delivery)` check.
**Warning signs:** User selects a different date but it snaps back to the first available

### Pitfall 7: Offline Banner Conflicts with CartBar Position
**What goes wrong:** Fixed-position banner overlaps with CartBar or obscures content
**Why it happens:** Both use fixed/sticky positioning
**How to avoid:** Offline banner at top of viewport, CartBar at bottom. Test both visible simultaneously. Use zIndex tokens.
**Warning signs:** Banner covering checkout button or price display

## Code Examples

### Sold-Out Sorting Within Categories
```typescript
// In MenuContent.tsx, before rendering:
const sortedCategories = displayCategories.map(category => ({
  ...category,
  items: [...(category.items ?? [])].sort(
    (a, b) => Number(a.isSoldOut) - Number(b.isSoldOut)
  ),
}));
```

### Dietary Filter Integration in MenuContent
```typescript
// Add filter state to MenuContent
const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState("");

// Apply filters to each category's items
const filteredCategories = useMemo(() => {
  return sortedCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesText =
            item.nameEn.toLowerCase().includes(q) ||
            item.nameMy?.toLowerCase().includes(q) ||
            item.descriptionEn?.toLowerCase().includes(q);
          if (!matchesText) return false;
        }
        // Dietary filter (AND logic)
        if (dietaryFilters.length > 0) {
          return dietaryFilters.every(f => item.tags.includes(f));
        }
        return true;
      }),
    }))
    .filter(category => category.items.length > 0); // Hide empty categories
}, [sortedCategories, searchQuery, dietaryFilters]);
```

### Min-Order Warning in CartBar
```typescript
// In CartBar, compute shortfall from business rules
const minimumOrderCents = 2500; // from BUSINESS_RULES_DEFAULTS
const shortfall = Math.max(0, minimumOrderCents - itemsSubtotal);
const isAboveMinimum = shortfall === 0;

// Render warning above checkout button
{shortfall > 0 && (
  <p className="text-xs text-status-warning text-center px-4 pb-1">
    ${(shortfall / 100).toFixed(2)} more to reach $25 minimum
  </p>
)}
```

### Auto-Select First Available Delivery Date
```typescript
// In TimeStepV8, add auto-select effect
useEffect(() => {
  if (delivery) return; // Already selected
  const firstAvailable = availableDates.find(d => !d.cutoffPassed);
  if (firstAvailable && timeWindows.length > 0) {
    setDelivery({
      date: firstAvailable.dateString,
      windowStart: timeWindows[0].start,
      windowEnd: timeWindows[0].end,
    });
  }
}, [delivery, availableDates, timeWindows, setDelivery]);
```

### Modifier Scroll Indicator (Fade Gradient)
```typescript
// Wrap modifier groups in a container with overflow detection
const [hasOverflow, setHasOverflow] = useState(false);
const [isAtBottom, setIsAtBottom] = useState(false);
const modifierRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = modifierRef.current;
  if (!el) return;
  setHasOverflow(el.scrollHeight > el.clientHeight);
  const onScroll = () => {
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  };
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => el.removeEventListener('scroll', onScroll);
}, [item?.modifierGroups]);

// Bottom fade gradient when overflow detected and not scrolled to bottom
{hasOverflow && !isAtBottom && (
  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-primary to-transparent" />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `mobileCollapsible={true}` on SearchInput | `mobileCollapsible={false}` for always-visible | Phase 92 | CUX-01: search always visible |
| Static 60s polling in useDeliveryGate | Dynamic 10s/60s based on urgency | Phase 92 | CUX-20: faster gate updates near cutoff |
| DietaryChipPicker in account settings only | Reuse in menu context for filtering | Phase 92 | CUX-02: dietary filters on menu page |
| No min-order enforcement in CartBar | Inline warning + disabled checkout | Phase 92 | CUX-06: minimum order UX |

## Open Questions

1. **Dietary tag values in database**
   - What we know: `DIETARY_OPTIONS` defines "Vegetarian", "Vegan", "Gluten-free", "Nut allergy", "Dairy-free", "Halal"
   - What's unclear: Whether `MenuItem.tags[]` from Supabase uses exactly these strings
   - Recommendation: Check `data/menu-items.yaml` during implementation. If mismatch, create a mapping.

2. **MinimumOrderCents source for CartBar**
   - What we know: `BUSINESS_RULES_DEFAULTS.minimumOrderCents = 2500` and `getBusinessRules()` fetches from DB
   - What's unclear: Whether CartBar (client component) can access server-fetched business rules
   - Recommendation: Pass `minimumOrderCents` from a server component (homepage layout) or use default constant. The cart-store already stores `deliveryFeeCents` and `freeDeliveryThresholdCents` similarly -- follow same pattern with `minimumOrderCents`.

3. **Cart "pendingSync" tracking for sync indicator**
   - What we know: `cart-store` sets `pendingSync: true` on offline items, clears on reconnect
   - What's unclear: This tracks offline-added items only, not general save state. "Saving..." indicator may need separate tracking for all cart mutations.
   - Recommendation: Use a simpler approach: show "Saved" briefly after any cart state change (debounced), not tied to `pendingSync`. Use Zustand's `subscribe()` to detect changes.

## Sources

### Primary (HIGH confidence)
- Existing codebase: All source files read directly from `src/` -- see file references throughout
- `CONTEXT.md`: User decisions locked for all 11 requirements
- `REQUIREMENTS.md`: Requirement definitions CUX-01 through CUX-20

### Secondary (MEDIUM confidence)
- Project learnings: `mobile-ux.md`, `animation.md`, `state-management.md` -- verified against current code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, patterns well-established in codebase
- Architecture: HIGH -- integration points verified by reading actual source files
- Pitfalls: HIGH -- based on project learnings and code structure analysis
- Filter logic: MEDIUM -- need to verify dietary tag strings match between UI constants and DB

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable; no external dependency changes expected)
