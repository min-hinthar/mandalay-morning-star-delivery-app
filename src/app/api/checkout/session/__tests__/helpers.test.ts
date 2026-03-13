import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_ZONES } from "@/lib/utils/delivery-zones";
import type { DeliveryDayConfig } from "@/types/delivery";

/**
 * Tests for resolveAddressDistance direction mismatch logic.
 * We mock coverage + supabase to isolate the direction validation.
 */

vi.mock("@/lib/services/coverage", () => ({
  checkCoverage: vi.fn().mockResolvedValue({ isValid: true, distanceMiles: 15 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    from: () => ({ update: () => ({ eq: vi.fn().mockResolvedValue({}) }) }),
  })),
}));

const TEST_DAYS: DeliveryDayConfig[] = [
  {
    id: "d1",
    dayOfWeek: 1,
    direction: "east",
    isActive: true,
    cutoffDay: 0,
    cutoffHour: 20,
    deliveryFeeCents: 1500,
    displayOrder: 0,
  },
  {
    id: "d2",
    dayOfWeek: 3,
    direction: "west",
    isActive: true,
    cutoffDay: 2,
    cutoffHour: 20,
    deliveryFeeCents: 1500,
    displayOrder: 1,
  },
  {
    id: "d3",
    dayOfWeek: 4,
    direction: "south",
    isActive: true,
    cutoffDay: 3,
    cutoffHour: 20,
    deliveryFeeCents: 1500,
    displayOrder: 2,
  },
  {
    id: "d4",
    dayOfWeek: 6,
    direction: "all",
    isActive: true,
    cutoffDay: 5,
    cutoffHour: 20,
    deliveryFeeCents: 1500,
    displayOrder: 3,
  },
];

// East of Covina — bearing ~60° (inside east zone 350-80°)
const EAST_ADDRESS = {
  id: "addr-east",
  user_id: "user-1",
  label: "Home",
  line_1: "123 East St",
  line_2: null,
  city: "San Bernardino",
  state: "CA",
  postal_code: "92401",
  formatted_address: "123 East St, San Bernardino, CA 92401",
  lat: 34.1083,
  lng: -117.2898, // Far east of Covina → ~60° bearing
  is_default: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  distance_miles: 10,
} as Record<string, unknown>;

describe("resolveAddressDistance", () => {
  let resolveAddressDistance: typeof import("../helpers").resolveAddressDistance;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../helpers");
    resolveAddressDistance = mod.resolveAddressDistance;
  });

  it("returns no direction error when day direction matches address", async () => {
    const eastDay = TEST_DAYS[0]; // Monday = east
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      eastDay,
      DEFAULT_ZONES,
      "2026-03-16",
      TEST_DAYS
    );

    expect(result.directionError).toBeUndefined();
    expect(result.directionDetails).toBeUndefined();
  });

  it("returns no direction error when day is 'all' direction", async () => {
    const saturdayDay = TEST_DAYS[3]; // Saturday = all
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      saturdayDay,
      DEFAULT_ZONES,
      "2026-03-21",
      TEST_DAYS
    );

    expect(result.directionError).toBeUndefined();
    expect(result.directionDetails).toBeUndefined();
  });

  it("returns direction mismatch when east address schedules west day", async () => {
    const westDay = TEST_DAYS[1]; // Wednesday = west
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      westDay,
      DEFAULT_ZONES,
      "2026-03-18",
      TEST_DAYS
    );

    expect(result.directionError).toBeDefined();
    expect(result.directionDetails).toBeDefined();
    expect(result.directionDetails!.customerDirections).toContain("east");
    expect(result.directionDetails!.selectedDayDirection).toBe("west");
  });

  it("returns structured directionDetails with eligible day names", async () => {
    const westDay = TEST_DAYS[1];
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      westDay,
      DEFAULT_ZONES,
      "2026-03-18",
      TEST_DAYS
    );

    const details = result.directionDetails!;
    // East address → eligible for east days (Monday) + all days (Saturday)
    expect(details.eligibleDayNames).toContain("Monday");
    expect(details.eligibleDayNames).toContain("Saturday");
    // Should NOT include west day
    expect(details.eligibleDayNames).not.toContain("Wednesday");
  });

  it("formats customerRouteLabel for single direction", async () => {
    const westDay = TEST_DAYS[1];
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      westDay,
      DEFAULT_ZONES,
      "2026-03-18",
      TEST_DAYS
    );

    // customerRouteLabel should be a string describing the route
    expect(result.directionDetails!.customerRouteLabel).toBeTruthy();
    expect(typeof result.directionDetails!.customerRouteLabel).toBe("string");
  });

  it("returns distanceMiles from address row", async () => {
    const eastDay = TEST_DAYS[0];
    const result = await resolveAddressDistance(
      EAST_ADDRESS as never,
      eastDay,
      DEFAULT_ZONES,
      "2026-03-16",
      TEST_DAYS
    );

    expect(result.distanceMiles).toBe(10);
  });
});
