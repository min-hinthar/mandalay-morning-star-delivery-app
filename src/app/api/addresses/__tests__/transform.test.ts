import { describe, expect, it } from "vitest";
import { transformAddress } from "../transform";
import type { DeliveryZoneConfig } from "@/types/delivery";

const BASE_ROW = {
  id: "addr-1",
  user_id: "user-1",
  label: "Home",
  line_1: "123 Main St",
  line_2: null,
  city: "Azusa",
  state: "CA",
  postal_code: "91702",
  formatted_address: "123 Main St, Azusa, CA 91702",
  lat: 34.1336,
  lng: -117.9076,
  is_default: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const TEST_ZONES: DeliveryZoneConfig[] = [
  { id: "z1", direction: "east", bearingStart: 30, bearingEnd: 120, referenceCities: ["Azusa"] },
  { id: "z2", direction: "west", bearingStart: 210, bearingEnd: 300, referenceCities: ["Pomona"] },
  {
    id: "z3",
    direction: "south",
    bearingStart: 150,
    bearingEnd: 210,
    referenceCities: ["Anaheim"],
  },
];

describe("transformAddress", () => {
  it("transforms basic address fields correctly", () => {
    const result = transformAddress(BASE_ROW as never);
    expect(result.id).toBe("addr-1");
    expect(result.userId).toBe("user-1");
    expect(result.label).toBe("Home");
    expect(result.line1).toBe("123 Main St");
    expect(result.city).toBe("Azusa");
    expect(result.formattedAddress).toBe("123 Main St, Azusa, CA 91702");
    expect(result.isDefault).toBe(true);
  });

  it("populates directions when deliveryZones provided", () => {
    const result = transformAddress(BASE_ROW as never, TEST_ZONES);
    expect(result.directions).toBeDefined();
    expect(result.directions!.length).toBeGreaterThan(0);
  });

  it("does not include eligibleDays (removed field)", () => {
    const result = transformAddress(BASE_ROW as never, TEST_ZONES);
    expect("eligibleDays" in result).toBe(false);
  });

  it("sets feeTier to standard when distance <= 25mi", () => {
    const row = { ...BASE_ROW, distance_miles: 15 };
    const result = transformAddress(row as never, TEST_ZONES);
    expect(result.feeTier).toBe("standard");
  });

  it("sets feeTier to extended when distance > 25mi", () => {
    const row = { ...BASE_ROW, distance_miles: 30 };
    const result = transformAddress(row as never, TEST_ZONES);
    expect(result.feeTier).toBe("extended");
  });

  it("leaves feeTier undefined when no distance_miles", () => {
    const result = transformAddress(BASE_ROW as never, TEST_ZONES);
    expect(result.feeTier).toBeUndefined();
  });

  it("falls back to formatted_address from line_1 when formatted_address is null", () => {
    const row = { ...BASE_ROW, formatted_address: null };
    const result = transformAddress(row as never);
    expect(result.formattedAddress).toBe("123 Main St");
  });

  it("handles zero lat/lng by skipping direction enrichment", () => {
    const row = { ...BASE_ROW, lat: 0, lng: 0 };
    const result = transformAddress(row as never, TEST_ZONES);
    expect(result.directions).toBeUndefined();
    expect(result.feeTier).toBeUndefined();
  });
});
