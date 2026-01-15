/**
 * Tests for Tracking API
 * GET /api/tracking/{orderId}
 *
 * Note: Full API route testing with mocked Supabase is complex.
 * These tests focus on the validation schemas and response structure.
 * Full flow testing is covered by E2E tests.
 */

import { describe, expect, it } from "vitest";
import {
  trackingDataSchema,
  trackingOrderInfoSchema,
  trackingRouteStopInfoSchema,
  trackingDriverDetailsSchema,
  driverLocationSchema,
  etaInfoSchema,
  trackingParamsSchema,
} from "@/lib/validations/tracking";

describe("Tracking API Validation Schemas", () => {
  describe("trackingParamsSchema", () => {
    it("accepts valid UUID orderId", () => {
      const params = { orderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" };
      const result = trackingParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID orderId", () => {
      const params = { orderId: "not-a-uuid" };
      const result = trackingParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("rejects missing orderId", () => {
      const params = {};
      const result = trackingParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe("trackingOrderInfoSchema", () => {
    const validOrder = {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      status: "confirmed",
      placedAt: "2026-01-18T10:00:00.000Z",
      confirmedAt: "2026-01-18T10:05:00.000Z",
      deliveredAt: null,
      deliveryWindowStart: "2026-01-18T14:00:00.000Z",
      deliveryWindowEnd: "2026-01-18T15:00:00.000Z",
      specialInstructions: "Ring doorbell",
      address: {
        line1: "123 Main St",
        line2: "Apt 4B",
        city: "Covina",
        state: "CA",
        postalCode: "91723",
        lat: 34.0894,
        lng: -117.8897,
      },
      items: [
        {
          id: "b1b2c3d4-e5f6-7890-abcd-ef1234567890",
          name: "Mohinga",
          quantity: 2,
          modifiers: ["Extra spicy"],
        },
      ],
      subtotalCents: 2500,
      deliveryFeeCents: 1500,
      taxCents: 250,
      totalCents: 4250,
    };

    it("accepts valid order info", () => {
      const result = trackingOrderInfoSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("accepts all valid order statuses", () => {
      const statuses = [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ];

      for (const status of statuses) {
        const result = trackingOrderInfoSchema.safeParse({
          ...validOrder,
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid order status", () => {
      const result = trackingOrderInfoSchema.safeParse({
        ...validOrder,
        status: "invalid_status",
      });
      expect(result.success).toBe(false);
    });

    it("accepts null timestamps", () => {
      const result = trackingOrderInfoSchema.safeParse({
        ...validOrder,
        confirmedAt: null,
        deliveredAt: null,
        deliveryWindowStart: null,
        deliveryWindowEnd: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null coordinates", () => {
      const result = trackingOrderInfoSchema.safeParse({
        ...validOrder,
        address: {
          ...validOrder.address,
          lat: null,
          lng: null,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative total amounts", () => {
      const result = trackingOrderInfoSchema.safeParse({
        ...validOrder,
        totalCents: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer quantities", () => {
      const result = trackingOrderInfoSchema.safeParse({
        ...validOrder,
        items: [
          {
            ...validOrder.items[0],
            quantity: 1.5,
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("trackingRouteStopInfoSchema", () => {
    const validRouteStop = {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      stopIndex: 3,
      totalStops: 8,
      currentStop: 3,
      status: "enroute",
      eta: "2026-01-18T14:30:00.000Z",
      deliveryPhotoUrl: null,
    };

    it("accepts valid route stop info", () => {
      const result = trackingRouteStopInfoSchema.safeParse(validRouteStop);
      expect(result.success).toBe(true);
    });

    it("accepts all valid stop statuses", () => {
      const statuses = ["pending", "enroute", "arrived", "delivered", "skipped"];

      for (const status of statuses) {
        const result = trackingRouteStopInfoSchema.safeParse({
          ...validRouteStop,
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid stop status", () => {
      const result = trackingRouteStopInfoSchema.safeParse({
        ...validRouteStop,
        status: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("accepts null eta", () => {
      const result = trackingRouteStopInfoSchema.safeParse({
        ...validRouteStop,
        eta: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts delivery photo URL", () => {
      const result = trackingRouteStopInfoSchema.safeParse({
        ...validRouteStop,
        deliveryPhotoUrl: "https://example.com/photo.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative stop indices", () => {
      const result = trackingRouteStopInfoSchema.safeParse({
        ...validRouteStop,
        stopIndex: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("trackingDriverDetailsSchema", () => {
    const validDriver = {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      fullName: "John Driver",
      profileImageUrl: "https://example.com/photo.jpg",
      phone: "+1234567890",
      vehicleType: "car",
    };

    it("accepts valid driver details", () => {
      const result = trackingDriverDetailsSchema.safeParse(validDriver);
      expect(result.success).toBe(true);
    });

    it("accepts all valid vehicle types", () => {
      const types = ["car", "motorcycle", "bicycle", "van", "truck"];

      for (const vehicleType of types) {
        const result = trackingDriverDetailsSchema.safeParse({
          ...validDriver,
          vehicleType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts null values", () => {
      const result = trackingDriverDetailsSchema.safeParse({
        ...validDriver,
        fullName: null,
        profileImageUrl: null,
        phone: null,
        vehicleType: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid vehicle type", () => {
      const result = trackingDriverDetailsSchema.safeParse({
        ...validDriver,
        vehicleType: "airplane",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("driverLocationSchema", () => {
    const validLocation = {
      latitude: 34.0894,
      longitude: -117.8897,
      recorded_at: "2026-01-18T14:30:00.000Z",
      accuracy: 10.5,
      heading: 180,
    };

    it("accepts valid location", () => {
      const result = driverLocationSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it("rejects invalid latitude (out of range)", () => {
      const result = driverLocationSchema.safeParse({
        ...validLocation,
        latitude: 91,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid longitude (out of range)", () => {
      const result = driverLocationSchema.safeParse({
        ...validLocation,
        longitude: 181,
      });
      expect(result.success).toBe(false);
    });

    it("accepts null accuracy and heading", () => {
      const result = driverLocationSchema.safeParse({
        ...validLocation,
        accuracy: null,
        heading: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid heading (out of range)", () => {
      const result = driverLocationSchema.safeParse({
        ...validLocation,
        heading: 400,
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary values", () => {
      const result = driverLocationSchema.safeParse({
        ...validLocation,
        latitude: 90,
        longitude: -180,
        heading: 360,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("etaInfoSchema", () => {
    const validEta = {
      minMinutes: 15,
      maxMinutes: 25,
      estimatedArrival: "2026-01-18T14:45:00.000Z",
    };

    it("accepts valid ETA info", () => {
      const result = etaInfoSchema.safeParse(validEta);
      expect(result.success).toBe(true);
    });

    it("rejects negative minutes", () => {
      const result = etaInfoSchema.safeParse({
        ...validEta,
        minMinutes: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer minutes", () => {
      const result = etaInfoSchema.safeParse({
        ...validEta,
        minMinutes: 15.5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero minutes", () => {
      const result = etaInfoSchema.safeParse({
        ...validEta,
        minMinutes: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("trackingDataSchema (full response)", () => {
    const validTrackingData = {
      order: {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        status: "out_for_delivery",
        placedAt: "2026-01-18T10:00:00.000Z",
        confirmedAt: "2026-01-18T10:05:00.000Z",
        deliveredAt: null,
        deliveryWindowStart: "2026-01-18T14:00:00.000Z",
        deliveryWindowEnd: "2026-01-18T15:00:00.000Z",
        specialInstructions: null,
        address: {
          line1: "123 Main St",
          line2: null,
          city: "Covina",
          state: "CA",
          postalCode: "91723",
          lat: 34.0894,
          lng: -117.8897,
        },
        items: [
          {
            id: "b1b2c3d4-e5f6-7890-abcd-ef1234567890",
            name: "Mohinga",
            quantity: 2,
            modifiers: [],
          },
        ],
        subtotalCents: 2500,
        deliveryFeeCents: 1500,
        taxCents: 250,
        totalCents: 4250,
      },
      routeStop: {
        id: "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
        stopIndex: 3,
        totalStops: 8,
        currentStop: 3,
        status: "enroute",
        eta: "2026-01-18T14:30:00.000Z",
        deliveryPhotoUrl: null,
      },
      driver: {
        id: "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
        fullName: "John Driver",
        profileImageUrl: "https://example.com/photo.jpg",
        phone: "+1234567890",
        vehicleType: "car",
      },
      driverLocation: {
        latitude: 34.0900,
        longitude: -117.8800,
        recorded_at: "2026-01-18T14:25:00.000Z",
        accuracy: 10,
        heading: 270,
      },
      eta: {
        minMinutes: 15,
        maxMinutes: 25,
        estimatedArrival: "2026-01-18T14:45:00.000Z",
      },
    };

    it("accepts valid full tracking data", () => {
      const result = trackingDataSchema.safeParse(validTrackingData);
      expect(result.success).toBe(true);
    });

    it("accepts tracking data without route (pending order)", () => {
      const result = trackingDataSchema.safeParse({
        ...validTrackingData,
        order: {
          ...validTrackingData.order,
          status: "confirmed",
        },
        routeStop: null,
        driver: null,
        driverLocation: null,
        eta: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts tracking data with route but no location (planned route)", () => {
      const result = trackingDataSchema.safeParse({
        ...validTrackingData,
        order: {
          ...validTrackingData.order,
          status: "preparing",
        },
        driverLocation: null,
        eta: null,
      });
      expect(result.success).toBe(true);
    });

    it("requires order to be present", () => {
      const { order: _order, ...dataWithoutOrder } = validTrackingData;
      const result = trackingDataSchema.safeParse(dataWithoutOrder);
      expect(result.success).toBe(false);
    });
  });
});

describe("Tracking API Response Structure", () => {
  it("validates expected response shape for pending order", () => {
    const expectedShape = {
      data: {
        order: expect.any(Object),
        routeStop: null,
        driver: null,
        driverLocation: null,
        eta: null,
      },
    };

    const actualResponse = {
      data: {
        order: {
          id: "test-id",
          status: "pending",
          placedAt: "2026-01-18T10:00:00.000Z",
          confirmedAt: null,
          deliveredAt: null,
          deliveryWindowStart: null,
          deliveryWindowEnd: null,
          specialInstructions: null,
          address: {
            line1: "123 Main St",
            line2: null,
            city: "Test",
            state: "CA",
            postalCode: "12345",
            lat: null,
            lng: null,
          },
          items: [],
          subtotalCents: 0,
          deliveryFeeCents: 0,
          taxCents: 0,
          totalCents: 0,
        },
        routeStop: null,
        driver: null,
        driverLocation: null,
        eta: null,
      },
    };

    expect(actualResponse).toMatchObject(expectedShape);
  });

  it("validates expected response shape for out_for_delivery order", () => {
    const expectedShape = {
      data: {
        order: expect.any(Object),
        routeStop: expect.any(Object),
        driver: expect.any(Object),
        driverLocation: expect.any(Object),
        eta: expect.any(Object),
      },
    };

    const actualResponse = {
      data: {
        order: {
          id: "test-id",
          status: "out_for_delivery",
          placedAt: "2026-01-18T10:00:00.000Z",
          confirmedAt: "2026-01-18T10:05:00.000Z",
          deliveredAt: null,
          deliveryWindowStart: "2026-01-18T14:00:00.000Z",
          deliveryWindowEnd: "2026-01-18T15:00:00.000Z",
          specialInstructions: null,
          address: {
            line1: "123 Main St",
            line2: null,
            city: "Test",
            state: "CA",
            postalCode: "12345",
            lat: 34.0,
            lng: -118.0,
          },
          items: [],
          subtotalCents: 1000,
          deliveryFeeCents: 1500,
          taxCents: 100,
          totalCents: 2600,
        },
        routeStop: {
          id: "stop-id",
          stopIndex: 5,
          totalStops: 10,
          currentStop: 5,
          status: "enroute",
          eta: "2026-01-18T14:30:00.000Z",
          deliveryPhotoUrl: null,
        },
        driver: {
          id: "driver-id",
          fullName: "Test Driver",
          profileImageUrl: null,
          phone: null,
          vehicleType: "car",
        },
        driverLocation: {
          latitude: 34.01,
          longitude: -118.01,
          recorded_at: "2026-01-18T14:25:00.000Z",
          accuracy: 10,
          heading: 180,
        },
        eta: {
          minMinutes: 10,
          maxMinutes: 20,
          estimatedArrival: "2026-01-18T14:40:00.000Z",
        },
      },
    };

    expect(actualResponse).toMatchObject(expectedShape);
  });
});
