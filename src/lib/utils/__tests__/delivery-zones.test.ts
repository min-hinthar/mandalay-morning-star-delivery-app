import { describe, expect, it } from "vitest";
import {
  calculateBearing,
  getDirectionsForCoords,
  filterDaysByDirection,
  DEFAULT_ZONES,
} from "../delivery-zones";
import type { DeliveryDayConfig } from "@/types/delivery";

describe("calculateBearing", () => {
  // Kitchen origin: 34.0894, -117.8897

  it("returns ~270° for points due west", () => {
    // Santa Monica is roughly west
    const bearing = calculateBearing(34.0195, -118.4912);
    expect(bearing).toBeGreaterThan(250);
    expect(bearing).toBeLessThan(280);
  });

  it("returns ~90° for points due east", () => {
    // San Bernardino is roughly east
    const bearing = calculateBearing(34.1083, -117.2898);
    expect(bearing).toBeGreaterThan(80);
    expect(bearing).toBeLessThan(100);
  });

  it("returns ~180° for points due south", () => {
    // Anaheim is roughly south
    const bearing = calculateBearing(33.8366, -117.9143);
    expect(bearing).toBeGreaterThan(170);
    expect(bearing).toBeLessThan(200);
  });
});

describe("getDirectionsForCoords", () => {
  it("returns 'east' for Pomona", () => {
    // Pomona: 34.0551, -117.7523
    const result = getDirectionsForCoords(34.0551, -117.7523, DEFAULT_ZONES);
    expect(result).toContain("east");
  });

  it("returns 'west' for Pasadena", () => {
    // Pasadena: 34.1478, -118.1445
    const result = getDirectionsForCoords(34.1478, -118.1445, DEFAULT_ZONES);
    expect(result).toContain("west");
  });

  it("returns 'south' for Anaheim", () => {
    // Anaheim: 33.8366, -117.9143
    const result = getDirectionsForCoords(33.8366, -117.9143, DEFAULT_ZONES);
    expect(result).toContain("south");
  });

  it("returns multiple directions for boundary areas", () => {
    // A point in a gap zone should return 2 adjacent directions
    // Whittier is between east and south (roughly bearing 120-140)
    const result = getDirectionsForCoords(33.9792, -118.0328, DEFAULT_ZONES);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe("filterDaysByDirection", () => {
  const mockDays: DeliveryDayConfig[] = [
    {
      id: "1",
      dayOfWeek: 1,
      isActive: true,
      cutoffDay: 0,
      cutoffHour: 15,
      deliveryFeeCents: 1500,
      displayOrder: 0,
      direction: "east",
    },
    {
      id: "2",
      dayOfWeek: 3,
      isActive: true,
      cutoffDay: 2,
      cutoffHour: 15,
      deliveryFeeCents: 1500,
      displayOrder: 1,
      direction: "west",
    },
    {
      id: "3",
      dayOfWeek: 4,
      isActive: true,
      cutoffDay: 3,
      cutoffHour: 15,
      deliveryFeeCents: 1500,
      displayOrder: 2,
      direction: "south",
    },
    {
      id: "4",
      dayOfWeek: 6,
      isActive: true,
      cutoffDay: 5,
      cutoffHour: 15,
      deliveryFeeCents: 1500,
      displayOrder: 3,
      direction: "all",
    },
  ];

  it("returns matching direction + Saturday for east", () => {
    const result = filterDaysByDirection(["east"], mockDays);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.dayOfWeek)).toEqual([1, 6]);
  });

  it("returns matching direction + Saturday for west", () => {
    const result = filterDaysByDirection(["west"], mockDays);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.dayOfWeek)).toEqual([3, 6]);
  });

  it("returns multiple matching days + Saturday for boundary zones", () => {
    const result = filterDaysByDirection(["east", "south"], mockDays);
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.dayOfWeek)).toEqual([1, 4, 6]);
  });

  it("returns only Saturday when no direction matches", () => {
    const result = filterDaysByDirection([], mockDays);
    expect(result).toHaveLength(1);
    expect(result[0].dayOfWeek).toBe(6);
  });
});
