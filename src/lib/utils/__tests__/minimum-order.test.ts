import { describe, expect, it } from "vitest";

import { resolveDeliveryFee, resolveMinimumOrder, type DeliveryPricingConfig } from "../order";

const OPTS = { baseMinimumCents: 2500, extendedMinimumCents: 10000 };

// Mirrors BUSINESS_RULES_DEFAULTS after the graduated-pricing change.
const PRICING: DeliveryPricingConfig = {
  localFeeCents: 1500,
  localRadiusMiles: 25,
  freeDeliveryThresholdCents: 10000,
  bands: [
    { maxMiles: 30, feeCents: 2000 },
    { maxMiles: 40, feeCents: 2500 },
    { maxMiles: 50, feeCents: 3000 },
  ],
  standardRadiusMiles: 50,
  extendedEnabled: true,
  extendedPerMileCents: 150,
  maxRadiusMiles: 100,
};

describe("resolveMinimumOrder", () => {
  it("local orders keep the $25 floor", () => {
    expect(resolveMinimumOrder(2700, "local", OPTS)).toEqual({
      minimumCents: 2500,
      shortfallCents: 0,
      meetsMinimum: true,
      isExtendedMinimum: false,
    });
  });

  it("blocks the incident: a $27 order 38.8mi out", () => {
    // Order 214e2c77 — $27 subtotal, 38.8mi, ~78mi round trip.
    const tier = resolveDeliveryFee(38.8, 2700, PRICING).tier;
    expect(tier).toBe("extended");
    const r = resolveMinimumOrder(2700, tier, OPTS);
    expect(r.meetsMinimum).toBe(false);
    expect(r.isExtendedMinimum).toBe(true);
    expect(r.minimumCents).toBe(10000);
    expect(r.shortfallCents).toBe(7300);
  });

  it("allows a far order that clears the floor", () => {
    const tier = resolveDeliveryFee(38.8, 10700, PRICING).tier;
    expect(resolveMinimumOrder(10700, tier, OPTS).meetsMinimum).toBe(true);
  });

  it("applies to the far (per-mile) tier too, not just banded extended", () => {
    const tier = resolveDeliveryFee(60, 5000, PRICING).tier;
    expect(tier).toBe("far");
    expect(resolveMinimumOrder(5000, tier, OPTS).isExtendedMinimum).toBe(true);
  });

  it("does NOT apply to out-of-range — that's a coverage rejection, not 'add more food'", () => {
    const tier = resolveDeliveryFee(120, 1000, PRICING).tier;
    expect(tier).toBe("out-of-range");
    const r = resolveMinimumOrder(1000, tier, OPTS);
    expect(r.isExtendedMinimum).toBe(false);
    expect(r.minimumCents).toBe(2500);
  });

  it("boundary: 25mi is local, just past it is extended", () => {
    expect(
      resolveMinimumOrder(3000, resolveDeliveryFee(25, 3000, PRICING).tier, OPTS).minimumCents
    ).toBe(2500);
    expect(
      resolveMinimumOrder(3000, resolveDeliveryFee(25.1, 3000, PRICING).tier, OPTS).minimumCents
    ).toBe(10000);
  });

  it("unknown distance is treated as local (legacy rows are not punished)", () => {
    const tier = resolveDeliveryFee(null, 3000, PRICING).tier;
    expect(tier).toBe("local");
    expect(resolveMinimumOrder(3000, tier, OPTS).isExtendedMinimum).toBe(false);
  });

  it("an extended floor at/below the base floor is a no-op (admin can disable it)", () => {
    const disabled = { baseMinimumCents: 2500, extendedMinimumCents: 0 };
    const r = resolveMinimumOrder(2600, "extended", disabled);
    expect(r.isExtendedMinimum).toBe(false);
    expect(r.minimumCents).toBe(2500);
    expect(r.meetsMinimum).toBe(true);
  });

  it("measures the PRE-discount subtotal — the same number that picked the tier", () => {
    // A $105 basket discounted to $85 still clears the floor: the fee it is
    // charged was derived from $105, so the gate must use $105 too.
    const subtotal = 10500;
    const tier = resolveDeliveryFee(38.8, subtotal, PRICING).tier;
    expect(resolveMinimumOrder(subtotal, tier, OPTS).meetsMinimum).toBe(true);
  });
});
