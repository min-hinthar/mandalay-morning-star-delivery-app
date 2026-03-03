"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";

interface DeliverySettingsSyncProps {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
}

/**
 * Syncs server-provided delivery fee settings into the client-side cart store.
 * Render this component in any layout/page that has cart functionality.
 * It calls setDeliverySettings once on mount (and when values change).
 */
export function DeliverySettingsSync({
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
}: DeliverySettingsSyncProps) {
  useEffect(() => {
    useCartStore.getState().setDeliverySettings(deliveryFeeCents, freeDeliveryThresholdCents);
    useCartStore.getState().setCutoffSettings(cutoffDay, cutoffHour);
  }, [deliveryFeeCents, freeDeliveryThresholdCents, cutoffDay, cutoffHour]);

  return null;
}
