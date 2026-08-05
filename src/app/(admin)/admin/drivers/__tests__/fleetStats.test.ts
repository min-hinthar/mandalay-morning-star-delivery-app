/**
 * The fleet "Avg Rating" card reported a materially wrong number.
 *
 * The unrated sentinel is 0, not null, so the old `ratingAvg !== null`
 * denominator filter excluded nobody and every unrated driver entered the mean
 * as a genuine 0-star score.
 */

import { describe, it, expect } from "vitest";
import { computeFleetAverageRating } from "../fleetStats";

const driver = (ratingAvg: number | null) => ({ ratingAvg });

describe("computeFleetAverageRating", () => {
  it("ignores unrated drivers instead of scoring them zero", () => {
    // The headline case. Old behaviour: 4.8 / 5 = 0.96, rendered "1.0 / 5.0"
    // on the Driver Fleet header while the only rated driver averaged 4.8.
    const fleet = [driver(4.8), driver(0), driver(0), driver(0), driver(0)];

    expect(computeFleetAverageRating(fleet)).toBeCloseTo(4.8, 5);
  });

  it("gets worse with every hire under the old rule — but not under this one", () => {
    // Guards the property that actually stung: the reported average must not
    // move when an unrated driver joins.
    const before = computeFleetAverageRating([driver(4.0), driver(5.0)]);
    const after = computeFleetAverageRating([driver(4.0), driver(5.0), driver(0)]);

    expect(after).toBe(before);
  });

  it("returns null when nobody has been rated yet", () => {
    // Not 0 — the caller renders an em dash for null, and 0 would read as a
    // real bottom-of-scale fleet. This case also used to render "—0", because
    // `{avgRating && ...}` renders the NUMBER 0 in JSX.
    expect(computeFleetAverageRating([driver(0), driver(0)])).toBeNull();
  });

  it("returns null for an empty fleet", () => {
    expect(computeFleetAverageRating([])).toBeNull();
  });

  it("excludes nulls too, not just zeros", () => {
    // No live path writes NULL, but the column permits it (no NOT NULL), and a
    // null is just as much 'no rating' as a 0.
    expect(computeFleetAverageRating([driver(3.0), driver(null), driver(0)])).toBe(3.0);
  });

  it("averages a fully-rated fleet exactly", () => {
    expect(computeFleetAverageRating([driver(4.0), driver(5.0), driver(3.0)])).toBeCloseTo(4.0, 5);
  });

  it("keeps a lone rated driver's own score", () => {
    expect(computeFleetAverageRating([driver(2.5)])).toBe(2.5);
  });
});
