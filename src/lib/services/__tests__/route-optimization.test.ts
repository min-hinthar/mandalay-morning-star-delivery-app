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
    });

    it("uses Google Routes API when available", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      const googleResponse = {
        routes: [
          {
            optimizedIntermediateWaypointIndex: [1, 0],
            distanceMeters: 35000,
            duration: "2400s",
            polyline: {
              encodedPolyline: "encodedPolylineString",
            },
            legs: [
              { distanceMeters: 15000, duration: "1200s" },
              { distanceMeters: 20000, duration: "1200s" },
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
      expect(result.totalDistanceMeters).toBe(35000);
      expect(result.totalDurationSeconds).toBe(2400);
      expect(result.optimizedPolyline).toBe("encodedPolylineString");
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
    });
  });

  describe("optimizeRoute with time windows", () => {
    it("includes delivery windows in Google API request", async () => {
      process.env.GOOGLE_MAPS_API_KEY = "test-api-key";

      const googleResponse = {
        routes: [
          {
            optimizedIntermediateWaypointIndex: [0, 1],
            distanceMeters: 25000,
            duration: "1800s",
            legs: [
              { distanceMeters: 10000, duration: "900s" },
              { distanceMeters: 15000, duration: "900s" },
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
  });
});
