import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkCoverage } from "../coverage";
import { COVERAGE_LIMITS, KITCHEN_LOCATION } from "@/types/address";
import {
  withinCoverageResponse,
  exceedsDistanceResponse,
  exceedsDurationResponse,
  atThresholdResponse,
  noRoutesResponse,
  apiErrorResponse,
  createRoutesResponse,
} from "@/test/mocks/google-routes";

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
  });

  it("returns DISTANCE_EXCEEDED when over 40 miles", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(exceedsDistanceResponse),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(COVERAGE_LIMITS.maxDistanceMiles);
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

  it("returns valid at exact threshold (40 miles, 90 minutes)", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(atThresholdResponse),
    } as Response);

    const result = await checkCoverage(34.1, -118.1);

    expect(result.isValid).toBe(true);
    expect(result.distanceMiles).toBeCloseTo(40, 0);
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
    // Both exceed: 60 miles, 100 minutes
    const response = createRoutesResponse(60, 100);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await checkCoverage(35.0, -119.0);

    expect(result.isValid).toBe(false);
    // Distance check happens first in the code
    expect(result.reason).toBe("DISTANCE_EXCEEDED");
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

describe("coverage limits validation", () => {
  it("confirms max distance is 40 miles", () => {
    expect(COVERAGE_LIMITS.maxDistanceMiles).toBe(40);
  });

  it("confirms max duration is 90 minutes", () => {
    expect(COVERAGE_LIMITS.maxDurationMinutes).toBe(90);
  });

  it("confirms kitchen location is in Covina, CA", () => {
    expect(KITCHEN_LOCATION.lat).toBeCloseTo(34.0858, 3);
    expect(KITCHEN_LOCATION.lng).toBeCloseTo(-117.8896, 3);
    expect(KITCHEN_LOCATION.address).toContain("Covina");
  });
});
