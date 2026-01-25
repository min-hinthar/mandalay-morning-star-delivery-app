import { useMemo } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/format";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

export function useCart() {
  // Select individual stable values from Zustand store
  // Using individual selectors ensures stable references
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemTotal = useCartStore((state) => state.getItemTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const getItemsSubtotal = useCartStore((state) => state.getItemsSubtotal);
  const getEstimatedDeliveryFee = useCartStore((state) => state.getEstimatedDeliveryFee);

  // Memoize computed values - only recalculate when items change
  const itemsSubtotal = useMemo(() => getItemsSubtotal(), [getItemsSubtotal]);
  const estimatedDeliveryFee = useMemo(() => getEstimatedDeliveryFee(), [getEstimatedDeliveryFee]);
  const estimatedTotal = useMemo(() => itemsSubtotal + estimatedDeliveryFee, [itemsSubtotal, estimatedDeliveryFee]);
  const itemCount = useMemo(() => getItemCount(), [getItemCount]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    items,
    itemCount,
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    isEmpty: items.length === 0,

    formattedSubtotal: formatPrice(itemsSubtotal),
    formattedDeliveryFee: formatPrice(estimatedDeliveryFee),
    formattedTotal: formatPrice(estimatedTotal),

    amountToFreeDelivery: Math.max(
      0,
      FREE_DELIVERY_THRESHOLD_CENTS - itemsSubtotal
    ),

    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemTotal,
  }), [
    items,
    itemCount,
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemTotal,
  ]);
}
