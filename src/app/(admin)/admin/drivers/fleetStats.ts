/**
 * Fleet-wide average rating, over the drivers who actually have one.
 *
 * The sentinel for "never been rated" is **0, not null**. `drivers.rating_avg`
 * is `numeric(3,2) DEFAULT 0` (baseline:211) and the recompute trigger writes
 * `COALESCE(v_new_avg, 0)` (baseline:1692), so no live path produces NULL —
 * every unrated driver carries a literal 0.
 *
 * That 0 is unambiguous rather than merely conventional:
 * `driver_ratings_rating_check CHECK (rating >= 1 AND rating <= 5)`
 * (baseline:199) means a driver with even one rating averages at least 1. A 0
 * can therefore never be a real score, so excluding it cannot discard a
 * legitimate rating.
 *
 * The previous inline version filtered the denominator on `ratingAvg !== null`
 * while summing over EVERY driver. Since nothing is ever null, that filter
 * excluded nobody: unrated drivers entered the numerator as genuine 0-star
 * scores and the denominator counted them too. One 4.8-rated driver alongside
 * four unrated ones rendered "1.0 / 5.0" — and the number got worse with every
 * driver hired, which is the opposite of what an admin would infer.
 *
 * The rest of the app already reads 0 as unrated (`DriverStatsCards.tsx`
 * `ratingAvg > 0`, `OpsDriverPanel.tsx` `formatRating`); this aggregate was the
 * one place that did not.
 */
export function computeFleetAverageRating(drivers: { ratingAvg: number | null }[]): number | null {
  const rated = drivers.filter(
    (d): d is { ratingAvg: number } => d.ratingAvg !== null && d.ratingAvg > 0
  );

  // Null, not 0: "nobody has been rated yet" is unknown, not a zero score. The
  // caller renders an em dash for null, and 0 would be indistinguishable from
  // a real (impossible) bottom-of-scale fleet.
  if (rated.length === 0) return null;

  return rated.reduce((sum, d) => sum + d.ratingAvg, 0) / rated.length;
}
