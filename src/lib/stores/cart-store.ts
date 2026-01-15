import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { CartItem, CartStore } from "@/types/cart";
import {
  DELIVERY_FEE_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
} from "@/types/cart";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const getStorage = (): Storage => {
  if (typeof window === "undefined") {
    return createMemoryStorage();
  }

  const storage = window.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    return createMemoryStorage();
  }

  return storage;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();

        if (items.length >= MAX_CART_ITEMS) {
          console.warn("Cart limit reached");
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
        const clampedQty = Math.min(
          Math.max(1, quantity),
          MAX_ITEM_QUANTITY
        );

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
          const itemTotal =
            (item.basePriceCents + modifierTotal) * item.quantity;
          return total + itemTotal;
        }, 0);
      },

      getEstimatedDeliveryFee: () => {
        const subtotal = get().getItemsSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD_CENTS
          ? 0
          : DELIVERY_FEE_CENTS;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemTotal: (cartItemId) => {
        const item = get().items.find((entry) => entry.cartItemId === cartItemId);
        if (!item) return 0;

        const modifierTotal = item.modifiers.reduce(
          (sum, mod) => sum + mod.priceDeltaCents,
          0
        );

        return (item.basePriceCents + modifierTotal) * item.quantity;
      },
    }),
    {
      name: "mms-cart",
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
