import type { DeliveryPricingConfig, DeliveryFeeBand } from "@/lib/utils/order";

/** The slice of cart state that determines delivery pricing. */
export interface CartPricingState {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  longDistanceFeeCents: number;
  longDistanceThresholdMiles: number;
  deliveryFeeBands: DeliveryFeeBand[];
  standardRadiusMiles: number;
  extendedDeliveryEnabled: boolean;
  extendedPerMileCents: number;
  maxRadiusMiles: number;
}

/**
 * Mirror the server's `getDeliveryPricingConfig` from synced cart state, so the
 * client estimate and the server charge come from one engine.
 *
 * Falls back to a single band spanning the standard radius when no graduated
 * bands have synced yet (matches the server's legacy-flat-fee fallback).
 */
export function buildCartPricingConfig(s: CartPricingState): DeliveryPricingConfig {
  return {
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
}
