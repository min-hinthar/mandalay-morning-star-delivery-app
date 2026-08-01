export function formatPrice(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Dollar amount for an order FLOOR (minimum, threshold) — whole dollars when
 * the value is round, cents when it isn't.
 *
 * The floors were printed with `.toFixed(0)` while the shortfall beside them
 * used `.toFixed(2)`. Admins can set a non-round minimum (the settings input is
 * `step={0.01}` and the Zod bound only caps the range), and the server's
 * MINIMUM_ORDER_NOT_MET message uses `.toFixed(2)` — so a 2750 minimum rendered
 * as "$3.50 below the $28 minimum" (self-contradictory: 24.00 + 3.50 = 27.50)
 * while the server said "$27.50 minimum". Round values still read "$25", not
 * "$25.00".
 */
export function formatFloorDollars(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100}` : (cents / 100).toFixed(2);
}
