# Phase 4: Cart Experience - Research

**Researched:** 2026-01-22
**Domain:** Cart UI, gesture interactions, celebration animations
**Confidence:** HIGH

## Summary

Phase 4 builds the cart experience with delightful animations and intuitive interactions. The good news: substantial cart infrastructure already exists in the codebase, including a complete Zustand store, cart types, animation variants, and even a working CartDrawer component.

The phase focus should be on:
1. Creating V8-consistent cart components using Phase 2 overlay primitives
2. Implementing the celebration animation (fly-to-cart)
3. Integrating cart button into AppShell header slot
4. Ensuring all animations match the "over-the-top animated" vision

**Primary recommendation:** Refactor existing CartDrawer to compose V8 Drawer/BottomSheet primitives and add missing celebration animations using GSAP Flip.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 4.x | Cart state management | Already used, persists to localStorage |
| Framer Motion | 11.x | UI animations | Already used for overlays, springs |
| GSAP | 3.x | Complex animations | Flip plugin for fly-to-cart, SplitText registered |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @gsap/react | 2.x | useGSAP hook | All GSAP animations in components |
| lucide-react | 0.x | Icons | ShoppingCart, Trash2, Plus, Minus |
| uuid | 9.x | Cart item IDs | Already generating cartItemId |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP Flip | CSS transitions | FLIP provides smoother cross-element animations |
| Framer AnimatePresence | GSAP | Framer already handles list animations well |

**Installation:** No new packages needed - all dependencies exist.

## Architecture Patterns

### Existing Cart Directory Structure
```
src/
├── types/
│   └── cart.ts                    # CartItem, CartStore, constants (EXISTS)
├── lib/
│   ├── stores/
│   │   └── cart-store.ts          # Zustand store with persist (EXISTS)
│   ├── hooks/
│   │   ├── useCart.ts             # Cart convenience hook (EXISTS)
│   │   └── useCartDrawer.ts       # Drawer open/close state (EXISTS)
│   └── animations/
│       └── cart.ts                # Animation variants (EXISTS)
├── components/
│   ├── cart/
│   │   ├── CartDrawer.tsx         # Existing drawer (NEEDS V8 REFACTOR)
│   │   ├── CartItem.tsx           # Existing item (NEEDS V8 REFACTOR)
│   │   └── cart-button.tsx        # Header button (NEEDS V8 REFACTOR)
│   └── ui-v8/
│       ├── Drawer.tsx             # V8 primitive (USE THIS)
│       ├── BottomSheet.tsx        # V8 primitive (USE THIS)
│       └── cart/                  # NEW V8 cart components
│           ├── CartDrawerV8.tsx   # Composes Drawer/BottomSheet
│           ├── CartItemV8.tsx     # V8 item component
│           ├── CartButtonV8.tsx   # V8 header button
│           ├── CartSummary.tsx    # Subtotal + free delivery
│           └── FlyToCart.tsx      # Celebration animation
```

### Pattern 1: Responsive Cart Container
**What:** CartDrawerV8 renders as BottomSheet on mobile, Drawer on desktop
**When to use:** Responsive overlay patterns
**Example:**
```typescript
// Source: Existing CartDrawer.tsx pattern
export function CartDrawerV8() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { isOpen, close } = useCartDrawer();

  // Single state, dual presentation
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={close} height="full">
        <CartContent />
      </BottomSheet>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={close} side="right" width="lg">
      <CartContent />
    </Drawer>
  );
}
```

### Pattern 2: Animation Preference Integration
**What:** All animations respect useAnimationPreference
**When to use:** Every animated component
**Example:**
```typescript
// Source: Existing CartItem.tsx pattern
const { shouldAnimate, getSpring } = useAnimationPreference();

<motion.div
  drag={shouldAnimate ? "x" : false}
  whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
  transition={getSpring(spring.snappy)}
/>
```

### Pattern 3: GSAP Flip for Fly-to-Cart
**What:** Element flies from source to destination with arc
**When to use:** Add-to-cart celebration
**Example:**
```typescript
// Source: src/lib/animations/cart.ts calculateFlyToCartPath
import { gsap, Flip } from "@/lib/gsap";

function triggerFlyToCart(sourceEl: HTMLElement, targetEl: HTMLElement) {
  // Get initial state
  const state = Flip.getState(sourceEl);

  // Clone and position at target
  const clone = sourceEl.cloneNode(true);
  targetEl.appendChild(clone);

  // Animate from source to target
  Flip.from(state, {
    targets: clone,
    duration: 0.6,
    ease: "power2.inOut",
    scale: true,
    absolute: true,
    onComplete: () => {
      clone.remove();
      // Trigger badge pulse
    }
  });
}
```

### Anti-Patterns to Avoid
- **Direct GSAP import:** Always use `import { gsap } from "@/lib/gsap"` - plugins must be registered
- **Hardcoded z-index:** Use zIndex tokens from `@/design-system/tokens/z-index`
- **Skipping animation preference:** Always check `shouldAnimate` before animating
- **Custom scroll lock:** Use `useBodyScrollLock` hook from Phase 2

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cart state | Custom useState | `useCartStore` | Persistence, computed values |
| Drawer open/close | Custom boolean | `useCartDrawer` | Already exists |
| Swipe-to-delete | Touch handlers | `useSwipeToDelete` | Threshold, velocity, haptic |
| Swipe-to-close | Custom pan | `useSwipeToClose` | Already in BottomSheet |
| Number animation | Custom counter | `PriceTicker` | Digit flip animation |
| Badge pulse | Custom keyframes | `badgePop` variant | In cart.ts animations |
| Focus trap | Manual tab handling | Drawer component | Built into V8 Drawer |
| Body scroll lock | overflow: hidden | `useBodyScrollLock` | Handles scroll position |

**Key insight:** Most cart functionality exists - the work is integration and V8 consistency.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Cart State
**What goes wrong:** Server renders empty cart, client has items
**Why it happens:** Zustand persist loads from localStorage on client
**How to avoid:** Use `suppressHydrationWarning` or render cart count only on client
**Warning signs:** Console hydration errors, flash of wrong content

```typescript
// Safe pattern
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <CartButtonSkeleton />;
```

### Pitfall 2: Stale Closures in Drag Handlers
**What goes wrong:** Handler references old state
**Why it happens:** useCallback dependencies not updated
**How to avoid:** Include all dependencies or use refs
**Warning signs:** Delete triggers on wrong item

### Pitfall 3: Z-Index Stacking for Flying Element
**What goes wrong:** Flying element hidden behind other content
**Why it happens:** Need highest z-index for animation
**How to avoid:** Use Portal with z-index above modal (z-popover: 60)
**Warning signs:** Element disappears mid-flight

### Pitfall 4: Memory Leaks from Animation Cleanup
**What goes wrong:** GSAP animations continue after unmount
**Why it happens:** No cleanup in useEffect
**How to avoid:** Use `useGSAP` hook with context/scope
**Warning signs:** Console warnings, jerky animations

## Code Examples

### Existing Cart Store Usage
```typescript
// Source: src/lib/hooks/useCart.ts
export function useCart() {
  const store = useCartStore();
  return {
    items: store.items,
    itemCount: store.getItemCount(),
    itemsSubtotal: store.getItemsSubtotal(),
    estimatedDeliveryFee: store.getEstimatedDeliveryFee(),
    estimatedTotal: store.getItemsSubtotal() + store.getEstimatedDeliveryFee(),
    isEmpty: store.items.length === 0,
    amountToFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - store.getItemsSubtotal()),
    addItem: store.addItem,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    getItemTotal: store.getItemTotal,
  };
}
```

### Existing Swipe-to-Delete Pattern
```typescript
// Source: src/components/cart/CartItem.tsx
const dragX = useMotionValue(0);
const swipeProgress = useTransform(dragX, [-150, 0], [1, 0]);

<motion.div
  drag={shouldAnimate ? "x" : false}
  dragConstraints={{ left: -150, right: 0 }}
  dragElastic={{ left: 0.1, right: 0 }}
  onDragEnd={handleDragEnd}
  style={{ x: dragX }}
>
  <CartItemContent />
</motion.div>
```

### Existing Quantity Animation Pattern
```typescript
// Source: src/components/cart/CartItem.tsx QuantitySelector
<AnimatePresence mode="popLayout" initial={false}>
  <motion.span
    key={quantity}
    initial={{ y: direction === "up" ? 20 : -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: direction === "up" ? -20 : 20, opacity: 0 }}
    transition={getSpring(spring.snappy)}
  >
    {quantity}
  </motion.span>
</AnimatePresence>
```

### Existing Badge Animation
```typescript
// Source: src/lib/animations/cart.ts
export const badgeVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: springPresets.bouncy },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  pop: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.25, times: [0, 0.5, 1] },
  },
};
```

### Existing Free Delivery Progress
```typescript
// Source: src/components/cart/CartDrawer.tsx CartSummary
<motion.div
  className="h-2 bg-surface-tertiary rounded-full overflow-hidden"
  initial={{ width: 0 }}
  animate={{ width: `${progressPercent}%` }}
  transition={getSpring(spring.rubbery)}
/>
```

## Existing vs New Implementation

### Already Exists (Reuse)
| Component/Hook | Location | Status |
|---------------|----------|--------|
| `useCartStore` | src/lib/stores/cart-store.ts | Complete, well-tested |
| `useCart` | src/lib/hooks/useCart.ts | Complete |
| `useCartDrawer` | src/lib/hooks/useCartDrawer.ts | Complete |
| Cart types | src/types/cart.ts | Complete |
| `PriceTicker` | src/components/ui/PriceTicker.tsx | Complete with animations |
| Animation variants | src/lib/animations/cart.ts | Comprehensive |
| Swipe gestures | src/lib/swipe-gestures.ts | Complete |
| V8 Drawer | src/components/ui-v8/Drawer.tsx | Complete |
| V8 BottomSheet | src/components/ui-v8/BottomSheet.tsx | Complete |

### Needs V8 Refactor
| Component | Current Location | Issue |
|-----------|-----------------|-------|
| CartDrawer | src/components/cart/CartDrawer.tsx | Not using V8 Drawer/BottomSheet primitives |
| CartItem | src/components/cart/CartItem.tsx | Inconsistent with V8 patterns |
| CartButton | src/components/cart/cart-button.tsx | Needs integration with Header slot |

### New Implementation Needed
| Component | Purpose |
|-----------|---------|
| FlyToCartAnimation | GSAP Flip celebration animation |
| ClearCartConfirmation | Modal with confirmation |
| CartButtonV8 | Integrated with AppShell header |

## Integration Points

### AppShell Header Integration
The V8 Header accepts `rightContent` prop for cart button:

```typescript
// Source: src/components/ui-v8/navigation/AppShell.tsx
<Header
  navItems={navItems}
  rightContent={headerSlot}  // <-- Cart button goes here
  onMenuClick={() => setIsMobileMenuOpen(true)}
/>

// Usage in layout
<AppShell headerSlot={<CartButtonV8 />}>
  {children}
</AppShell>
```

### Cart Badge Target for Fly-to-Cart
The CartButton needs a ref for fly-to-cart destination:

```typescript
// CartButtonV8 needs to expose badge ref
const cartBadgeRef = useRef<HTMLSpanElement>(null);

// Global context or zustand for coordination
export const useCartAnimationTarget = create(() => ({
  badgeRef: null as React.RefObject<HTMLElement> | null,
  setBadgeRef: (ref) => set({ badgeRef: ref }),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions | Framer Motion springs | V7 | More natural motion |
| Custom drag handlers | useSwipeToDelete hook | V5 | Consistent gestures |
| Manual localStorage | Zustand persist | V4 | Automatic persistence |
| Static prices | PriceTicker animation | V5 | Delightful number changes |

**Deprecated/outdated:**
- src/components/cart/cart-item.tsx (V4): Use CartItem.tsx instead
- Manual body scroll lock: Use useBodyScrollLock hook

## Open Questions

Things that couldn't be fully resolved:

1. **Fly-to-cart source element**
   - What we know: Target is cart badge in header
   - What's unclear: How to get ref to source (menu item add button)
   - Recommendation: Pass source rect via event or context when triggering add

2. **Mobile gesture conflict**
   - What we know: BottomSheet has swipe-to-close, CartItem has swipe-to-delete
   - What's unclear: Do they conflict when item is inside sheet?
   - Recommendation: Test thoroughly, may need touch-action constraints

3. **Clear cart confirmation timing**
   - What we know: Need confirmation before clearing
   - What's unclear: Modal vs Toast with undo vs inline confirm
   - Recommendation: Modal for destructive action (matches user expectations)

## Sources

### Primary (HIGH confidence)
- `/src/lib/stores/cart-store.ts` - Complete cart implementation
- `/src/lib/animations/cart.ts` - Animation variants
- `/src/lib/swipe-gestures.ts` - Swipe hooks
- `/src/components/ui-v8/Drawer.tsx` - V8 drawer primitive
- `/src/components/ui-v8/BottomSheet.tsx` - V8 bottom sheet primitive
- `/src/lib/gsap/index.ts` - GSAP with Flip plugin registered

### Secondary (MEDIUM confidence)
- `/src/components/cart/CartDrawer.tsx` - Existing implementation (reference)
- `/src/components/cart/CartItem.tsx` - Existing implementation (reference)

### Tertiary (LOW confidence)
- None - all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used
- Architecture: HIGH - Patterns established in Phases 2-3
- Pitfalls: HIGH - Based on existing code patterns

**Research date:** 2026-01-22
**Valid until:** Stable - cart patterns well-established

## Recommended Plan Structure

Based on research, suggest 4-5 plans:

1. **Cart Button & Header Integration**
   - CartButtonV8 with badge animation
   - Integration into AppShell headerSlot
   - Badge ref setup for fly-to-cart target

2. **Cart Drawer/Sheet (V8)**
   - CartDrawerV8 composing Drawer/BottomSheet
   - Responsive behavior (mobile vs desktop)
   - CartSummary with free delivery progress

3. **Cart Item (V8)**
   - CartItemV8 with swipe-to-delete
   - Quantity controls with number animation
   - Animation preference integration

4. **Celebration Animations**
   - Fly-to-cart using GSAP Flip
   - Badge pulse on item add
   - Coordinated animation sequence

5. **Clear Cart & Edge Cases**
   - Clear cart confirmation modal
   - Empty state animation
   - Error handling for edge cases
