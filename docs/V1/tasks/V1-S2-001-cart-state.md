# Task: V1-S2-001 — Cart State (Zustand)

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V1-S1-001 (Menu Data Layer)
> **Branch**: `feat/cart-state`

---

## Objective

Implement the cart state management using Zustand with localStorage persistence. The cart store manages adding, updating, and removing items, as well as computing subtotals and delivery fees for UI display. This is the foundation for the entire cart and checkout flow.

---

## Acceptance Criteria

- [ ] Zustand store created with proper TypeScript types
- [ ] `addItem` action adds items with modifiers and notes
- [ ] `updateQuantity` action updates item quantity (1-50 range)
- [ ] `removeItem` action removes items by cartItemId
- [ ] `clearCart` action empties the cart
- [ ] Cart persists across page refreshes (localStorage)
- [ ] `getItemsSubtotal()` computes correct total with modifiers
- [ ] `getEstimatedDeliveryFee()` returns fee based on $100 threshold
- [ ] `getItemCount()` returns total quantity of all items
- [ ] Cart types defined in `types/cart.ts`
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Cart Types

Create `src/types/cart.ts`:

```typescript
export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}

export interface CartItem {
  cartItemId: string; // Client-generated UUID
  menuItemId: string;
  menuItemSlug: string;
  nameEn: string;
  nameMy: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes: string;
  addedAt: string; // ISO timestamp
}

export interface CartStore {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'cartItemId' | 'addedAt'>) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;

  // Computed (for UI display only - server recalculates at checkout)
  getItemsSubtotal: () => number;
  getEstimatedDeliveryFee: () => number;
  getItemCount: () => number;
  getItemTotal: (cartItemId: string) => number;
}

// Constants
export const DELIVERY_FEE_CENTS = 1500; // $15
export const FREE_DELIVERY_THRESHOLD_CENTS = 10000; // $100
export const MAX_ITEM_QUANTITY = 50;
export const MAX_CART_ITEMS = 50;
```

### 2. Cart Store Implementation

Install Zustand with persist middleware:

```bash
pnpm add zustand
```

Create `src/lib/stores/cart-store.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { CartStore, CartItem } from '@/types/cart';
import {
  DELIVERY_FEE_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  MAX_ITEM_QUANTITY,
  MAX_CART_ITEMS,
} from '@/types/cart';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();

        // Check cart limit
        if (items.length >= MAX_CART_ITEMS) {
          console.warn('Cart limit reached');
          return;
        }

        const newItem: CartItem = {
          ...item,
          cartItemId: uuidv4(),
          addedAt: new Date().toISOString(),
          quantity: Math.min(Math.max(1, item.quantity), MAX_ITEM_QUANTITY),
        };

        set({ items: [...items, newItem] });
      },

      updateQuantity: (cartItemId, quantity) => {
        const clampedQty = Math.min(Math.max(1, quantity), MAX_ITEM_QUANTITY);

        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: clampedQty }
              : item
          ),
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemsSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const modifierTotal = item.modifiers.reduce(
            (sum, mod) => sum + mod.priceDeltaCents,
            0
          );
          const itemTotal = (item.basePriceCents + modifierTotal) * item.quantity;
          return total + itemTotal;
        }, 0);
      },

      getEstimatedDeliveryFee: () => {
        const subtotal = get().getItemsSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemTotal: (cartItemId) => {
        const item = get().items.find((i) => i.cartItemId === cartItemId);
        if (!item) return 0;

        const modifierTotal = item.modifiers.reduce(
          (sum, mod) => sum + mod.priceDeltaCents,
          0
        );
        return (item.basePriceCents + modifierTotal) * item.quantity;
      },
    }),
    {
      name: 'mms-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

### 3. Cart Hook for Components

Create `src/lib/hooks/useCart.ts`:

```typescript
import { useCartStore } from '@/lib/stores/cart-store';
import { formatPrice } from '@/lib/utils/format';

export function useCart() {
  const store = useCartStore();

  return {
    items: store.items,
    itemCount: store.getItemCount(),
    itemsSubtotal: store.getItemsSubtotal(),
    estimatedDeliveryFee: store.getEstimatedDeliveryFee(),
    estimatedTotal: store.getItemsSubtotal() + store.getEstimatedDeliveryFee(),
    isEmpty: store.items.length === 0,

    // Formatted values for display
    formattedSubtotal: formatPrice(store.getItemsSubtotal()),
    formattedDeliveryFee: formatPrice(store.getEstimatedDeliveryFee()),
    formattedTotal: formatPrice(store.getItemsSubtotal() + store.getEstimatedDeliveryFee()),

    // Amount needed for free delivery
    amountToFreeDelivery: Math.max(0, 10000 - store.getItemsSubtotal()),

    // Actions
    addItem: store.addItem,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    getItemTotal: store.getItemTotal,
  };
}
```

### 4. Price Formatting Utility

Create `src/lib/utils/format.ts`:

```typescript
/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted price string (e.g., "$12.50")
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Format cents to dollar string without symbol
 * @param cents - Amount in cents
 * @returns Formatted number string (e.g., "12.50")
 */
export function formatPriceValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

### 5. UUID Dependency

Install UUID for cart item IDs:

```bash
pnpm add uuid
pnpm add -D @types/uuid
```

---

## Test Plan

### Unit Tests

Create `src/lib/stores/__tests__/cart-store.test.ts`:

```typescript
import { useCartStore } from '../cart-store';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('adds item to cart', () => {
      const store = useCartStore.getState();
      store.addItem({
        menuItemId: 'item-1',
        menuItemSlug: 'mohinga',
        nameEn: 'Mohinga',
        nameMy: 'မုန့်ဟင်းခါး',
        imageUrl: null,
        basePriceCents: 1200,
        quantity: 1,
        modifiers: [],
        notes: '',
      });

      expect(store.items).toHaveLength(1);
      expect(store.items[0].menuItemId).toBe('item-1');
    });

    it('clamps quantity to MAX_ITEM_QUANTITY', () => {
      const store = useCartStore.getState();
      store.addItem({
        menuItemId: 'item-1',
        menuItemSlug: 'mohinga',
        nameEn: 'Mohinga',
        nameMy: null,
        imageUrl: null,
        basePriceCents: 1200,
        quantity: 100,
        modifiers: [],
        notes: '',
      });

      expect(store.items[0].quantity).toBe(50);
    });
  });

  describe('getItemsSubtotal', () => {
    it('calculates subtotal with modifiers', () => {
      const store = useCartStore.getState();
      store.addItem({
        menuItemId: 'item-1',
        menuItemSlug: 'mohinga',
        nameEn: 'Mohinga',
        nameMy: null,
        imageUrl: null,
        basePriceCents: 1200,
        quantity: 2,
        modifiers: [
          { groupId: 'g1', groupName: 'Spice', optionId: 'o1', optionName: 'Extra', priceDeltaCents: 100 },
        ],
        notes: '',
      });

      // (1200 + 100) * 2 = 2600
      expect(store.getItemsSubtotal()).toBe(2600);
    });
  });

  describe('getEstimatedDeliveryFee', () => {
    it('returns $15 fee when under $100', () => {
      const store = useCartStore.getState();
      store.addItem({
        menuItemId: 'item-1',
        menuItemSlug: 'mohinga',
        nameEn: 'Mohinga',
        nameMy: null,
        imageUrl: null,
        basePriceCents: 5000,
        quantity: 1,
        modifiers: [],
        notes: '',
      });

      expect(store.getEstimatedDeliveryFee()).toBe(1500);
    });

    it('returns $0 fee when at or above $100', () => {
      const store = useCartStore.getState();
      store.addItem({
        menuItemId: 'item-1',
        menuItemSlug: 'mohinga',
        nameEn: 'Mohinga',
        nameMy: null,
        imageUrl: null,
        basePriceCents: 10000,
        quantity: 1,
        modifiers: [],
        notes: '',
      });

      expect(store.getEstimatedDeliveryFee()).toBe(0);
    });
  });
});
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Cart types defined in `src/types/cart.ts`
2. [ ] Zustand store implemented with persist middleware
3. [ ] `addItem` works with modifiers and notes
4. [ ] `updateQuantity` clamps to 1-50 range
5. [ ] `removeItem` removes by cartItemId
6. [ ] `clearCart` empties cart
7. [ ] `getItemsSubtotal` calculates correctly with modifiers
8. [ ] `getEstimatedDeliveryFee` uses $100 threshold
9. [ ] `getItemCount` returns total quantity
10. [ ] Cart persists in localStorage
11. [ ] `useCart` hook created for easy component access
12. [ ] Unit tests pass
13. [ ] `pnpm lint` passes
14. [ ] `pnpm typecheck` passes
15. [ ] `pnpm build` succeeds
16. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- **CRITICAL**: Subtotal/fee calculations in cart are for UI display ONLY. Server recalculates everything at checkout.
- Use `uuid` v4 for generating cartItemId
- Zustand persist middleware handles localStorage automatically
- The `partialize` option ensures only items array is persisted (not computed functions)
- Cart key in localStorage is `mms-cart`
- All prices are stored in cents (integers) to avoid floating point issues
- `formatPrice` utility converts cents to display dollars

---

*Task ready for implementation*
