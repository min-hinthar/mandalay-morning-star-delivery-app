import type { MenuItem } from "@/types/menu";
import type { DeliveryDayConfig } from "@/types/delivery";
import type { DeliveryFeeBand } from "@/lib/utils/order";

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  menuItemSlug: string;
  nameEn: string;
  nameMy: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes: string;
  addedAt: string;
  categoryId?: string;
  pendingSync?: boolean;
}

export interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;

  /** Configurable delivery fee settings (populated from server on page load) */
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  setDeliverySettings: (fee: number, threshold: number) => void;

  /** Configurable cutoff settings (populated from server on page load, NOT persisted to IndexedDB) */
  cutoffDay: number;
  cutoffHour: number;
  setCutoffSettings: (day: number, hour: number) => void;

  /** Multi-day delivery configs (populated from server on page load) */
  deliveryDays: DeliveryDayConfig[];
  setDeliveryDays: (days: DeliveryDayConfig[]) => void;

  /** Distance-based fee settings (populated from server on page load) */
  addressDistanceMiles: number | null;
  longDistanceFeeCents: number;
  longDistanceThresholdMiles: number;
  setAddressDistance: (miles: number | null) => void;
  setLongDistanceSettings: (fee: number, threshold: number) => void;

  /** Graduated pricing settings (populated from server on page load) */
  deliveryFeeBands: DeliveryFeeBand[];
  standardRadiusMiles: number;
  extendedDeliveryEnabled: boolean;
  extendedPerMileCents: number;
  maxRadiusMiles: number;
  setDeliveryPricing: (pricing: {
    deliveryFeeBands: DeliveryFeeBand[];
    standardRadiusMiles: number;
    extendedDeliveryEnabled: boolean;
    extendedPerMileCents: number;
    maxRadiusMiles: number;
  }) => void;

  addItem: (item: Omit<CartItem, "cartItemId" | "addedAt">) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getItemsSubtotal: () => number;
  getEstimatedDeliveryFee: () => number;
  getItemCount: () => number;
  getItemTotal: (cartItemId: string) => number;
  updateItemPrice: (cartItemId: string, newPriceCents: number) => void;
  updateItem: (
    cartItemId: string,
    updates: {
      modifiers: SelectedModifier[];
      quantity: number;
      notes: string;
      basePriceCents: number;
    }
  ) => void;
}

export const MINIMUM_ORDER_CENTS = 2500;
export const MAX_ITEM_QUANTITY = 50;
export const MAX_CART_ITEMS = 50;

// ============================================
// CART VALIDATION TYPES
// ============================================

export type CartItemValidationStatus = "valid" | "sold-out" | "unavailable" | "price-changed";

export interface CartItemValidation {
  cartItemId: string;
  status: CartItemValidationStatus;
  /** Present when status is 'price-changed' */
  newPriceCents?: number;
  /** Present when status is 'price-changed' */
  priceDirection?: "up" | "down";
}

export interface CartValidationResult {
  status: "idle" | "validating" | "done" | "error";
  validations: Map<string, CartItemValidation>;
  soldOutIds: string[];
  unavailableIds: string[];
  priceChangedIds: string[];
  /** cartItemId -> up to 3 replacement suggestions from same category */
  suggestions: Map<string, MenuItem[]>;
  /** True if sold-out or unavailable items exist */
  hasBlockingIssues: boolean;
  /**
   * Phase 110 CFIX-05 D-17 — true when the 30s AbortController timeout fired
   * while waiting for the menu refetch to complete. Exposed so consumers can
   * render the "Validation taking longer than usual" banner (Proceed Anyway).
   */
  timedOut: boolean;
  /**
   * Phase 110 CFIX-05 D-19 — bypass the blocking validation gate WITHOUT
   * re-validating. Customer agency: the customer explicitly acknowledges the
   * trade-off. Server-side cart validation in /api/checkout/session is still
   * authoritative (route.ts fetchAndValidateCart) — a "Proceed Anyway" click
   * does NOT bypass server-side validation.
   */
  proceedAnyway: () => void;
}
