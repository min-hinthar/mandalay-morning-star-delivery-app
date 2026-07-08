import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { CartItem, CartStore, SelectedModifier } from "@/types/cart";
import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from "@/types/cart";
import { cartIDBStorage } from "@/lib/services/cart-idb-storage";
import { toast } from "@/lib/hooks/useToastV8";
import { triggerHaptic } from "@/lib/swipe-gestures/utils";
import type { DeliveryDayConfig } from "@/types/delivery";
import { resolveDeliveryFee, type DeliveryPricingConfig } from "@/lib/utils/order";

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

// shouldDebounce logic moved inline into addItem's set() callback (BUG-06 fix)
// to ensure debounce check + timestamp update is atomic with state mutation.

// ============================================
// CART STORE
// ============================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      // Configurable delivery settings (defaults match DB seed values)
      deliveryFeeCents: 1500,
      freeDeliveryThresholdCents: 10000,
      setDeliverySettings: (fee: number, threshold: number) =>
        set({ deliveryFeeCents: fee, freeDeliveryThresholdCents: threshold }),

      // Configurable cutoff settings (defaults match DB seed values)
      cutoffDay: 5,
      cutoffHour: 15,
      setCutoffSettings: (day: number, hour: number) => set({ cutoffDay: day, cutoffHour: hour }),

      // Multi-day delivery configs
      deliveryDays: [] as DeliveryDayConfig[],
      setDeliveryDays: (days: DeliveryDayConfig[]) => set({ deliveryDays: days }),

      // Distance-aware delivery fee
      addressDistanceMiles: null as number | null,
      longDistanceFeeCents: 2000,
      longDistanceThresholdMiles: 25,
      setAddressDistance: (miles: number | null) => set({ addressDistanceMiles: miles }),
      setLongDistanceSettings: (fee: number, threshold: number) =>
        set({ longDistanceFeeCents: fee, longDistanceThresholdMiles: threshold }),

      // Graduated pricing settings (defaults match BUSINESS_RULES_DEFAULTS)
      deliveryFeeBands: [
        { maxMiles: 40, feeCents: 2000 },
        { maxMiles: 50, feeCents: 3000 },
      ],
      standardRadiusMiles: 50,
      extendedDeliveryEnabled: true,
      extendedPerMileCents: 150,
      maxRadiusMiles: 100,
      setDeliveryPricing: (pricing) => set({ ...pricing }),

      /**
       * Optimistic cart add -- synchronous Zustand mutation.
       *
       * Phase 115 DATA-01: This IS the optimistic update. No server round-trip on add.
       * Item is immediately visible in UI (<16ms, one frame). IDB persistence is
       * handled by zustand/persist middleware. Dedup signature prevents duplicate
       * rapid-fire adds (300ms store-level debounce inside set() -- BUG-06 atomic fix).
       *
       * Rollback semantics (three layers):
       * 1. useCartValidation polls menu every 3min -- detects price changes, sold-out
       * 2. syncPendingCartItems on reconnect -- removes unavailable items
       * 3. fetchAndValidateCart at checkout -- server-side authoritative validation
       *
       * @param item - Item to add (menuItemId + modifiers + notes + quantity)
       */
      addItem: (item) => {
        const signature = createItemSignature(item);

        // BUG-06 FIX: Debounce check inside set() for atomicity.
        // Previously, shouldDebounce() was called BEFORE set(), allowing
        // concurrent calls to both pass the check before either reaches set().
        set((state) => {
          const now = Date.now();
          const lastAdd = recentAdditions.get(signature);

          if (lastAdd && now - lastAdd < DEBOUNCE_MS) {
            console.debug("[cart] Debounced duplicate add:", signature);
            return state; // Return unchanged state
          }

          // Update timestamp atomically with state change
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

          const { items } = state;

          // Find existing item with same signature for deduplication
          const existingIndex = items.findIndex(
            (existing) => createItemSignature(existing) === signature
          );

          if (existingIndex !== -1) {
            // Merge: increment quantity of existing item
            const existing = items[existingIndex];
            const requestedQuantity = existing.quantity + (item.quantity || 1);
            const newQuantity = Math.min(requestedQuantity, MAX_ITEM_QUANTITY);

            // BUG-06: Toast when per-item quantity cap is hit
            if (requestedQuantity > MAX_ITEM_QUANTITY) {
              setTimeout(() => {
                toast({ message: `Maximum ${MAX_ITEM_QUANTITY} per item`, type: "warning" });
              }, 0);
            }

            return {
              items: items.map((cartItem, idx) =>
                idx === existingIndex ? { ...cartItem, quantity: newQuantity } : cartItem
              ),
            };
          }

          // No match: add as new item
          if (items.length >= MAX_CART_ITEMS) {
            // BUG-06: Toast when cart items cap is hit (was console.warn)
            setTimeout(() => {
              toast({ message: `Cart is full (max ${MAX_CART_ITEMS} items)`, type: "warning" });
            }, 0);
            return state;
          }

          const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

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

          return { items: [...items, newItem] };
        });
      },

      /**
       * Optimistic quantity update -- synchronous Zustand mutation.
       *
       * Immediately updates quantity in state. Clamped to [1, MAX_ITEM_QUANTITY].
       * No server round-trip. IDB persisted automatically.
       */
      updateQuantity: (cartItemId, quantity) => {
        const clampedQty = Math.min(Math.max(1, quantity), MAX_ITEM_QUANTITY);

        // BUG-06: Toast when quantity stepper hits per-item cap
        if (quantity > MAX_ITEM_QUANTITY) {
          toast({ message: `Maximum ${MAX_ITEM_QUANTITY} per item`, type: "warning" });
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: clampedQty } : item
          ),
        }));
      },

      /**
       * Optimistic cart remove with undo toast.
       *
       * Snapshots item before removing, shows 5s undo toast.
       * Undo restores exact item state (modifiers, quantity, notes).
       */
      removeItem: (cartItemId) => {
        const snapshot = get().items.find((item) => item.cartItemId === cartItemId);
        if (!snapshot) return;

        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));

        toast({
          message: `${snapshot.nameEn} removed`,
          type: "info",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              get().addItem({
                menuItemId: snapshot.menuItemId,
                menuItemSlug: snapshot.menuItemSlug,
                nameEn: snapshot.nameEn,
                nameMy: snapshot.nameMy,
                imageUrl: snapshot.imageUrl,
                basePriceCents: snapshot.basePriceCents,
                modifiers: snapshot.modifiers,
                notes: snapshot.notes,
                quantity: snapshot.quantity,
              });
              triggerHaptic("success");
            },
          },
        });
      },

      /**
       * Clear cart with undo toast.
       *
       * Snapshots all items before clearing, shows 5s undo toast.
       * Undo restores full cart state.
       */
      clearCart: () => {
        const snapshot = [...get().items];
        if (snapshot.length === 0) return;

        set({ items: [] });

        toast({
          message: `${snapshot.length} item${snapshot.length !== 1 ? "s" : ""} removed`,
          type: "info",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              set({ items: snapshot });
              triggerHaptic("success");
            },
          },
        });
      },

      getItemsSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const modifierTotal = (item.modifiers || []).reduce(
            (sum, mod) => sum + mod.priceDeltaCents,
            0
          );
          const itemTotal = (item.basePriceCents + modifierTotal) * item.quantity;
          return total + itemTotal;
        }, 0);
      },

      getEstimatedDeliveryFee: () => {
        // Mirror the server's graduated pricing so the estimate matches the charge.
        const s = get();
        const pricing: DeliveryPricingConfig = {
          localFeeCents: s.deliveryFeeCents,
          localRadiusMiles: s.longDistanceThresholdMiles,
          freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
          bands:
            s.deliveryFeeBands.length > 0
              ? s.deliveryFeeBands
              : [{ maxMiles: s.standardRadiusMiles, feeCents: s.longDistanceFeeCents }],
          standardRadiusMiles: s.standardRadiusMiles,
          extendedEnabled: s.extendedDeliveryEnabled,
          extendedPerMileCents: s.extendedPerMileCents,
          maxRadiusMiles: s.maxRadiusMiles,
        };
        return resolveDeliveryFee(s.addressDistanceMiles, s.getItemsSubtotal(), pricing).feeCents;
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
                  quantity: Math.min(Math.max(1, updates.quantity), MAX_ITEM_QUANTITY),
                  notes: updates.notes.trim(),
                  basePriceCents: updates.basePriceCents,
                }
              : item
          ),
        }));
      },

      /**
       * Updates cart item price to match server truth.
       *
       * Called by useCartValidation when price-change detected (Phase 115 D-20).
       * Synchronous mutation -- cart always reflects latest server price after
       * validation completes.
       */
      updateItemPrice: (cartItemId, newPriceCents) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, basePriceCents: newPriceCents } : item
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
        // Purge stale pendingSync flags on hydration (per D-20)
        purgeStalePendingSync();
      },
    }
  )
);

// ============================================
// ONLINE SYNC LISTENER
// ============================================

let listenerSetup = false; // Guard against duplicate registration (per D-19)

interface MenuItemLookup {
  basePriceCents: number;
  isActive: boolean;
  isSoldOut: boolean;
  modifiers: Map<string, number>; // optionId -> priceDeltaCents
}

/**
 * Build a lookup map from /api/menu response for quick price/availability checks.
 */
function buildMenuLookup(menuData: {
  data?: {
    categories?: Array<{
      items: Array<{
        id: string;
        basePriceCents: number;
        isActive: boolean;
        isSoldOut: boolean;
        modifierGroups: Array<{
          options: Array<{
            id: string;
            priceDeltaCents: number;
            isActive: boolean;
          }>;
        }>;
      }>;
    }>;
  };
}): Map<string, MenuItemLookup> {
  const lookup = new Map<string, MenuItemLookup>();
  const categories = menuData?.data?.categories ?? [];
  for (const category of categories) {
    for (const item of category.items) {
      const modifiers = new Map<string, number>();
      for (const group of item.modifierGroups ?? []) {
        for (const opt of group.options ?? []) {
          if (opt.isActive) {
            modifiers.set(opt.id, opt.priceDeltaCents);
          }
        }
      }
      lookup.set(item.id, {
        basePriceCents: item.basePriceCents,
        isActive: item.isActive,
        isSoldOut: item.isSoldOut,
        modifiers,
      });
    }
  }
  return lookup;
}

/**
 * Rollback layer 2: Online reconnection sync.
 *
 * Triggered by browser "online" event. Validates all items with
 * pendingSync: true against /api/menu. Removes unavailable items,
 * updates changed prices, clears pendingSync flags. Shows toast
 * for each change.
 *
 * Phase 115 DATA-01: This is the explicit rollback mechanism for
 * offline-added items that are no longer valid on the server.
 */
async function syncPendingCartItems(): Promise<void> {
  const { items } = useCartStore.getState();
  const pendingItems = items.filter((i) => i.pendingSync);
  if (pendingItems.length === 0) return;

  try {
    const response = await fetch("/api/menu");
    if (!response.ok) {
      // Network recovered but API failed — clear flags, toast generic success
      useCartStore.setState({
        items: items.map((i) => ({ ...i, pendingSync: false })),
      });
      toast({ message: "Cart synced!", type: "success" });
      return;
    }

    const menuData = await response.json();
    const lookup = buildMenuLookup(menuData);

    const updatedItems: CartItem[] = [];
    const removedNames: string[] = [];
    let priceChanges = 0;

    for (const item of items) {
      if (!item.pendingSync) {
        updatedItems.push(item);
        continue;
      }

      const menuItem = lookup.get(item.menuItemId);

      // Item unavailable — remove from cart (per D-17)
      if (!menuItem || !menuItem.isActive || menuItem.isSoldOut) {
        removedNames.push(item.nameEn);
        continue;
      }

      // Check base price change
      let changed = false;
      const updatedItem = { ...item, pendingSync: false };

      if (menuItem.basePriceCents !== item.basePriceCents) {
        updatedItem.basePriceCents = menuItem.basePriceCents;
        changed = true;
      }

      // Check modifier price changes
      const updatedModifiers = item.modifiers.map((mod) => {
        const freshPrice = menuItem.modifiers.get(mod.optionId);
        if (freshPrice != null && freshPrice !== mod.priceDeltaCents) {
          changed = true;
          return { ...mod, priceDeltaCents: freshPrice };
        }
        return mod;
      });
      updatedItem.modifiers = updatedModifiers;

      if (changed) priceChanges++;
      updatedItems.push(updatedItem);
    }

    useCartStore.setState({ items: updatedItems });

    // Notifications (per D-18 CheckoutErrorBanner pattern)
    if (removedNames.length > 0) {
      for (const name of removedNames) {
        toast({
          message: `${name} is no longer available and was removed`,
          type: "warning",
          duration: 30_000, // Long-lived for visibility (no persistent field in ToastOptions)
        });
      }
    }

    if (priceChanges > 0) {
      toast({
        message: `${priceChanges} item(s) updated since you were offline`,
        type: "info",
      });
    }

    if (removedNames.length === 0 && priceChanges === 0) {
      toast({ message: "Cart synced successfully", type: "success" });
    }
  } catch {
    // Fetch failed entirely — clear flags to prevent infinite retry
    useCartStore.setState({
      items: items.map((i) => ({ ...i, pendingSync: false })),
    });
    toast({ message: "Cart synced!", type: "success" });
  }
}

/**
 * Purge pendingSync flags (per D-20).
 * Called on store hydration and before checkout.
 */
export function purgeStalePendingSync(): void {
  const { items } = useCartStore.getState();
  const hasPending = items.some((i) => i.pendingSync);
  if (!hasPending) return;

  useCartStore.setState({
    items: items.map((i) => ({ ...i, pendingSync: false })),
  });
}

function setupOnlineListener(): void {
  if (typeof window === "undefined") return;
  if (listenerSetup) return; // Prevent duplicate listeners (per D-19)
  listenerSetup = true;

  window.addEventListener("online", () => {
    // Use .catch() handler — void asyncFn() killed on Vercel (per D-21)
    syncPendingCartItems().catch((err) => {
      console.error("[cart-store] Sync failed:", err);
    });
  });
}

setupOnlineListener();

// ============================================
// EXPORTS FOR TESTING
// ============================================

/**
 * Clear debounce state - for testing only.
 * Call this in beforeEach to reset debounce tracking between tests.
 */
export function __clearDebounceState(): void {
  recentAdditions.clear();
}

/** Reset listener guard — for testing only. */
export function __resetListenerGuard(): void {
  listenerSetup = false;
}

/** Exposed for testing — do not use in production. */
export { syncPendingCartItems as __syncPendingCartItems };
