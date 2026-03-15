import { useMemo } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/format";

export function useCart() {
  // Get items array directly - this is the source of truth for reactivity
  const items = useCartStore((state) => state.items);
  const freeDeliveryThresholdCents = useCartStore((state) => state.freeDeliveryThresholdCents);
  const addressDistanceMiles = useCartStore((state) => state.addressDistanceMiles);
  const deliveryFeeCents = useCartStore((state) => state.deliveryFeeCents);
  const longDistanceFeeCents = useCartStore((state) => state.longDistanceFeeCents);
  const longDistanceThresholdMiles = useCartStore((state) => state.longDistanceThresholdMiles);

  // Get stable action references (Zustand action selectors are stable)
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemTotal = useCartStore((state) => state.getItemTotal);

  // Compute values using items as dependency - getState() provides stable function refs
  // This ensures recalculation only when items array actually changes
  const itemsSubtotal = useMemo(
    () => useCartStore.getState().getItemsSubtotal(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );
  const estimatedDeliveryFee = useMemo(
    () => useCartStore.getState().getEstimatedDeliveryFee(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      items,
      addressDistanceMiles,
      deliveryFeeCents,
      freeDeliveryThresholdCents,
      longDistanceFeeCents,
      longDistanceThresholdMiles,
    ]
  );
  const itemCount = useMemo(
    () => useCartStore.getState().getItemCount(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );
  const estimatedTotal = useMemo(
    () => itemsSubtotal + estimatedDeliveryFee,
    [itemsSubtotal, estimatedDeliveryFee]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      items,
      itemCount,
      itemsSubtotal,
      estimatedDeliveryFee,
      estimatedTotal,
      isEmpty: items.length === 0,

      formattedSubtotal: formatPrice(itemsSubtotal),
      formattedDeliveryFee: formatPrice(estimatedDeliveryFee),
      formattedTotal: formatPrice(estimatedTotal),

      amountToFreeDelivery: Math.max(0, freeDeliveryThresholdCents - itemsSubtotal),
      freeDeliveryThresholdCents,

      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemTotal,
    }),
    [
      items,
      itemCount,
      itemsSubtotal,
      estimatedDeliveryFee,
      estimatedTotal,
      freeDeliveryThresholdCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemTotal,
    ]
  );
}
