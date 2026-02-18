import type { MenuItem } from "@/types/menu";

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
export const DELIVERY_FEE_CENTS = 1500;
export const FREE_DELIVERY_THRESHOLD_CENTS = 10000;
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
}
