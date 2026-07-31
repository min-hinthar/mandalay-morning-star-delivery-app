import { describe, expect, it } from "vitest";

import { resolveRouteDayAwareness, routeDayHeadline } from "../route-awareness";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

// Mon (east), Wed (west), Thu (south), Sat (all) — the live schedule shape.
// Cutoff: the day before at 3 PM.
function day(
  dayOfWeek: number,
  direction: DeliveryDayConfig["direction"],
  overrides: Partial<DeliveryDayConfig> = {}
): DeliveryDayConfig {
  return {
    id: `d${dayOfWeek}`,
    dayOfWeek,
    isActive: true,
    cutoffDay: (dayOfWeek + 6) % 7,
    cutoffHour: 15,
    deliveryFeeCents: 1500,
    displayOrder: dayOfWeek,
    direction,
    ...overrides,
  };
}

const DAYS: DeliveryDayConfig[] = [day(1, "east"), day(3, "west"), day(4, "south"), day(6, "all")];

const ZONES: DeliveryZoneConfig[] = [
  { id: "z1", direction: "east", bearingStart: 45, bearingEnd: 135, referenceCities: [] },
  { id: "z2", direction: "west", bearingStart: 225, bearingEnd: 315, referenceCities: [] },
  { id: "z3", direction: "south", bearingStart: 135, bearingEnd: 225, referenceCities: [] },
];

// Kitchen is Covina CA. Santa Monica is far WEST — the incident address.
const SANTA_MONICA = { lat: 34.017134, lng: -118.49186 };
// A few blocks from the kitchen — "nearby", served by every day.
const NEARBY = { lat: 34.09, lng: -117.89 };

// A Sunday, well before any cutoff.
const SUNDAY = new Date("2026-08-02T18:00:00Z");

describe("resolveRouteDayAwareness", () => {
  it("names the WEST run for a Santa Monica address (never a neighbour count)", () => {
    const a = resolveRouteDayAwareness({
      coords: SANTA_MONICA,
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    expect(a).not.toBeNull();
    expect(a!.directions).toContain("west");
    expect(a!.isLocal).toBe(false);
    // Only west (Wed) + all (Sat) serve this address; Wednesday comes first.
    expect(a!.dayName).toBe("Wednesday");
    expect(a!.routeLabel).toBe("West Route");
    expect(a!.cutoffText).toMatch(/Order by Tuesday 3 PM/);
    expect(routeDayHeadline(a!)).toBe("We're driving the West Route this Wednesday");
  });

  it("a nearby address is quoted the NEXT run, not just the all-directions one", () => {
    const a = resolveRouteDayAwareness({
      coords: NEARBY,
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    expect(a).not.toBeNull();
    expect(a!.isLocal).toBe(true);
    // Monday, the soonest run — an empty direction list means NEARBY, which
    // every route passes close to, so addressServesDay accepts it and so does
    // checkout's gate. This test previously pinned "Saturday": the banner was
    // deliberately conservative while the two halves disagreed and Monday would
    // have failed at submit. Both now share addressServesDay, so the nearest
    // day is genuinely orderable.
    expect(a!.dayName).toBe("Monday");
    // Still no route label: a nearby address isn't ON a named route.
    expect(a!.routeLabel).toBeNull();
    expect(routeDayHeadline(a!)).toBe("We're delivering this Monday");
  });

  it("with no address known, advertises only a run that serves EVERY direction", () => {
    const a = resolveRouteDayAwareness({ deliveryDays: DAYS, deliveryZones: ZONES, now: SUNDAY });
    expect(a).not.toBeNull();
    expect(a!.directions).toEqual([]);
    // NOT Monday, even though it's the nearest run: Monday is east-only, and a
    // west-side anonymous visitor can't be served by it. Saturday is the
    // "all"-direction run, so it's true for whoever is reading.
    expect(a!.dayName).toBe("Saturday");
    expect(a!.routeLabel).toBeNull();
    expect(routeDayHeadline(a!)).toBe("We're delivering this Saturday");
  });

  it("with no address known, a day MISSING a direction is not treated as all-serving", () => {
    // `direction` is optional, and filterDaysByDirection (the known-address
    // branch) drops an undefined-direction day. The unplaced branch must agree,
    // or it would advertise a run the directional path refuses to serve.
    const noDirection = { ...day(2, "all"), direction: undefined };
    expect(
      resolveRouteDayAwareness({
        deliveryDays: [day(1, "east"), noDirection],
        deliveryZones: ZONES,
        now: SUNDAY,
      })
    ).toBeNull();
  });

  it("with no address known and no all-directions run, says nothing", () => {
    // Every configured run is direction-scoped, so there is no day we could
    // honestly promise an unplaced visitor.
    expect(
      resolveRouteDayAwareness({
        deliveryDays: [day(1, "east"), day(3, "west")],
        deliveryZones: ZONES,
        now: SUNDAY,
      })
    ).toBeNull();
  });

  it("known-local and unplaced now diverge — an empty list means opposite things", () => {
    // Both carry `directions: []`, but for opposite reasons, and they must NOT
    // be collapsed:
    //   known-local — we PLACED the address and it came back nearby, so every
    //     route serves it → quote the soonest run (Monday).
    //   unplaced    — we could not place the reader at all, so we know nothing
    //     about their direction → quote only the run that serves EVERY
    //     direction (Saturday), or we'd promise a west-side visitor an
    //     east-only Monday.
    // isLocal is what distinguishes them, and it drives the day.
    const local = resolveRouteDayAwareness({
      coords: NEARBY,
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    const unknown = resolveRouteDayAwareness({
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    expect(local!.dayName).toBe("Monday");
    expect(local!.isLocal).toBe(true);
    expect(unknown!.dayName).toBe("Saturday");
    expect(unknown!.isLocal).toBe(false);
  });

  describe("coverage ceiling", () => {
    it("says nothing for an address now beyond the max radius", () => {
      // A bearing exists for any coordinate, so without a distance check this
      // address would keep matching the West run after the operator lowered the
      // radius — while checkout answers OUT_OF_COVERAGE.
      expect(
        resolveRouteDayAwareness({
          coords: SANTA_MONICA,
          deliveryDays: DAYS,
          deliveryZones: ZONES,
          now: SUNDAY,
          distanceMiles: 60,
          maxRadiusMiles: 50,
        })
      ).toBeNull();
    });

    it("still resolves an address exactly at the ceiling", () => {
      const a = resolveRouteDayAwareness({
        coords: SANTA_MONICA,
        deliveryDays: DAYS,
        deliveryZones: ZONES,
        now: SUNDAY,
        distanceMiles: 50,
        maxRadiusMiles: 50,
      });
      expect(a).not.toBeNull();
      expect(a!.dayName).toBe("Wednesday");
    });

    it("treats an unmeasured distance as in range rather than silencing them", () => {
      // 4 of the live addresses have a null distance; suppressing those would
      // mute real local customers over missing backfill.
      const a = resolveRouteDayAwareness({
        coords: SANTA_MONICA,
        deliveryDays: DAYS,
        deliveryZones: ZONES,
        now: SUNDAY,
        distanceMiles: null,
        maxRadiusMiles: 50,
      });
      expect(a).not.toBeNull();
    });
  });

  it("returns null when the address's direction matches no configured run", () => {
    // Only an EAST run exists, but the address is far west.
    const a = resolveRouteDayAwareness({
      coords: SANTA_MONICA,
      deliveryDays: [day(1, "east")],
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    expect(a).toBeNull();
  });

  it("returns null when there are no active delivery days (says nothing, invents nothing)", () => {
    expect(
      resolveRouteDayAwareness({
        coords: SANTA_MONICA,
        deliveryDays: DAYS.map((d) => ({ ...d, isActive: false })),
        deliveryZones: ZONES,
        now: SUNDAY,
      })
    ).toBeNull();
    expect(resolveRouteDayAwareness({ deliveryDays: [], now: SUNDAY })).toBeNull();
  });

  it("skips a run whose cutoff has already passed", () => {
    // Tuesday 5 PM PT — Wednesday's 3 PM Tuesday cutoff is gone.
    const tueEvening = new Date("2026-08-05T00:30:00Z");
    const a = resolveRouteDayAwareness({
      coords: SANTA_MONICA,
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: tueEvening,
    });
    expect(a).not.toBeNull();
    // Wednesday is closed → next west-serving run is Saturday's all-directions day.
    expect(a!.dayName).toBe("Saturday");
    expect(a!.routeLabel).toBeNull();
  });
});
