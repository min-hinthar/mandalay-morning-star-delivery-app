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
}

export interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartItemId" | "addedAt">) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getItemsSubtotal: () => number;
  getEstimatedDeliveryFee: () => number;
  getItemCount: () => number;
  getItemTotal: (cartItemId: string) => number;
}

export const DELIVERY_FEE_CENTS = 1500;
export const FREE_DELIVERY_THRESHOLD_CENTS = 10000;
export const MAX_ITEM_QUANTITY = 50;
export const MAX_CART_ITEMS = 50;

export function getDeliveryFeeMessage(subtotalCents: number): {
  fee: string;
  message: string;
} {
  if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) {
    return {
      fee: "FREE",
      message: "You qualify for free delivery!",
    };
  }

  const remaining = FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents;
  return {
    fee: "$15.00",
    message: `Add $${(remaining / 100).toFixed(2)} more for free delivery`,
  };
}
