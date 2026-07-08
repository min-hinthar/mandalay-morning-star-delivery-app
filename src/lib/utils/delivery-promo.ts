/**
 * Free-delivery promo copy — single source of truth.
 *
 * Free delivery is conditional: it applies only to LOCAL orders, i.e. when
 * the subtotal reaches `freeDeliveryThresholdCents` AND the address is within
 * `longDistanceThresholdMiles`. Beyond that range a flat long-distance fee
 * applies and there is NO free delivery (see calculateDeliveryFee in
 * lib/utils/order.ts). Centralising the copy here keeps every surface
 * (homepage, cart, checkout) accurate and consistent.
 */

// Mirrors BUSINESS_RULES_DEFAULTS. Duplicated here (not imported) so this
// client-safe module never pulls the server-only business-rules module into
// client bundles. Callers with live values should pass them in.
export const FREE_DELIVERY_PROMO_DEFAULTS = {
  freeDeliveryThresholdCents: 10000,
  longDistanceThresholdMiles: 25,
  longDistanceFeeCents: 2000,
} as const;

export interface DeliveryPromoOptions {
  freeDeliveryThresholdCents?: number;
  longDistanceThresholdMiles?: number;
  longDistanceFeeCents?: number;
}

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

function resolve(opts: DeliveryPromoOptions) {
  return {
    threshold:
      opts.freeDeliveryThresholdCents ?? FREE_DELIVERY_PROMO_DEFAULTS.freeDeliveryThresholdCents,
    miles:
      opts.longDistanceThresholdMiles ?? FREE_DELIVERY_PROMO_DEFAULTS.longDistanceThresholdMiles,
    longFee: opts.longDistanceFeeCents ?? FREE_DELIVERY_PROMO_DEFAULTS.longDistanceFeeCents,
  };
}

/** e.g. "Free delivery on $100+ orders" */
export function freeDeliveryHeadline(opts: DeliveryPromoOptions = {}): string {
  const { threshold } = resolve(opts);
  return `Free delivery on ${formatDollars(threshold)}+ orders`;
}

/** e.g. "within 25 mi of Covina" */
export function localRangeLabel(opts: DeliveryPromoOptions = {}): string {
  const { miles } = resolve(opts);
  return `within ${miles} mi of Covina`;
}

/**
 * Beyond-local note. Fees are now graduated by distance (not a single flat fee),
 * so the copy is intentionally amount-free.
 */
export function extendedFeeNote(_opts: DeliveryPromoOptions = {}): string {
  return "distance-based fees beyond";
}

/**
 * Compact qualifier for spots where the headline is shown separately.
 * e.g. "within 25 mi of Covina · distance-based fees beyond"
 */
export function freeDeliveryQualifier(opts: DeliveryPromoOptions = {}): string {
  return `${localRangeLabel(opts)} · ${extendedFeeNote(opts)}`;
}

/**
 * Full accurate one-liner.
 * e.g. "Free delivery on $100+ orders within 25 mi of Covina · distance-based fees beyond"
 */
export function freeDeliveryPromoLine(opts: DeliveryPromoOptions = {}): string {
  return `${freeDeliveryHeadline(opts)} ${freeDeliveryQualifier(opts)}`;
}
