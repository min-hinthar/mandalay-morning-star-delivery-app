import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { CartItem, CartStore, SelectedModifier } from "@/types/cart";
import {
  DELIVERY_FEE_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
} from "@/types/cart";
import { cartIDBStorage } from "@/lib/services/cart-idb-storage";
import { toast } from "@/lib/hooks/useToastV8";

// ============================================
// DEDUPLICATION SIGNATURE
// ============================================

/**
 * Create a deterministic, unique signature for cart item deduplication.
 * Items with same menuItemId + modifiers + notes should merge.
 *
 * Signature format: menuItemId::sortedModifierIds::normalizedNotes
 */
function createItemSignature(item: {
  menuItemId: string;
  modifiers: SelectedModifier[];
  notes: string;
}): string {
  // Sort modifiers by optionId for deterministic signature
  const sortedModifiers = [...(item.modifiers || [])]
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((m) => m.optionId)
    .join("|");

  // Normalize notes: trim and lowercase for consistent comparison
  const normalizedNotes = (item.notes || "").trim().toLowerCase();

  return `${item.menuItemId}::${sortedModifiers}::${normalizedNotes}`;
}

// ============================================
// DEBOUNCE TRACKING
// ============================================

/**
 * Track recent additions to prevent duplicate rapid-fire adds.
 * Map of signature -> timestamp of last add
 */
const recentAdditions = new Map<string, number>();
const DEBOUNCE_MS = 300;

/**
 * Check if an add operation should be debounced.
 * Returns true if this is a duplicate rapid-fire add.
 */
function shouldDebounce(signature: string): boolean {
  const now = Date.now();
  const lastAdd = recentAdditions.get(signature);

  if (lastAdd && now - lastAdd < DEBOUNCE_MS) {
    return true;
  }

  // Update timestamp
  recentAdditions.set(signature, now);

  // Clean old entries periodically (keep map small)
  if (recentAdditions.size > 100) {
    const cutoff = now - DEBOUNCE_MS * 2;
    for (const [key, time] of recentAdditions.entries()) {
      if (time < cutoff) {
        recentAdditions.delete(key);
      }
    }
  }

  return false;
}

// ============================================
// CART STORE
// ============================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      /**
       * Add item to cart with deduplication and debounce protection.
       *
       * - Same signature (menuItemId + modifiers + notes) → merge by incrementing quantity
       * - Different signature → add as new item
       * - Rapid-fire adds (< 300ms) → ignored
       */
      addItem: (item) => {
        const signature = createItemSignature(item);

        // Debounce protection: ignore rapid-fire duplicate adds
        if (shouldDebounce(signature)) {
          console.debug("[cart] Debounced duplicate add:", signature);
          return;
        }

        const { items } = get();

        // Find existing item with same signature for deduplication
        const existingIndex = items.findIndex(
          (existing) => createItemSignature(existing) === signature
        );

        if (existingIndex !== -1) {
          // Merge: increment quantity of existing item
          const existing = items[existingIndex];
          const newQuantity = Math.min(
            existing.quantity + (item.quantity || 1),
            MAX_ITEM_QUANTITY
          );

          set({
            items: items.map((cartItem, idx) =>
              idx === existingIndex
                ? { ...cartItem, quantity: newQuantity }
                : cartItem
            ),
          });
          return;
        }

        // No match: add as new item
        if (items.length >= MAX_CART_ITEMS) {
          console.warn("[cart] Cart limit reached:", MAX_CART_ITEMS);
          return;
        }

        const isOffline =
          typeof navigator !== "undefined" && !navigator.onLine;

        const newItem: CartItem = {
          menuItemId: item.menuItemId,
          menuItemSlug: item.menuItemSlug,
          nameEn: item.nameEn,
          nameMy: item.nameMy ?? null,
          imageUrl: item.imageUrl ?? null,
          basePriceCents: item.basePriceCents,
          modifiers: item.modifiers || [],
          notes: (item.notes || "").trim(),
          cartItemId: uuidv4(),
          addedAt: new Date().toISOString(),
          quantity: Math.min(Math.max(1, item.quantity || 1), MAX_ITEM_QUANTITY),
          ...(isOffline ? { pendingSync: true } : {}),
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
          const modifierTotal = (item.modifiers || []).reduce(
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

        const modifierTotal = (item.modifiers || []).reduce(
          (sum, mod) => sum + mod.priceDeltaCents,
          0
        );

        return (item.basePriceCents + modifierTotal) * item.quantity;
      },

      updateItem: (cartItemId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? {
                  ...item,
                  modifiers: updates.modifiers,
                  quantity: Math.min(
                    Math.max(1, updates.quantity),
                    MAX_ITEM_QUANTITY
                  ),
                  notes: updates.notes.trim(),
                  basePriceCents: updates.basePriceCents,
                }
              : item
          ),
        }));
      },

      updateItemPrice: (cartItemId, newPriceCents) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, basePriceCents: newPriceCents }
              : item
          ),
        }));
      },
    }),
    {
      name: "mms-cart",
      storage: createJSONStorage(() => cartIDBStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

// ============================================
// ONLINE SYNC LISTENER
// ============================================

/**
 * When the browser comes back online, clear pendingSync flags
 * and notify the user that their cart has been synced.
 */
function setupOnlineListener() {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      const { items } = useCartStore.getState();
      const hasPending = items.some((i) => i.pendingSync);
      if (hasPending) {
        useCartStore.setState({
          items: items.map((i) => ({ ...i, pendingSync: false })),
        });
        toast({ message: "Cart synced!", type: "success" });
      }
    });
  }
}

setupOnlineListener();

// ============================================
// EXPORTS FOR TESTING
// ============================================

export { createItemSignature };

/**
 * Clear debounce state - for testing only.
 * Call this in beforeEach to reset debounce tracking between tests.
 */
export function __clearDebounceState(): void {
  recentAdditions.clear();
}
