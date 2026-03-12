"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import type { DeliveryDayConfig } from "@/types/delivery";

interface DeliverySettingsSyncProps {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
  /** Multi-day delivery configs from business rules */
  deliveryDays?: DeliveryDayConfig[];
  /** Fee for addresses beyond long-distance threshold (cents) */
  longDistanceFeeCents?: number;
  /** Miles threshold for long-distance fee */
  longDistanceThresholdMiles?: number;
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
  deliveryDays = [],
  longDistanceFeeCents,
  longDistanceThresholdMiles,
}: DeliverySettingsSyncProps) {
  useEffect(() => {
    useCartStore.getState().setDeliverySettings(deliveryFeeCents, freeDeliveryThresholdCents);
    useCartStore.getState().setCutoffSettings(cutoffDay, cutoffHour);
    useCartStore.getState().setDeliveryDays(deliveryDays);
    if (longDistanceFeeCents !== undefined && longDistanceThresholdMiles !== undefined) {
      useCartStore
        .getState()
        .setLongDistanceSettings(longDistanceFeeCents, longDistanceThresholdMiles);
    }
  }, [
    deliveryFeeCents,
    freeDeliveryThresholdCents,
    cutoffDay,
    cutoffHour,
    deliveryDays,
    longDistanceFeeCents,
    longDistanceThresholdMiles,
  ]);

  return null;
}
