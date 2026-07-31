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

  it("a nearby address is served by EVERY day (empty directions must not collapse to all-only)", () => {
    const a = resolveRouteDayAwareness({
      coords: NEARBY,
      deliveryDays: DAYS,
      deliveryZones: ZONES,
      now: SUNDAY,
    });
    expect(a).not.toBeNull();
    expect(a!.isLocal).toBe(true);
    // Monday is the next day overall — reachable only because local sees all days.
    expect(a!.dayName).toBe("Monday");
    expect(routeDayHeadline(a!)).toBe("We're delivering this Monday");
  });

  it("falls back to the generic schedule when no address is known", () => {
    const a = resolveRouteDayAwareness({ deliveryDays: DAYS, deliveryZones: ZONES, now: SUNDAY });
    expect(a).not.toBeNull();
    expect(a!.directions).toEqual([]);
    expect(a!.dayName).toBe("Monday");
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
