# Task: V1-S2-002 — Cart Drawer Component

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V1-S2-001 (Cart State)
> **Branch**: `feat/cart-drawer`

---

## Objective

Create a slide-in cart drawer that displays all cart items with modifiers, allows quantity updates and item removal, shows subtotals and delivery fee messaging, and provides clear navigation to checkout. The drawer should be mobile-first with smooth animations.

---

## Acceptance Criteria

- [ ] Drawer slides in from the right
- [ ] Shows all cart items with modifiers listed
- [ ] Quantity +/- buttons per item
- [ ] Remove item (trash icon) with confirmation
- [ ] Item subtotal per line
- [ ] Cart summary section (subtotal, fee, total)
- [ ] Delivery fee threshold message
- [ ] "Continue Shopping" closes drawer
- [ ] "Checkout" button navigates to checkout (requires auth)
- [ ] Empty state with CTA to browse menu
- [ ] Badge on cart icon shows item count
- [ ] Backdrop blur with click-to-close
- [ ] Focus trap for accessibility
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Cart Drawer Component

Create `src/components/cart/CartDrawer.tsx`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useCartDrawer } from '@/lib/hooks/useCartDrawer';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { cn } from '@/lib/utils/cn';

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const { items, isEmpty, itemCount } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 z-50 h-full w-full max-w-md',
              'bg-background shadow-xl',
              'flex flex-col'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <ShoppingBag className="h-5 w-5" />
                Your Cart
                {itemCount > 0 && (
                  <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={close}
                className={cn(
                  'rounded-full p-2 hover:bg-muted',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red'
                )}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {isEmpty ? (
              <CartEmptyState onClose={close} />
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <CartItem key={item.cartItemId} item={item} />
                    ))}
                  </ul>
                </div>

                {/* Summary & Actions */}
                <div className="border-t bg-muted/30 px-4 py-4">
                  <CartSummary />
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="w-full bg-brand-red hover:bg-brand-red/90"
                      asChild
                    >
                      <a href="/checkout">Checkout</a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full"
                      onClick={close}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartEmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Browse our delicious Burmese dishes and add something to your cart!
      </p>
      <Button
        className="mt-6 bg-brand-red hover:bg-brand-red/90"
        onClick={onClose}
        asChild
      >
        <a href="/menu">Browse Menu</a>
      </Button>
    </div>
  );
}
```

### 2. Cart Item Component

Create `src/components/cart/CartItem.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/types/cart';
import { cn } from '@/lib/utils/cn';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const itemTotal = getItemTotal(item.cartItemId);

  const handleDecrement = () => {
    if (item.quantity === 1) {
      setShowConfirmRemove(true);
    } else {
      updateQuantity(item.cartItemId, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    updateQuantity(item.cartItemId, item.quantity + 1);
  };

  const handleRemove = () => {
    removeItem(item.cartItemId);
    setShowConfirmRemove(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="rounded-lg border bg-card p-3"
    >
      <div className="flex gap-3">
        {/* Image */}
        {item.imageUrl && (
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={item.imageUrl}
              alt={item.nameEn}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex flex-1 flex-col">
          <div className="flex justify-between">
            <div>
              <h4 className="font-medium">{item.nameEn}</h4>
              {item.nameMy && (
                <p className="text-xs text-muted-foreground font-myanmar">
                  {item.nameMy}
                </p>
              )}
            </div>
            <p className="font-medium">{formatPrice(itemTotal)}</p>
          </div>

          {/* Modifiers */}
          {item.modifiers.length > 0 && (
            <ul className="mt-1 text-xs text-muted-foreground">
              {item.modifiers.map((mod) => (
                <li key={mod.optionId}>
                  {mod.optionName}
                  {mod.priceDeltaCents > 0 && (
                    <span className="ml-1">
                      (+{formatPrice(mod.priceDeltaCents)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Notes */}
          {item.notes && (
            <p className="mt-1 text-xs italic text-muted-foreground">
              Note: {item.notes}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleIncrement}
                disabled={item.quantity >= 50}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setShowConfirmRemove(true)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation */}
      {showConfirmRemove && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 border-t pt-3"
        >
          <p className="text-sm text-muted-foreground">Remove this item?</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmRemove(false)}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </motion.li>
  );
}
```

### 3. Cart Drawer State Hook

Create `src/lib/hooks/useCartDrawer.ts`:

```typescript
import { create } from 'zustand';

interface CartDrawerStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCartDrawer = create<CartDrawerStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

### 4. Cart Button Component

Create `src/components/cart/CartButton.tsx`:

```typescript
'use client';

import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/hooks/useCart';
import { useCartDrawer } from '@/lib/hooks/useCartDrawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={open}
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={cn(
              'absolute -right-1 -top-1',
              'flex h-5 w-5 items-center justify-center',
              'rounded-full bg-brand-red text-[10px] font-bold text-white'
            )}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
```

### 5. Integration

Add CartDrawer to the app layout. Update `src/app/layout.tsx` or providers:

```typescript
import { CartDrawer } from '@/components/cart/CartDrawer';

// In layout
<CartDrawer />
```

Add CartButton to the header navigation.

---

## Test Plan

### Visual Testing

1. **Drawer Open/Close**
   - [ ] Drawer slides in from right
   - [ ] Backdrop appears with blur
   - [ ] Click backdrop closes drawer
   - [ ] Press Escape closes drawer
   - [ ] X button closes drawer

2. **Cart Items Display**
   - [ ] All items shown with name, modifiers, price
   - [ ] Image thumbnail displays if available
   - [ ] Burmese name shows below English name
   - [ ] Notes displayed in italics

3. **Quantity Controls**
   - [ ] + button increases quantity
   - [ ] - button decreases quantity
   - [ ] Cannot go below 1 (shows remove confirmation)
   - [ ] Cannot exceed 50

4. **Remove Flow**
   - [ ] Trash icon shows remove confirmation
   - [ ] Decrement at qty=1 shows confirmation
   - [ ] Confirm removes item with animation
   - [ ] Cancel hides confirmation

5. **Empty State**
   - [ ] Shows when cart is empty
   - [ ] CTA links to menu

6. **Cart Badge**
   - [ ] Shows item count on cart icon
   - [ ] Animates when count changes
   - [ ] Shows 99+ when over 99

### Accessibility Testing

- [ ] Focus trapped in drawer when open
- [ ] Close button focused on open
- [ ] Keyboard navigation works
- [ ] Screen reader announces drawer

### Mobile Testing

- [ ] Full width on small screens
- [ ] Scrollable item list
- [ ] Fixed footer with actions

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] CartDrawer component slides in from right
2. [ ] CartItem component displays all item details
3. [ ] Quantity controls work correctly
4. [ ] Remove with confirmation works
5. [ ] CartButton shows badge with count
6. [ ] Empty state displays correctly
7. [ ] Backdrop blur and click-to-close
8. [ ] Focus trap implemented
9. [ ] Escape key closes drawer
10. [ ] Body scroll prevented when open
11. [ ] Mobile-responsive design
12. [ ] Animations smooth (Framer Motion)
13. [ ] `pnpm lint` passes
14. [ ] `pnpm typecheck` passes
15. [ ] `pnpm build` succeeds
16. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use `AnimatePresence` for exit animations
- `layout` prop on CartItem enables smooth reordering
- Focus management is critical for accessibility
- Prevent body scroll with `overflow: hidden` when drawer open
- CartDrawer should be rendered once in app layout, not per page
- Badge animation uses `scale` for bounce effect

---

*Task ready for implementation*
