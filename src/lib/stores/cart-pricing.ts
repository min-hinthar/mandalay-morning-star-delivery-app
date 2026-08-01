import type { DeliveryPricingConfig, DeliveryFeeBand } from "@/lib/utils/order";
import { standardCeilingMiles } from "@/lib/utils/order";
import { COVERAGE_LIMITS } from "@/types/address";

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
  const bands =
    s.deliveryFeeBands.length > 0
      ? s.deliveryFeeBands
      : [{ maxMiles: s.standardRadiusMiles, feeCents: s.longDistanceFeeCents }];
  // Mirror the server's normalization (getDeliveryPricingConfig): the coverage
  // max is clamped to [banded ceiling, absolute limit]. Without the lower
  // clamp, an admin-set max BELOW the banded region makes the client call a
  // priced-but-serviceable band out of range while the server serves it.
  const ceiling = standardCeilingMiles({
    bands,
    standardRadiusMiles: s.standardRadiusMiles,
    localRadiusMiles: s.longDistanceThresholdMiles,
  } as DeliveryPricingConfig);
  return {
    localFeeCents: s.deliveryFeeCents,
    localRadiusMiles: s.longDistanceThresholdMiles,
    freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
    bands,
    standardRadiusMiles: s.standardRadiusMiles,
    extendedEnabled: s.extendedDeliveryEnabled,
    extendedPerMileCents: s.extendedPerMileCents,
    maxRadiusMiles: Math.min(
      Math.max(s.maxRadiusMiles, ceiling),
      COVERAGE_LIMITS.maxRequestDistanceMiles
    ),
  };
}
