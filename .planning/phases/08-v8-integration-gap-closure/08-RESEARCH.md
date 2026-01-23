# Phase 8: V8 Integration Gap Closure - Research

**Researched:** 2026-01-23
**Domain:** Component integration, React component replacement, animation coordination
**Confidence:** HIGH

## Summary

This phase wires orphaned V8 components into the live application. Research confirms all V8 components are fully implemented and substantive. The integration gap is purely about import statements and component mounting.

**Key finding:** MenuContentV8 has a different data fetching pattern than legacy MenuContent - it fetches internally via `useMenu()` hook rather than receiving `categories` as props. This is intentional and simplifies the menu page.

**Primary recommendation:** Two changes required: (1) mount FlyToCart globally in providers.tsx, (2) replace MenuContent with MenuContentV8 in menu page, removing the server-side data fetching wrapper.

## Files Requiring Modification

### File 1: `src/app/providers.tsx`

**Current state:**
```tsx
import { CartDrawerV8 } from "@/components/ui-v8/cart";
// ... FlyToCart NOT imported
```

**Change needed:**
```tsx
import { CartDrawerV8, FlyToCart } from "@/components/ui-v8/cart";
// ... Add <FlyToCart /> after <CartDrawerV8 />
```

**Lines affected:** 6, ~28

### File 2: `src/app/(public)/menu/page.tsx`

**Current state:**
```tsx
import { MenuContent } from "@/components/menu/menu-content";
// Uses server-side data fetching: getMenuWithCategories()
// Passes categories prop: <MenuContent categories={categories} />
```

**Change needed:**
```tsx
import { MenuContentV8 } from "@/components/ui-v8/menu";
// Remove MenuLoader async component
// Use <MenuContentV8 /> directly (no props - fetches internally)
```

**Lines affected:** 3, 14, 21-24 (entire MenuLoader function)

## Prop Compatibility Analysis

| Aspect | Legacy MenuContent | MenuContentV8 | Compatible? |
|--------|-------------------|---------------|-------------|
| Props | `categories: MenuCategory[]` | `className?: string` | NO - different signature |
| Data fetching | Server-side via `getMenuWithCategories()` | Client-side via `useMenu()` hook | N/A |
| Loading state | External (Suspense fallback `MenuSkeleton`) | Internal (`MenuSkeletonV8`) | Works |
| Error handling | External (error boundary) | Internal (retry button) | Works |
| Empty state | External | Internal | Works |

**CRITICAL:** Cannot do simple import swap. Must also change component usage:
- Remove `<Suspense>` wrapper with `<MenuLoader />`
- Replace with simple `<MenuContentV8 />`

## Integration Dependencies

```
FlyToCart mount → CartButtonV8 badge ref registration → AddToCartButton fly trigger
     ^                        ^                                ^
     |                        |                                |
  providers.tsx         already working              inside ItemDetailSheetV8
                                                    (part of MenuContentV8)
```

**Order of integration:**
1. **FlyToCart in providers.tsx** - Must mount first
   - CartButtonV8 already registers badge ref on mount
   - FlyToCart uses `useCartAnimationStore` to find badge target

2. **MenuContentV8 in menu page** - After FlyToCart
   - Brings in entire V8 menu system
   - ItemDetailSheetV8 uses AddToCartButton
   - AddToCartButton uses `useFlyToCart` hook

## Current Component Relationships

### Orphaned V8 Components (will be connected by integration)

| Component | Location | Connected Via |
|-----------|----------|---------------|
| MenuContentV8 | ui-v8/menu/MenuContentV8.tsx | menu/page.tsx import |
| MenuGridV8 | ui-v8/menu/MenuGridV8.tsx | MenuContentV8 composition |
| CategoryTabsV8 | ui-v8/menu/CategoryTabsV8.tsx | MenuContentV8 composition |
| ItemDetailSheetV8 | ui-v8/menu/ItemDetailSheetV8.tsx | MenuContentV8 composition |
| SearchInputV8 | ui-v8/menu/SearchInputV8.tsx | MenuContentV8 composition |
| MenuSkeletonV8 | ui-v8/menu/MenuSkeletonV8.tsx | MenuContentV8 loading state |
| FlyToCart | ui-v8/cart/FlyToCart.tsx | providers.tsx mount |
| AddToCartButton | ui-v8/cart/AddToCartButton.tsx | ItemDetailSheetV8 composition |

### Already Integrated V8 Components (verification reference)

| Component | Location | Integrated In |
|-----------|----------|---------------|
| CartButtonV8 | ui-v8/cart/CartButtonV8.tsx | Header via rightContent slot |
| CartDrawerV8 | ui-v8/cart/CartDrawerV8.tsx | providers.tsx |
| CartItemV8 | ui-v8/cart/CartItemV8.tsx | CartDrawerV8 composition |

## Animation Coordination

### FlyToCart Animation Flow

```
1. User clicks AddToCartButton
2. AddToCartButton calls useFlyToCart().fly({ sourceElement })
3. useFlyToCart reads badgeRef from useCartAnimationStore
4. If badgeRef exists (CartButtonV8 mounted):
   - Create flying element at source position
   - GSAP animate arc path to badge position
   - On complete: remove element, trigger badge pulse
5. Concurrently: addItem() updates cart state
```

**Store coordination:**
```tsx
// cart-animation-store.ts
{
  badgeRef: RefObject<HTMLSpanElement>,  // Set by CartButtonV8 on mount
  isAnimating: boolean,                   // Prevents overlapping animations
  flyingElement: HTMLElement | null,      // Current flying element
  shouldPulseBadge: boolean,              // Triggers badge pulse
  triggerBadgePulse: () => void,          // Called by FlyToCart on complete
}
```

### Reduced Motion Support

All V8 animation components respect user preference:
- `useFlyToCart` checks `shouldAnimate` from `useAnimationPreference`
- `AddToCartButton` skips fly animation if disabled
- Badge still updates count, just without animation

## Verification Approach

### Unit Verification

1. **FlyToCart mounted:**
   ```tsx
   // In browser devtools
   document.querySelector('[data-testid="fly-to-cart-container"]') !== null
   ```

2. **MenuContentV8 rendering:**
   ```tsx
   // In React DevTools, verify MenuContentV8 component tree:
   // - CategoryTabsV8
   // - SearchInputV8
   // - MenuSectionV8 (multiple)
   // - MenuGridV8 (multiple)
   ```

### E2E Flow Verification

1. Navigate to `/menu`
2. Verify scrollspy tabs appear (MENU-01)
3. Click menu item to open detail sheet (MENU-03)
4. Click "Add to Cart" button
5. Verify flying element animates to cart badge (CART-05)
6. Verify badge count increments
7. Open cart drawer, verify item appears

### Requirement Mapping

| Requirement | Component | Verification |
|-------------|-----------|--------------|
| MENU-01 | CategoryTabsV8 | Scrollspy active tab changes on scroll |
| MENU-02 | MenuItemCardV8 | Cards render with hover effects |
| MENU-03 | ItemDetailSheetV8 | Modal opens on desktop, BottomSheet on mobile |
| MENU-04 | SearchInputV8 + SearchAutocomplete | Type to see suggestions |
| MENU-05 | MenuSkeletonV8 | Visible during initial load |
| MENU-06 | MenuGridV8 | Staggered reveal on scroll into view |
| MENU-07 | BlurImage | Blur-up placeholder on images |
| MENU-08 | FavoriteButton | Heart animation on toggle |
| MENU-09 | EmojiPlaceholder | Emoji shows for items without images |
| CART-05 | FlyToCart + AddToCartButton | Flying element + badge pulse |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation target coordination | Custom pub/sub | `useCartAnimationStore` | Already implemented, handles edge cases |
| Arc trajectory math | Manual bezier | GSAP keyframes | GSAP handles timing, easing, cleanup |
| Responsive overlay selection | Manual breakpoint | `useMediaQuery` + Modal/BottomSheet | Already abstracted in ItemDetailSheetV8 |

## Common Pitfalls

### Pitfall 1: Forgetting to Remove Server Fetch

**What goes wrong:** Adding MenuContentV8 import but keeping MenuLoader causes duplicate data fetching (server + client)
**How to avoid:** Remove entire MenuLoader function and Suspense wrapper

### Pitfall 2: Wrong Order of FlyToCart Mount

**What goes wrong:** If FlyToCart mounts before CartButtonV8, the badgeRef is null
**Why it's fine:** CartButtonV8 is already in Header, mounts before providers children. FlyToCart just needs to exist, doesn't matter if badge mounts later.

### Pitfall 3: Testing Without Network

**What goes wrong:** MenuContentV8 uses client-side fetch, needs API available
**How to avoid:** Test with dev server running (`pnpm dev`)

## Code Examples

### providers.tsx After Integration

```tsx
import { FlyToCart, CartDrawerV8 } from "@/components/ui-v8/cart";

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          {children}
          <CartDrawerV8 />
          <FlyToCart />
          {showCartBar && <CartBar />}
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

### menu/page.tsx After Integration

```tsx
import { MenuContentV8 } from "@/components/ui-v8/menu";

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      <MenuContentV8 />
    </main>
  );
}
```

Note: No Suspense needed - MenuContentV8 handles loading internally via MenuSkeletonV8.

## Open Questions

None - integration path is clear and components are verified working in isolation.

## Sources

### Primary (HIGH confidence)

- `/src/app/providers.tsx` - Current providers structure
- `/src/app/(public)/menu/page.tsx` - Current menu page implementation
- `/src/components/menu/menu-content.tsx` - Legacy MenuContent (props: categories)
- `/src/components/ui-v8/menu/MenuContentV8.tsx` - V8 menu (no props, internal fetch)
- `/src/components/ui-v8/menu/index.ts` - V8 menu barrel exports
- `/src/components/ui-v8/cart/index.ts` - V8 cart barrel exports (FlyToCart, AddToCartButton)
- `/src/components/ui-v8/cart/FlyToCart.tsx` - Fly animation implementation
- `/src/components/ui-v8/cart/AddToCartButton.tsx` - Button with fly trigger
- `/src/components/ui-v8/menu/ItemDetailSheetV8.tsx` - Uses AddToCartButton
- `/src/lib/stores/cart-animation-store.ts` - Badge ref coordination
- `/src/lib/hooks/useMenu.ts` - Client-side menu fetch
- `/.planning/v1-MILESTONE-AUDIT.md` - Integration gap analysis

## Metadata

**Confidence breakdown:**
- File modifications: HIGH - Direct file inspection
- Prop compatibility: HIGH - Type analysis of both components
- Integration order: HIGH - Store dependency analysis
- Animation flow: HIGH - Code trace through hook/store

**Research date:** 2026-01-23
**Valid until:** Indefinite (internal codebase analysis, no external dependencies)
