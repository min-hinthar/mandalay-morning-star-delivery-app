# Phase 52: Cart Validation & Cart Page - Research

**Researched:** 2026-02-08
**Domain:** Client-side cart validation, stale item detection, cart page UI
**Confidence:** HIGH

## Summary

Phase 52 builds a full cart page at `/cart` and adds cart validation logic that compares persisted cart items against the current menu. The existing codebase has a mature cart infrastructure: Zustand persist store (`cart-store.ts`), cart drawer (`CartDrawer.tsx`), cart items with swipe-to-delete (`CartItem/`), quantity selector, cart summary, and cart bar. The cart page at `src/app/(customer)/cart/page.tsx` is currently a stub with placeholder text.

The menu API (`/api/menu`) already returns `isActive`, `isSoldOut`, and `basePriceCents` for each item -- all fields needed for validation. A server-side `validateCartItems()` function already exists in `src/lib/utils/order.ts` for checkout validation; the client-side validation for this phase mirrors the same logic but runs against the `/api/menu` response. Zustand v5's `persist` middleware exposes `hasHydrated()`, `onFinishHydration()`, and `onHydrate()` for hydration-safe validation.

**Primary recommendation:** Reuse the existing `/api/menu` endpoint (with React Query `useMenu()`) as the validation data source. Create a `useCartValidation` hook that compares cart items against fresh menu data after Zustand hydration completes. Build the cart page by composing existing components (CartItem, CartSummary, QuantitySelector) into a two-column layout with category grouping and the new "attention section" for stale items.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Sold-out items: gray overlay + "Sold Out" badge (amber) -- clear and unmissable
- Unavailable items (removed from menu): gray overlay + red badge -- different color from sold-out to distinguish severity
- Problem items float to top in a dedicated "Items needing attention" section
- Section header uses direct/urgent tone: "2 items unavailable"
- No bulk "Remove all" action -- user resolves each item individually
- Attention section animates collapse when last issue is resolved
- Inline suggestions: 3 items from same category with thumbnail + name + price
- Tapping a suggestion auto-replaces the sold-out item instantly (no confirmation, no undo)
- Replacement carries over the original item's quantity
- Both sold-out and unavailable items get the same inline suggestions treatment
- Two-column layout on desktop: items left, order summary right; collapses to single column on mobile
- Mini card style for cart items: thumbnail on top/left, details right, stepper below
- Items grouped by category under category headers (Soups, Rice, etc.)
- Show customizations/add-ons below item name in smaller text
- Title shows item count: "Your Cart (5 items)"
- "Continue Shopping" back link at top + "+ Add more items" button below items list
- "Clear Cart" button exists already -- use existing implementation
- Item removal: slide out left animation
- Mobile: checkout button + total below summary (not sticky)
- Tapping a cart item opens bottom sheet modal for editing (quantity, customizations)
- Swipe left to delete on mobile -- reveals red area with trash icon
- Order summary: subtotal, delivery fee, estimated tax, total (full itemized breakdown)
- Delivery instructions, dietary card, promo codes, delivery ETA -- checkout only, not on cart page
- Checkout button disabled when stale/sold-out items exist OR minimum order not met
- Warning banner above checkout button (not inside button text)
- Banner is tappable -- smooth-scrolls to attention section at top
- Combined message when multiple blockers: "2 items need attention \* $5 below minimum"
- Checkout button pulses from disabled gray to active green when all issues are cleared
- Minimum order shortfall shown in order summary section (not a separate banner)
- Minimum order blocks checkout (not info-only)
- Validation runs on cart page/drawer mount; timing details at Claude's discretion
- Cart drawer also runs validation and shows full stale UX (gray overlay, badges, remove buttons)
- Brief skeleton cards during validation -- signals freshness check happening
- If validation fails (API error/network issue): silent fail, allow checkout -- backend validates on order submit
- No Supabase real-time subscription for menu changes -- validate on mount/checkout only
- Hydration safety: validation waits for Zustand rehydration
- Amber "Price updated" badge on price-increased items; green "Price updated" badge on price-decreased items
- Price-changed items stay in place (don't float to attention section)
- Price changes are info-only -- don't block checkout
- Badge shows "Price updated" (no difference amount) -- new price visible on the item
- Badge is dismissable -- tap to acknowledge and remove
- Dismissing updates the persisted cart price (won't reappear on next cart open)
- Order total animates with count-up when prices change
- No separate "Price adjustments" line in summary -- individual item prices update, subtotal reflects sum

### Claude's Discretion

- Quantity stepper style (+/- buttons vs dropdown)
- Zero-quantity removal behavior (direct remove vs confirm)
- Empty cart state design (mascot or illustration)
- Order summary sidebar sticky behavior on desktop
- Attention section collapsible vs always expanded
- Skeleton count during validation (match items vs fixed)
- Validation caching and re-entry strategy
- API data source for validation
- Store hours check placement

### Deferred Ideas (OUT OF SCOPE)

- Customization/add-on availability changes -- future validation enhancement
- Real-time menu change subscriptions on cart page -- overkill for current scale
- Promo/coupon code input on cart page -- checkout only for now
  </user_constraints>

## Standard Stack

### Core

| Library       | Version  | Purpose                                           | Why Standard                                                                                |
| ------------- | -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Zustand       | ^5.0.10  | Cart state + persist middleware                   | Already used; `persist` has `hasHydrated()` / `onFinishHydration()` for hydration detection |
| React Query   | ^5.90.1  | Menu data fetching via `useMenu()`                | Already provides `staleTime: 5min` cached menu data; refetch on mount                       |
| Framer Motion | ^12.26.1 | Animations (slide out, collapse, pulse, count-up) | Already used extensively in cart components                                                 |
| Next.js       | 16.1.2   | App router, `(customer)` route group              | Cart page at `src/app/(customer)/cart/page.tsx`                                             |

### Supporting

| Library                  | Version    | Purpose                   | When to Use                                                |
| ------------------------ | ---------- | ------------------------- | ---------------------------------------------------------- |
| Lucide React             | (existing) | Icons for badges, buttons | Sold out, unavailable, price change badges                 |
| class-variance-authority | (existing) | Badge variants            | Extend existing Badge component for cart validation states |

### No New Dependencies

This phase requires zero new npm packages. All functionality builds on existing stack.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── hooks/
│   │   └── useCartValidation.ts       # NEW: Core validation hook
│   └── stores/
│       └── cart-store.ts              # MODIFY: Add updateItemPrice(), cart hydration hook
├── components/ui/cart/
│   ├── CartPage/                      # NEW: Cart page components
│   │   ├── index.tsx                  # Barrel
│   │   ├── CartPageContent.tsx        # Main layout (two-column)
│   │   ├── CartPageHeader.tsx         # Title + "Continue Shopping" link
│   │   ├── AttentionSection.tsx       # Stale items section
│   │   ├── CartItemGroup.tsx          # Category-grouped items
│   │   ├── CartPageSummary.tsx        # Order summary sidebar
│   │   ├── CheckoutGate.tsx           # Checkout button + warning banner
│   │   └── SuggestionRow.tsx          # Inline replacement suggestions
│   ├── CartItem/
│   │   ├── CartItem.tsx               # MODIFY: Add validation overlays
│   │   ├── ValidationOverlay.tsx      # NEW: Gray overlay + badge
│   │   └── PriceChangeBadge.tsx       # NEW: Dismissable price badge
│   └── CartDrawer.tsx                 # MODIFY: Add validation on mount
├── app/(customer)/cart/
│   └── page.tsx                       # MODIFY: Full cart page implementation
└── types/
    └── cart.ts                        # MODIFY: Add validation types
```

### Pattern 1: Validation Hook with Hydration Guard

**What:** `useCartValidation` hook that waits for Zustand rehydration, then compares cart items against fresh menu data.
**When to use:** On cart page mount and cart drawer open.

```typescript
// useCartValidation.ts
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMenu } from "@/lib/hooks/useMenu";
import type { CartItem } from "@/types/cart";
import type { MenuItem, MenuCategory } from "@/types/menu";

interface ValidationResult {
  status: "idle" | "validating" | "done" | "error";
  soldOut: CartItem[];
  unavailable: CartItem[];
  priceChanged: Array<{ item: CartItem; newPrice: number; direction: "up" | "down" }>;
  valid: CartItem[];
  suggestions: Map<string, MenuItem[]>; // cartItemId -> suggestions
}

function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsubFinish = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCartStore.persist.hasHydrated());
    return () => {
      unsubFinish();
    };
  }, []);
  return hydrated;
}

export function useCartValidation(): ValidationResult {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const { data: menuData, isLoading, error } = useMenu();

  // Only validate when hydrated AND menu data available
  // Memoize validation result based on items + menuData
  // ...
}
```

### Pattern 2: Validation Data Flow

**What:** Use existing `/api/menu` via `useMenu()` as validation source. No dedicated endpoint.
**Rationale:**

- Menu API already returns `isActive`, `isSoldOut`, `basePriceCents` per item
- React Query caches with 5-min staleTime, auto-refetches on mount
- Avoids new API endpoint + route + server query
- Same data used on menu page -- consistent

**Data flow:**

1. Cart page/drawer mounts
2. `useCartHydrated()` waits for Zustand `persist` rehydration
3. `useMenu()` fetches/returns cached menu data
4. `useCartValidation()` compares cart items against menu items
5. Returns categorized results: soldOut, unavailable, priceChanged, valid
6. Components render based on validation status

### Pattern 3: Inline Suggestions from Same Category

**What:** For sold-out/unavailable items, find 3 available items from the same category.
**Logic:**

```typescript
function getSuggestions(cartItem: CartItem, categories: MenuCategory[]): MenuItem[] {
  // Find the category containing this item
  const category = categories.find((cat) =>
    cat.items.some((item) => item.id === cartItem.menuItemId)
  );
  if (!category) return [];

  // Return up to 3 active, non-sold-out items from same category (excluding current)
  return category.items
    .filter((item) => item.id !== cartItem.menuItemId && item.isActive && !item.isSoldOut)
    .slice(0, 3);
}
```

### Pattern 4: Price Dismissal Persistence

**What:** When user taps "Price updated" badge, update `basePriceCents` in the persisted cart.
**Implementation:** Add `updateItemPrice(cartItemId, newPriceCents)` to cart store.

```typescript
updateItemPrice: (cartItemId: string, newPriceCents: number) => {
  set((state) => ({
    items: state.items.map((item) =>
      item.cartItemId === cartItemId
        ? { ...item, basePriceCents: newPriceCents }
        : item
    ),
  }));
},
```

### Pattern 5: Cart Item Edit via Bottom Sheet

**What:** Tapping a cart item opens ItemDetailSheet (existing component) pre-filled with current selections.
**Reuse:** `ItemDetailSheet` already handles modifiers, quantity, notes. Need to pre-fill from cart item data and update (vs add) on confirm.

### Anti-Patterns to Avoid

- **Validation before hydration:** Zustand persist loads from localStorage asynchronously. Running validation before `hasHydrated()` returns true will compare against empty cart, triggering false positives.
- **Separate validation API endpoint:** Unnecessary complexity. The `/api/menu` response already contains all needed fields.
- **Blocking checkout on network error:** Decision says silent fail on API errors -- backend validates on order submit anyway.
- **AnimatePresence mode="popLayout":** Already known to crash mobile (see existing code comments). Use mode="sync" for cart item lists.
- **Infinite Framer Motion animations:** Already known to cause mobile Safari crashes. Cart validation UI must use static/finite animations only.

## Don't Hand-Roll

| Problem             | Don't Build                 | Use Instead                                                   | Why                                             |
| ------------------- | --------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Hydration detection | Custom localStorage polling | Zustand `persist.hasHydrated()` + `onFinishHydration()`       | Race-free, official API                         |
| Menu data fetching  | Manual fetch + state        | `useMenu()` React Query hook                                  | Caching, deduplication, error handling built-in |
| Price formatting    | Manual string building      | `formatPrice()` from `src/lib/utils/format.ts`                | Consistent currency formatting                  |
| Spring animations   | Custom CSS transitions      | `spring.*` presets from `src/lib/motion-tokens/core.ts`       | Design system consistency                       |
| Swipe to delete     | Custom touch handlers       | Existing `CartItem` component with `drag="x"`                 | Already implemented with haptics                |
| Quantity control    | Custom input                | Existing `QuantitySelector` component                         | Animated, haptic feedback                       |
| Bottom sheet        | Custom overlay              | Existing `Drawer` component with `position="bottom"`          | Focus trap, scroll lock, swipe dismiss          |
| Clear cart          | Custom confirmation flow    | Existing `ClearCartConfirmation` + `useClearCartConfirmation` | Already wired up                                |

**Key insight:** 80% of the cart page UI already exists in the cart drawer. The cart page is primarily a re-composition of existing components into a full-page layout with category grouping and the attention section overlay.

## Common Pitfalls

### Pitfall 1: Zustand Hydration Race Condition

**What goes wrong:** Validation runs before cart store rehydrates from localStorage, comparing against empty array, showing "cart is empty" flash.
**Why it happens:** Zustand `persist` hydration is async. On SSR/first render, `items` is `[]`.
**How to avoid:** Gate ALL validation and cart display behind `useCartHydrated()`. Show skeleton during hydration.
**Warning signs:** Empty cart flash on page refresh when cart has items.

### Pitfall 2: Stale React Query Cache Shows Wrong Validation

**What goes wrong:** Menu data from cache is 5 minutes old, so sold-out status doesn't reflect recent admin changes.
**Why it happens:** `useMenu()` has `staleTime: 5 * 60 * 1000`.
**How to avoid:** On cart page mount, force refetch with `refetch()` or set `staleTime: 0` for the cart page instance. The decision says "validate on mount" -- this means fresh data, not cached.
**Warning signs:** Items show as available when admin just marked them sold out.

### Pitfall 3: Category Lookup for Unavailable Items

**What goes wrong:** If an item was removed from the menu (is_active=false), it won't appear in `/api/menu` response (which filters `is_active=true`). Can't find its category for suggestions.
**Why it happens:** The API only returns active items. Removed items literally don't exist in the response.
**How to avoid:** Cart items don't store `categoryId`. For unavailable items (not found in menu response), suggestions can't be category-matched from menu data alone. Options: (a) store `categoryId` on cart item when adding, (b) skip suggestions for truly removed items, or (c) add a lightweight lookup.
**Recommendation:** Add `categoryId` to `CartItem` type when items are added. This is a small schema addition that pays off.

### Pitfall 4: Minimum Order Amount Not Available Client-Side

**What goes wrong:** The checkout gate needs minimum order amount, but it's stored in `app_settings` table behind the admin API.
**Why it happens:** No public API endpoint exposes `minimum_order_cents`.
**How to avoid:** Either hardcode default ($25.00 from settings-defaults.ts), create a lightweight public endpoint, or embed it in the menu API response. Hardcoded default is simplest for V1 -- it matches the settings default of 2500 cents.
**Recommendation:** Hardcode `MINIMUM_ORDER_CENTS = 2500` as a constant (matches existing default). Can be made dynamic in a future phase.

### Pitfall 5: Cart Item Replacement Quantity Carry-Over

**What goes wrong:** When replacing a sold-out item with a suggestion, the replacement should carry the original quantity, but the replacement MenuItem has no quantity concept.
**Why it happens:** MenuItem and CartItem are different types.
**How to avoid:** When handling suggestion tap: `removeItem(oldCartItemId)` then `addItem({ ...newMenuItem, quantity: oldItem.quantity })`. Must extract quantity before removing.

### Pitfall 6: Mobile Performance with Validation Overlays

**What goes wrong:** Adding gray overlays, badges, and suggestion rows to every cart item causes layout thrashing on mobile.
**Why it happens:** Each overlay adds DOM nodes + framer motion wrappers.
**How to avoid:** Keep overlays simple (CSS opacity + absolute positioning). No layout animations on the overlays themselves. Static badges (no infinite animations -- per existing learnings).

## Code Examples

### Zustand Hydration Hook (Verified Pattern)

```typescript
// Source: Zustand v5.0.8 official docs
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";

export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubFinish = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    // Check if already hydrated (e.g., navigating back to page)
    setHydrated(useCartStore.persist.hasHydrated());

    return () => {
      unsubFinish();
    };
  }, []);

  return hydrated;
}
```

### Cart Item with Validation Overlay

```typescript
// Extends existing CartItem component
interface CartItemWithValidationProps extends CartItemProps {
  validationStatus?: "valid" | "sold-out" | "unavailable" | "price-changed";
  priceDirection?: "up" | "down";
  newPrice?: number;
  onDismissPriceChange?: () => void;
  onRemove?: () => void;
  suggestions?: MenuItem[];
  onReplace?: (suggestion: MenuItem) => void;
}
```

### Category-Grouped Cart Items

```typescript
// Group cart items by category for display
function groupByCategory(
  items: CartItem[],
  categories: MenuCategory[]
): Map<string, { name: string; items: CartItem[] }> {
  const grouped = new Map<string, { name: string; items: CartItem[] }>();

  for (const item of items) {
    const category = categories.find((cat) => cat.items.some((mi) => mi.id === item.menuItemId));
    const key = category?.id ?? "other";
    const name = category?.name ?? "Other";

    if (!grouped.has(key)) {
      grouped.set(key, { name, items: [] });
    }
    grouped.get(key)!.items.push(item);
  }

  return grouped;
}
```

### Checkout Gate Component

```typescript
// Warning banner above checkout button
interface CheckoutGateProps {
  staleCount: number;
  minimumShortfall: number; // in cents, 0 = met
  onScrollToAttention: () => void;
  onCheckout: () => void;
}

// Combined message: "2 items need attention * $5 below minimum"
// Tappable -> smooth scrolls to attention section
// Checkout button: disabled gray -> active green pulse transition
```

### Smooth Scroll to Attention Section

```typescript
const attentionRef = useRef<HTMLDivElement>(null);

const scrollToAttention = () => {
  attentionRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};
```

## Discretion Recommendations

### Quantity Stepper Style

**Recommendation:** Use existing `QuantitySelector` (+/- buttons). Already implemented with haptic feedback and rubbery animations. No reason to switch to dropdown.

### Zero-Quantity Removal

**Recommendation:** Direct remove (no confirm). Existing CartItem already removes on decrement when quantity=1. Consistent behavior.

### Empty Cart State

**Recommendation:** Reuse existing `CartEmptyState` component. It already has a friendly design with shopping bag icon and "Browse Menu" CTA. No need for a custom mascot.

### Order Summary Sticky Behavior

**Recommendation:** `lg:sticky lg:top-24` on desktop (matches checkout page pattern in `CheckoutPage`). Not sticky on mobile (per decision -- button below summary).

### Attention Section Collapsible vs Always Expanded

**Recommendation:** Always expanded. The decision says items "float to top" and the section "animates collapse when last issue is resolved." Collapsed-by-default would hide urgent issues. Keep expanded; AnimatePresence handles the collapse when all issues resolved.

### Skeleton Count During Validation

**Recommendation:** Match actual cart item count. The cart items are already known from Zustand (after hydration). Show N skeleton cards matching N cart items. This feels more accurate than a fixed count.

### Validation Caching and Re-entry Strategy

**Recommendation:**

- First mount: Force-refetch menu data (`refetchOnMount: 'always'` or explicit `refetch()`)
- Re-entry (switching tabs, back navigation): Use React Query cache if < 30 seconds old, otherwise refetch
- Cart drawer: Same validation as cart page, uses same `useCartValidation` hook
- Implementation: `useMenu()` with `staleTime: 0` specifically for the validation use case, or a dedicated `useMenuForValidation()` wrapper that forces fresh data

### API Data Source

**Recommendation:** Existing `/api/menu` via `useMenu()`. No dedicated validation endpoint needed. The response contains `isActive`, `isSoldOut`, `basePriceCents` -- everything needed. Force-refetch on mount for freshness.

### Store Hours Check

**Recommendation:** Out of scope for this phase. Store hours exist in `app_settings` behind admin API. No customer-facing store hours check exists yet. The cart page can function without it -- if the store is closed, checkout will fail at the delivery time selection step. Flag for future enhancement.

## State of the Art

| Old Approach                             | Current Approach                                           | When Changed          | Impact                                                     |
| ---------------------------------------- | ---------------------------------------------------------- | --------------------- | ---------------------------------------------------------- |
| Zustand v4 `onRehydrateStorage` callback | Zustand v5 `persist.hasHydrated()` + `onFinishHydration()` | Zustand v5            | Cleaner hydration detection; no internal state flag needed |
| AnimatePresence `mode="popLayout"`       | `mode="sync"`                                              | Per project learnings | popLayout crashes mobile with layout thrashing             |
| Infinite FM animations                   | Static/finite animations                                   | Per project learnings | Prevents mobile Safari crashes                             |

## Open Questions

1. **CategoryId on CartItem**
   - What we know: Cart items store `menuItemId` but not `categoryId`. For unavailable items (removed from menu), we can't determine their category for suggestions.
   - What's unclear: Is it acceptable to add `categoryId` to the CartItem type? This is a schema change affecting persisted data.
   - Recommendation: Add `categoryId?: string` as optional field. Existing items without it gracefully degrade (no suggestions for items missing categoryId). New items added after this phase will have it.

2. **Minimum Order Constant vs Dynamic**
   - What we know: Default is 2500 cents ($25), stored in `app_settings`. No public API for it.
   - What's unclear: Does the admin ever change this value?
   - Recommendation: Hardcode `MINIMUM_ORDER_CENTS = 2500` for this phase. Add TODO for dynamic fetching.

3. **Cart Drawer Validation UX with Skeletons**
   - What we know: Decision says cart drawer shows full stale UX with skeleton during validation.
   - What's unclear: The cart drawer currently renders items immediately. Adding skeleton-then-validated-items creates a visual flash.
   - Recommendation: Show items immediately with subtle loading indicator (e.g., pulsing border), then overlay validation results. Avoids content flash in drawer context.

4. **Item Edit Bottom Sheet Data Source**
   - What we know: Decision says tapping cart item opens bottom sheet for editing. `ItemDetailSheet` exists and handles modifiers/quantity.
   - What's unclear: ItemDetailSheet takes a `MenuItem` (from menu API), but cart items have `CartItem` type. Need to look up the full MenuItem from menu data to get modifier groups for editing.
   - Recommendation: Use `useMenu()` data to find the full `MenuItem` by ID. If item is unavailable (not in menu), editing is disabled.

## Sources

### Primary (HIGH confidence)

- Zustand v5.0.8 official docs (via Context7) - persist hydration API: `hasHydrated()`, `onFinishHydration()`, `onHydrate()`
- Codebase analysis: `src/lib/stores/cart-store.ts`, `src/types/cart.ts`, `src/types/menu.ts`, `src/lib/queries/menu.ts`, `src/app/api/menu/route.ts`
- Codebase analysis: All cart components in `src/components/ui/cart/`
- Codebase analysis: `src/lib/utils/order.ts` (server-side validation patterns)
- Codebase analysis: `src/lib/hooks/useMenu.ts` (React Query menu hook)

### Secondary (MEDIUM confidence)

- Project learnings: `.claude/learnings/state-management.md` (cart deduplication, debounce)
- Project learnings: `.claude/learnings/react-patterns.md` (hydration, event listeners)
- Project learnings: `.claude/learnings/animation.md` (skeleton structure, mobile safety)

### Tertiary (LOW confidence)

- Minimum order default of 2500 cents -- derived from `settings-defaults.ts`, but could be overridden by admin

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all libraries already in use, versions verified from package.json
- Architecture: HIGH - patterns derived from existing codebase conventions
- Pitfalls: HIGH - most identified from direct codebase analysis and project learnings
- Hydration API: HIGH - verified via Context7 against Zustand v5.0.8 docs

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable domain, no external API dependencies)
