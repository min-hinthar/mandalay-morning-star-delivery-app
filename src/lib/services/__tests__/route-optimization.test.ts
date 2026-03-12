import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  optimizeRoute,
  validateStopsForOptimization,
  type RoutableStop,
} from "../route-optimization";

// Store original fetch
const originalFetch = global.fetch;
const originalEnv = process.env;

describe("Route Optimization Service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("validateStopsForOptimization", () => {
    it("returns valid when all stops have coordinates", () => {
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      const result = validateStopsForOptimization(stops);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid when stops are missing coordinates", () => {
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: null,
            lng: null,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      const result = validateStopsForOptimization(stops);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe("MISSING_COORDINATES");
      expect(result.errors[0].stopId).toBe("stop-1");
    });

    it("returns multiple errors for multiple invalid stops", () => {
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: null,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: null,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      const result = validateStopsForOptimization(stops);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("optimizeRoute", () => {
    it("returns single stop without optimization", async () => {
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
      ];

      const result = await optimizeRoute(stops);

      expect(result.orderedStops).toHaveLength(1);
      expect(result.orderedStops[0].stopId).toBe("stop-1");
      expect(result.orderedStops[0].stopIndex).toBe(0);
      expect(result.method).toBe("single-stop");
      expect(result.timeWindowViolations).toHaveLength(0);
    });

    it("throws error when stops are missing coordinates", async () => {
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: null,
            lng: null,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
      ];

      await expect(optimizeRoute(stops)).rejects.toThrow("Invalid stops");
    });

    it("uses nearest-neighbor when Google API is not available", async () => {
      // Remove API key to trigger fallback
      delete process.env.GOOGLE_MAPS_API_KEY;

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
        {
          stopId: "stop-3",
          orderId: "order-3",
          address: {
            lat: 34.1478,
            lng: -118.1445,
            line1: "789 Colorado Blvd",
            city: "Pasadena",
            state: "CA",
            postalCode: "91101",
          },
        },
      ];

      const result = await optimizeRoute(stops);

      expect(result.orderedStops).toHaveLength(3);
      expect(result.totalDistanceMeters).toBeGreaterThan(0);
      expect(result.totalDurationSeconds).toBeGreaterThan(0);
      expect(result.optimizedPolyline).toBeNull();

      // Each stop should have a unique index
      const indices = result.orderedStops.map((s) => s.stopIndex);
      expect(new Set(indices).size).toBe(3);

      // Method should be nearest-neighbor
      expect(result.method).toBe("nearest-neighbor");
      expect(result.timeWindowViolations).toHaveLength(0);
    });

    it("uses Google Routes API when available", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      // Round-trip format: origin→stop1→stop2→origin (3 legs for 2 stops)
      const googleResponse = {
        routes: [
          {
            optimizedIntermediateWaypointIndex: [1, 0],
            distanceMeters: 50000, // total including return
            duration: "3600s",
            polyline: {
              encodedPolyline: "fullRoutePolyline",
            },
            legs: [
              { distanceMeters: 15000, duration: "1200s", polyline: { encodedPolyline: "leg1" } },
              { distanceMeters: 20000, duration: "1200s", polyline: { encodedPolyline: "leg2" } },
              { distanceMeters: 15000, duration: "1200s", polyline: { encodedPolyline: "leg3" } }, // return to kitchen
            ],
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(googleResponse),
      } as Response);

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      const result = await optimizeRoute(stops);

      expect(result.orderedStops).toHaveLength(2);
      // Totals exclude the return-to-kitchen leg
      expect(result.totalDistanceMeters).toBe(35000); // 15000 + 20000
      expect(result.totalDurationSeconds).toBe(2400); // 1200 + 1200
      // Polyline is semicolon-separated per-leg (excluding return)
      expect(result.optimizedPolyline).toBe("leg1;leg2");
      expect(result.method).toBe("google");
    });

    it("falls back to nearest-neighbor when Google API fails", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ error: { message: "API Error" } }),
      } as Response);

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      // Should not throw, should fall back to nearest-neighbor
      const result = await optimizeRoute(stops);

      expect(result.orderedStops).toHaveLength(2);
      expect(result.optimizedPolyline).toBeNull(); // Nearest-neighbor doesn't provide polyline
      expect(result.method).toBe("nearest-neighbor");
    });

    it("applies road factor correction in nearest-neighbor distances", async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      // Two stops at known distances from kitchen (Covina, CA ~34.09, -117.88)
      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
        },
      ];

      const result = await optimizeRoute(stops);

      // With road factor 1.3x, distances should be ~30% larger than haversine
      // Haversine LA→Santa Monica ≈ 16km, with 1.3x ≈ 21km
      // Total should be > haversine sum, confirming road factor is applied
      expect(result.totalDistanceMeters).toBeGreaterThan(40000); // > 40km total with road factor
    });
  });

  describe("optimizeRoute with time windows", () => {
    it("includes delivery windows in Google API request", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      // Round-trip: origin→stop1→stop2→origin (3 legs)
      const googleResponse = {
        routes: [
          {
            optimizedIntermediateWaypointIndex: [0, 1],
            distanceMeters: 35000,
            duration: "2700s",
            legs: [
              { distanceMeters: 10000, duration: "900s" },
              { distanceMeters: 15000, duration: "900s" },
              { distanceMeters: 10000, duration: "900s" }, // return leg
            ],
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(googleResponse),
      } as Response);

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
          deliveryWindowStart: "2024-01-15T14:00:00Z",
          deliveryWindowEnd: "2024-01-15T15:00:00Z",
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
          deliveryWindowStart: "2024-01-15T15:00:00Z",
          deliveryWindowEnd: "2024-01-15T16:00:00Z",
        },
      ];

      await optimizeRoute(stops);

      // Verify the API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("routes.googleapis.com"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Goog-Api-Key": "test-api-key",
          }),
        })
      );
    });

    it("detects time window violations in nearest-neighbor fallback", async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      // Set a very tight window that will definitely be missed
      const now = new Date();
      const pastWindow = new Date(now.getTime() - 3600 * 1000); // 1 hour ago

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
          deliveryWindowStart: new Date(pastWindow.getTime() - 3600 * 1000).toISOString(),
          deliveryWindowEnd: pastWindow.toISOString(),
        },
      ];

      const result = await optimizeRoute(stops, { departureTime: now });

      // Stop 2 has a window that ended in the past — should be flagged
      expect(result.timeWindowViolations.length).toBeGreaterThanOrEqual(1);
      const violation = result.timeWindowViolations.find((v) => v.stopId === "stop-2");
      expect(violation).toBeDefined();
      expect(violation!.minutesLate).toBeGreaterThan(0);
      expect(violation!.orderId).toBe("order-2");
    });

    it("returns no violations when all ETAs are within windows", async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      const now = new Date();
      // Set generous windows far in the future
      const futureStart = new Date(now.getTime() + 3600 * 1000);
      const futureEnd = new Date(now.getTime() + 7200 * 1000);

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0922,
            lng: -117.89,
            line1: "100 Citrus Ave",
            city: "Covina",
            state: "CA",
            postalCode: "91722",
          },
          deliveryWindowStart: futureStart.toISOString(),
          deliveryWindowEnd: futureEnd.toISOString(),
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -117.85,
            line1: "200 San Bernardino Rd",
            city: "West Covina",
            state: "CA",
            postalCode: "91790",
          },
          deliveryWindowStart: futureStart.toISOString(),
          deliveryWindowEnd: futureEnd.toISOString(),
        },
      ];

      const result = await optimizeRoute(stops, { departureTime: now });

      expect(result.timeWindowViolations).toHaveLength(0);
    });

    it("detects violations in Google API results", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      const now = new Date();
      // Window ends 5 minutes from now, but legs take 30 min total
      const tightWindowEnd = new Date(now.getTime() + 5 * 60 * 1000);

      const googleResponse = {
        routes: [
          {
            optimizedIntermediateWaypointIndex: [0, 1],
            legs: [
              { distanceMeters: 10000, duration: "900s" }, // 15 min
              { distanceMeters: 15000, duration: "900s" }, // 15 min
              { distanceMeters: 10000, duration: "900s" }, // return
            ],
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(googleResponse),
      } as Response);

      const stops: RoutableStop[] = [
        {
          stopId: "stop-1",
          orderId: "order-1",
          address: {
            lat: 34.0522,
            lng: -118.2437,
            line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90001",
          },
        },
        {
          stopId: "stop-2",
          orderId: "order-2",
          address: {
            lat: 34.0825,
            lng: -118.4107,
            line1: "456 Broadway",
            city: "Santa Monica",
            state: "CA",
            postalCode: "90401",
          },
          deliveryWindowEnd: tightWindowEnd.toISOString(),
        },
      ];

      const result = await optimizeRoute(stops, { departureTime: now });

      // stop-2 ETA = now + 30min, window ends at now + 5min → violation
      expect(result.method).toBe("google");
      expect(result.timeWindowViolations.length).toBeGreaterThanOrEqual(1);
      const violation = result.timeWindowViolations.find((v) => v.stopId === "stop-2");
      expect(violation).toBeDefined();
      expect(violation!.minutesLate).toBeGreaterThanOrEqual(20);
    });
  });
});
