"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import type { DeliveryDayConfig } from "@/types/delivery";
import type { DeliveryFeeBand } from "@/lib/utils/order";

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
  /** Graduated distance bands (localRadius..standardRadius) */
  deliveryFeeBands?: DeliveryFeeBand[];
  /** Edge of normal coverage (miles); per-mile surcharge begins here */
  standardRadiusMiles?: number;
  /** Whether long-distance delivery is offered */
  extendedDeliveryEnabled?: boolean;
  /** Per-mile surcharge (cents) beyond the standard radius */
  extendedPerMileCents?: number;
  /** Absolute max delivery radius (miles) */
  maxRadiusMiles?: number;
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
  deliveryFeeBands,
  standardRadiusMiles,
  extendedDeliveryEnabled,
  extendedPerMileCents,
  maxRadiusMiles,
}: DeliverySettingsSyncProps) {
  // Serialize the bands so the effect re-runs when their contents change, not
  // just their array identity.
  const bandsKey = deliveryFeeBands ? JSON.stringify(deliveryFeeBands) : undefined;

  useEffect(() => {
    useCartStore.getState().setDeliverySettings(deliveryFeeCents, freeDeliveryThresholdCents);
    useCartStore.getState().setCutoffSettings(cutoffDay, cutoffHour);
    useCartStore.getState().setDeliveryDays(deliveryDays);
    if (longDistanceFeeCents !== undefined && longDistanceThresholdMiles !== undefined) {
      useCartStore
        .getState()
        .setLongDistanceSettings(longDistanceFeeCents, longDistanceThresholdMiles);
    }
    if (
      deliveryFeeBands !== undefined &&
      standardRadiusMiles !== undefined &&
      extendedDeliveryEnabled !== undefined &&
      extendedPerMileCents !== undefined &&
      maxRadiusMiles !== undefined
    ) {
      useCartStore.getState().setDeliveryPricing({
        deliveryFeeBands,
        standardRadiusMiles,
        extendedDeliveryEnabled,
        extendedPerMileCents,
        maxRadiusMiles,
      });
    }
  }, [
    deliveryFeeCents,
    freeDeliveryThresholdCents,
    cutoffDay,
    cutoffHour,
    deliveryDays,
    longDistanceFeeCents,
    longDistanceThresholdMiles,
    deliveryFeeBands,
    bandsKey,
    standardRadiusMiles,
    extendedDeliveryEnabled,
    extendedPerMileCents,
    maxRadiusMiles,
  ]);

  return null;
}
