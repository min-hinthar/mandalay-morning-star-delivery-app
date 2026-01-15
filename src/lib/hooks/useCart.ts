import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/format";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

export function useCart() {
  const store = useCartStore();
  const itemsSubtotal = store.getItemsSubtotal();
  const estimatedDeliveryFee = store.getEstimatedDeliveryFee();
  const estimatedTotal = itemsSubtotal + estimatedDeliveryFee;

  return {
    items: store.items,
    itemCount: store.getItemCount(),
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    isEmpty: store.items.length === 0,

    formattedSubtotal: formatPrice(itemsSubtotal),
    formattedDeliveryFee: formatPrice(estimatedDeliveryFee),
    formattedTotal: formatPrice(estimatedTotal),

    amountToFreeDelivery: Math.max(
      0,
      FREE_DELIVERY_THRESHOLD_CENTS - itemsSubtotal
    ),

    addItem: store.addItem,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    getItemTotal: store.getItemTotal,
  };
}
