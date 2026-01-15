/**
 * Tests for ETA calculation utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateETA,
  calculateHaversineDistance,
  getDistance,
  estimateDrivingTime,
  formatETARange,
  formatArrivalTime,
  isArrivingSoon,
  calculateRemainingStops,
} from "../eta";

describe("calculateHaversineDistance", () => {
  it("returns 0 for same coordinates", () => {
    const result = calculateHaversineDistance(34.0894, -117.8897, 34.0894, -117.8897);
    expect(result).toBe(0);
  });

  it("calculates correct distance between Covina kitchen and downtown LA", () => {
    // Covina kitchen to Downtown LA (~30km)
    const result = calculateHaversineDistance(
      34.0894, -117.8897, // Covina
      34.0522, -118.2437  // Downtown LA
    );
    // Should be approximately 30-35km
    expect(result).toBeGreaterThan(28);
    expect(result).toBeLessThan(40);
  });

  it("calculates correct distance for nearby locations", () => {
    // ~1km apart
    const result = calculateHaversineDistance(
      34.0894, -117.8897,
      34.0984, -117.8897
    );
    // About 1km for 0.009 degrees latitude
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeLessThan(1.1);
  });

  it("handles negative coordinates", () => {
    const result = calculateHaversineDistance(
      -33.8688, 151.2093, // Sydney
      -37.8136, 144.9631  // Melbourne
    );
    // About 714km
    expect(result).toBeGreaterThan(700);
    expect(result).toBeLessThan(750);
  });
});

describe("getDistance", () => {
  it("returns distance between two LatLng points", () => {
    const point1 = { lat: 34.0894, lng: -117.8897 };
    const point2 = { lat: 34.0984, lng: -117.8897 };

    const result = getDistance(point1, point2);
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeLessThan(1.1);
  });
});

describe("estimateDrivingTime", () => {
  it("returns 0 for 0 distance", () => {
    expect(estimateDrivingTime(0)).toBe(0);
  });

  it("calculates reasonable time for short distance", () => {
    // 5km at ~56 kph = ~5.4 minutes
    const result = estimateDrivingTime(5);
    expect(result).toBeGreaterThanOrEqual(5);
    expect(result).toBeLessThanOrEqual(7);
  });

  it("calculates reasonable time for longer distance", () => {
    // 30km at ~56 kph = ~32 minutes
    const result = estimateDrivingTime(30);
    expect(result).toBeGreaterThanOrEqual(28);
    expect(result).toBeLessThanOrEqual(36);
  });
});

describe("calculateETA", () => {
  beforeEach(() => {
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-18T14:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates ETA for nearby location with no remaining stops", () => {
    const result = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 }, // ~1km away
      remainingStops: 0,
    });

    // Should be a few minutes for 1km
    expect(result.minMinutes).toBeLessThan(10);
    expect(result.maxMinutes).toBeGreaterThan(result.minMinutes);
    expect(result.estimatedArrival).toBeInstanceOf(Date);
  });

  it("adds stop buffer for remaining stops", () => {
    const noStops = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 },
      remainingStops: 0,
    });

    const withStops = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 },
      remainingStops: 5,
    });

    // With 5 stops, should add ~20-40 minutes to ETA
    expect(withStops.minMinutes).toBeGreaterThan(noStops.minMinutes);
    expect(withStops.maxMinutes).toBeGreaterThan(noStops.maxMinutes);
  });

  it("handles custom avgStopDuration", () => {
    const defaultDuration = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 },
      remainingStops: 3,
      avgStopDurationMinutes: 5,
    });

    const longerDuration = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 },
      remainingStops: 3,
      avgStopDurationMinutes: 10,
    });

    expect(longerDuration.minMinutes).toBeGreaterThan(defaultDuration.minMinutes);
  });

  it("returns valid Date for estimatedArrival", () => {
    const now = Date.now();
    const result = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 },
      remainingStops: 2,
    });

    expect(result.estimatedArrival).toBeInstanceOf(Date);
    expect(result.estimatedArrival.getTime()).toBeGreaterThan(now);
  });

  it("ensures minMinutes is at least 1", () => {
    const result = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0894, lng: -117.8897 }, // Same location
      remainingStops: 0,
    });

    expect(result.minMinutes).toBeGreaterThanOrEqual(1);
  });

  it("ensures maxMinutes is at least 5 more than minMinutes", () => {
    const result = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0894, lng: -117.8897 }, // Same location
      remainingStops: 0,
    });

    expect(result.maxMinutes).toBeGreaterThanOrEqual(result.minMinutes + 5);
  });

  it("calculates longer ETA for farther distances", () => {
    const nearResult = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0984, lng: -117.8897 }, // ~1km
      remainingStops: 0,
    });

    const farResult = calculateETA({
      driverLocation: { lat: 34.0894, lng: -117.8897 },
      customerLocation: { lat: 34.0522, lng: -118.2437 }, // Downtown LA ~30km
      remainingStops: 0,
    });

    expect(farResult.minMinutes).toBeGreaterThan(nearResult.minMinutes);
    expect(farResult.maxMinutes).toBeGreaterThan(nearResult.maxMinutes);
  });
});

describe("formatETARange", () => {
  it("formats small range as 'Less than 10 minutes'", () => {
    expect(formatETARange(3, 7)).toBe("Less than 10 minutes");
    expect(formatETARange(5, 10)).toBe("Less than 10 minutes");
  });

  it("formats moderate range with minute bounds", () => {
    expect(formatETARange(15, 25)).toBe("15-25 minutes");
    expect(formatETARange(12, 18)).toBe("10-20 minutes"); // Rounds to 5
  });

  it("formats hour-long ETAs", () => {
    expect(formatETARange(60, 75)).toMatch(/1.*hour/);
    expect(formatETARange(90, 120)).toMatch(/1-2 hours|2 hours/);
  });

  it("handles exact hour matches", () => {
    expect(formatETARange(60, 60)).toBe("About 1 hour");
    expect(formatETARange(120, 120)).toBe("About 2 hours");
  });
});

describe("formatArrivalTime", () => {
  it("formats morning time correctly", () => {
    const date = new Date("2026-01-18T09:30:00");
    expect(formatArrivalTime(date)).toBe("9:30 AM");
  });

  it("formats afternoon time correctly", () => {
    const date = new Date("2026-01-18T14:30:00");
    expect(formatArrivalTime(date)).toBe("2:30 PM");
  });

  it("formats noon correctly", () => {
    const date = new Date("2026-01-18T12:00:00");
    expect(formatArrivalTime(date)).toBe("12:00 PM");
  });

  it("formats midnight correctly", () => {
    const date = new Date("2026-01-18T00:00:00");
    expect(formatArrivalTime(date)).toBe("12:00 AM");
  });
});

describe("isArrivingSoon", () => {
  it("returns true when driver is within threshold", () => {
    const driver = { lat: 34.0894, lng: -117.8897 };
    const customer = { lat: 34.0898, lng: -117.8897 }; // ~40 meters

    expect(isArrivingSoon(driver, customer)).toBe(true);
  });

  it("returns false when driver is beyond threshold", () => {
    const driver = { lat: 34.0894, lng: -117.8897 };
    const customer = { lat: 34.1000, lng: -117.8897 }; // ~1.2km

    expect(isArrivingSoon(driver, customer)).toBe(false);
  });

  it("respects custom threshold", () => {
    const driver = { lat: 34.0894, lng: -117.8897 };
    const customer = { lat: 34.0984, lng: -117.8897 }; // ~1km

    // Should be false with default 0.5km threshold
    expect(isArrivingSoon(driver, customer, 0.5)).toBe(false);
    // Should be true with 2km threshold
    expect(isArrivingSoon(driver, customer, 2)).toBe(true);
  });
});

describe("calculateRemainingStops", () => {
  it("returns correct remaining stops", () => {
    expect(calculateRemainingStops(0, 5)).toBe(5);
    expect(calculateRemainingStops(3, 5)).toBe(2);
    expect(calculateRemainingStops(5, 5)).toBe(0);
  });

  it("returns 0 when current is past target", () => {
    expect(calculateRemainingStops(7, 5)).toBe(0);
  });

  it("handles 0 indices", () => {
    expect(calculateRemainingStops(0, 0)).toBe(0);
    expect(calculateRemainingStops(0, 1)).toBe(1);
  });
});
