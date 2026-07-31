import type { DeliveryTier } from "./order";

export interface MinimumOrderResult {
  /** The floor that applies to this address, in cents. */
  minimumCents: number;
  /** Cents still needed to reach it (0 when satisfied). */
  shortfallCents: number;
  /** True when the order clears the floor. */
  meetsMinimum: boolean;
  /** True when the higher long-haul floor is the one being applied. */
  isExtendedMinimum: boolean;
}

/**
 * Resolve the minimum-subtotal rule for a delivery.
 *
 * A long-haul run costs the same to drive whether the basket is $27 or $127, so
 * beyond the local radius the order must clear a higher floor. Local deliveries
 * keep the global minimum.
 *
 * Measured on the PRE-discount subtotal — the same number that picks the
 * delivery tier in `resolveDeliveryFee`. Using the post-discount amount would
 * let a cart be "too small to deliver" while simultaneously being charged an
 * extended-distance fee derived from the larger number.
 *
 * `tier` comes from `resolveDeliveryFee`, so the boundary can never drift from
 * the pricing boundary. `out-of-range` is deliberately NOT gated here: that
 * order is rejected for coverage, and telling someone to add food to an address
 * we don't serve would be nonsense.
 */
export function resolveMinimumOrder(
  subtotalCents: number,
  tier: DeliveryTier,
  opts: { baseMinimumCents: number; extendedMinimumCents: number }
): MinimumOrderResult {
  const isExtendedMinimum =
    (tier === "extended" || tier === "far") && opts.extendedMinimumCents > opts.baseMinimumCents;
  const minimumCents = isExtendedMinimum ? opts.extendedMinimumCents : opts.baseMinimumCents;
  const shortfallCents = Math.max(0, minimumCents - subtotalCents);
  return {
    minimumCents,
    shortfallCents,
    meetsMinimum: shortfallCents === 0,
    isExtendedMinimum,
  };
}
