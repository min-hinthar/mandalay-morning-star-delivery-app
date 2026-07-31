import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkCoverage } from "../coverage";
import { COVERAGE_LIMITS, KITCHEN_LOCATION } from "@/types/address";
import {
  withinCoverageResponse,
  longDistanceResponse,
  exceedsDistanceResponse,
  exceedsDurationResponse,
  atThresholdResponse,
  noRoutesResponse,
  apiErrorResponse,
  createRoutesResponse,
} from "@/test/mocks/google-routes";
// Mock getBusinessRules to return defaults (avoids Supabase calls in unit tests)
vi.mock("@/lib/settings/business-rules", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/settings/business-rules")>();
  return {
    ...actual,
    getBusinessRules: vi.fn().mockResolvedValue(actual.BUSINESS_RULES_DEFAULTS),
  };
});

// Store original fetch
const originalFetch = global.fetch;

describe("checkCoverage", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns valid when within distance and duration limits", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(withinCoverageResponse),
    } as Response);

    const result = await checkCoverage(34.0522, -118.2437);

    expect(result.isValid).toBe(true);
    expect(result.distanceMiles).toBeCloseTo(24.9, 0); // 40000m ~= 24.9 miles
    expect(result.durationMinutes).toBe(60);
    expect(result.reason).toBeUndefined();
    // 24.9mi is within the local zone (≤25mi) → standard tier, base fee.
    expect(result.feeTier).toBe("standard");
    expect(result.estimatedFeeCents).toBe(1500);
  });

  it("returns valid with a long-distance quote for a 50–100mi address", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(longDistanceResponse),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(true);
    expect(result.distanceMiles).toBeCloseTo(62.1, 0);
    expect(result.feeTier).toBe("far");
    // top band $30 + ceil(62.1 - 50) * $1.50 = 3000 + 13*150 = 4950
    expect(result.estimatedFeeCents).toBe(4950);
  });

  it("returns DISTANCE_EXCEEDED when over the 100 mile max", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(exceedsDistanceResponse),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(COVERAGE_LIMITS.maxRequestDistanceMiles);
    expect(result.reason).toBe("DISTANCE_EXCEEDED");
  });

  it("returns DURATION_EXCEEDED when over 90 minutes", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(exceedsDurationResponse),
    } as Response);

    const result = await checkCoverage(34.5, -118.5);

    expect(result.isValid).toBe(false);
    expect(result.durationMinutes).toBeGreaterThan(COVERAGE_LIMITS.maxDurationMinutes);
    expect(result.reason).toBe("DURATION_EXCEEDED");
  });

  it("returns valid at exact threshold (50 miles, 90 minutes)", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(atThresholdResponse),
    } as Response);

    const result = await checkCoverage(34.1, -118.1);

    expect(result.isValid).toBe(true);
    expect(result.distanceMiles).toBeCloseTo(50, 0);
    expect(result.durationMinutes).toBe(90);
    expect(result.reason).toBeUndefined();
  });

  it("returns ROUTE_FAILED when no routes found", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(noRoutesResponse),
    } as Response);

    const result = await checkCoverage(0, 0); // Invalid coordinates

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("ROUTE_FAILED");
    expect(result.distanceMiles).toBe(0);
    expect(result.durationMinutes).toBe(0);
  });

  it("returns ROUTE_FAILED on API error response", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(apiErrorResponse),
    } as Response);

    const result = await checkCoverage(34.0, -118.0);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("ROUTE_FAILED");
  });

  it("handles network failure gracefully", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const result = await checkCoverage(34.0, -118.0);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("ROUTE_FAILED");
    expect(result.distanceMiles).toBe(0);
    expect(result.durationMinutes).toBe(0);
  });

  it("rounds distance to 1 decimal place", async () => {
    // 45.5 miles = 73248.47 meters
    const response = createRoutesResponse(45.567, 60);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await checkCoverage(34.0, -118.0);

    expect(result.distanceMiles).toBe(45.6); // Rounded to 1 decimal
  });

  it("rounds duration to whole minutes", async () => {
    const response = createRoutesResponse(30, 45.7);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await checkCoverage(34.0, -118.0);

    expect(result.durationMinutes).toBe(46); // Rounded to whole minute
  });

  it("includes lat/lng in result", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(withinCoverageResponse),
    } as Response);

    const testLat = 34.0522;
    const testLng = -118.2437;
    const result = await checkCoverage(testLat, testLng);

    expect(result.lat).toBe(testLat);
    expect(result.lng).toBe(testLng);
  });

  it("sends correct request to Google Routes API", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(withinCoverageResponse),
    } as Response);

    const destLat = 34.0522;
    const destLng = -118.2437;
    await checkCoverage(destLat, destLng);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Goog-Api-Key": expect.any(String),
        }),
        body: expect.stringContaining(
          JSON.stringify({
            latitude: KITCHEN_LOCATION.lat,
            longitude: KITCHEN_LOCATION.lng,
          }).slice(1, -1) // Check origin coordinates are in body
        ),
      })
    );
  });

  it("prioritizes DISTANCE_EXCEEDED over DURATION_EXCEEDED when both fail", async () => {
    // Both exceed: 130 miles (> 100mi max), 200 minutes (> 180min far cap)
    const response = createRoutesResponse(130, 200);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(false);
    // Distance check happens first in the code
    expect(result.reason).toBe("DISTANCE_EXCEEDED");
  });

  it("allows a long-distance address whose drive time exceeds the 90min local cap", async () => {
    // 70 miles, 120 minutes — beyond the 50mi/90min standard tier, within 100mi/180min.
    const response = createRoutesResponse(70, 120);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(true);
    expect(result.feeTier).toBe("far");
  });

  it("handles missing duration in response", async () => {
    const responseWithNoDuration = {
      routes: [
        {
          distanceMeters: 40000,
          // duration is missing
        },
      ],
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithNoDuration),
    } as Response);

    const result = await checkCoverage(34.0, -118.0);

    expect(result.durationMinutes).toBe(0);
    expect(result.isValid).toBe(true); // 0 duration is within limits
  });

  it("handles missing distanceMeters in response", async () => {
    const responseWithNoDistance = {
      routes: [
        {
          duration: "3600s",
          // distanceMeters is missing
        },
      ],
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithNoDistance),
    } as Response);

    const result = await checkCoverage(34.0, -118.0);

    expect(result.distanceMiles).toBe(0);
    expect(result.isValid).toBe(true); // 0 distance is within limits
  });
});

/**
 * The homepage coverage checker is the FIRST thing a prospective customer
 * sees — before they have an account, an address, or a cart. It used to build
 * its own direction→days map that read an empty direction list as "matches
 * nothing", so a nearby address was told "Delivers: Saturday" while the
 * checkout picker offered every day. It now shares `addressServesDay` with the
 * picker and the checkout gate.
 */
describe("checkCoverage eligible days for a NEARBY address", () => {
  // ~4mi from the Covina kitchen — inside NEARBY_RADIUS_KM, so
  // getDirectionsForCoords returns [].
  const NEARBY_LAT = 34.0686;
  const NEARBY_LNG = -117.9389;
  // ~37mi east — genuinely direction-scoped.
  const FAR_EAST_LAT = 34.1083;
  const FAR_EAST_LNG = -117.2898;

  const CONFIGURED_DAYS = [
    { id: "1", dayOfWeek: 1, direction: "east", isActive: true },
    { id: "2", dayOfWeek: 3, direction: "west", isActive: true },
    { id: "3", dayOfWeek: 4, direction: "south", isActive: true },
    { id: "4", dayOfWeek: 6, direction: "all", isActive: true },
  ];

  async function coverageWithDays(
    lat: number,
    lng: number,
    days: unknown[] = CONFIGURED_DAYS
  ): Promise<Awaited<ReturnType<typeof checkCoverage>>> {
    const businessRules = await import("@/lib/settings/business-rules");
    const actual = await vi.importActual<typeof import("@/lib/settings/business-rules")>(
      "@/lib/settings/business-rules"
    );
    vi.mocked(businessRules.getBusinessRules).mockResolvedValueOnce({
      ...actual.BUSINESS_RULES_DEFAULTS,
      deliveryDays: days,
    } as never);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(withinCoverageResponse),
    } as Response);

    return checkCoverage(lat, lng);
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("lists EVERY configured day, not just the all-directions run", async () => {
    const result = await coverageWithDays(NEARBY_LAT, NEARBY_LNG);

    expect(result.directions).toEqual([]);
    expect(result.eligibleDays).toEqual(
      expect.arrayContaining(["Monday", "Wednesday", "Thursday", "Saturday"])
    );
  });

  it("still scopes a FAR address to its own direction plus the all run", async () => {
    const result = await coverageWithDays(FAR_EAST_LAT, FAR_EAST_LNG);

    expect(result.directions).toContain("east");
    expect(result.eligibleDays).toContain("Monday");
    expect(result.eligibleDays).toContain("Saturday");
    expect(result.eligibleDays).not.toContain("Wednesday");
  });

  it("does NOT advertise a day whose direction is unconfigured", async () => {
    // An absent direction is a config gap, not a run that serves everyone.
    // Quoting it here would promise a day checkout rejects.
    const result = await coverageWithDays(NEARBY_LAT, NEARBY_LNG, [
      { id: "1", dayOfWeek: 2, direction: undefined, isActive: true },
      { id: "2", dayOfWeek: 6, direction: "all", isActive: true },
    ]);

    expect(result.eligibleDays).toEqual(["Saturday"]);
  });

  it("does NOT fall back to legacy days when days ARE configured but all lack a direction", async () => {
    // The fallback is for "no config at all". Here the config exists and
    // genuinely serves nobody by direction, so quoting legacy Mon/Wed/Thu would
    // advertise days that aren't configured — and checkout rejects them anyway.
    const result = await coverageWithDays(NEARBY_LAT, NEARBY_LNG, [
      { id: "1", dayOfWeek: 2, direction: undefined, isActive: true },
    ]);

    expect(result.eligibleDays).toEqual([]);
  });

  it("falls back to every legacy run when no delivery days are configured", async () => {
    // Previously the fallback was gated on `dirs.length > 0`, so a nearby
    // address with no config got an EMPTY list — no days at all.
    const result = await coverageWithDays(NEARBY_LAT, NEARBY_LNG, []);

    expect(result.eligibleDays).toEqual(
      expect.arrayContaining(["Monday", "Wednesday", "Thursday", "Saturday"])
    );
  });
});

describe("coverage limits validation", () => {
  it("confirms max distance is 50 miles", () => {
    expect(COVERAGE_LIMITS.maxDistanceMiles).toBe(50);
  });

  it("confirms max duration is 90 minutes", () => {
    expect(COVERAGE_LIMITS.maxDurationMinutes).toBe(90);
  });

  it("confirms the long-distance ceiling is 100 miles / 180 minutes", () => {
    expect(COVERAGE_LIMITS.maxRequestDistanceMiles).toBe(100);
    expect(COVERAGE_LIMITS.maxRequestDurationMinutes).toBe(180);
  });

  it("confirms kitchen location is in Covina, CA", () => {
    expect(KITCHEN_LOCATION.lat).toBeCloseTo(34.0894, 3);
    expect(KITCHEN_LOCATION.lng).toBeCloseTo(-117.8897, 3);
    expect(KITCHEN_LOCATION.address).toContain("Covina");
  });
});
