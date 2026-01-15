import { describe, it, expect } from "vitest";
import {
  updateStopStatusSchema,
  locationUpdateSchema,
  reportExceptionSchema,
  completeRouteSchema,
  VALID_STOP_TRANSITIONS,
  isValidStatusTransition,
} from "../driver-api";

describe("Driver API Validation Schemas", () => {
  describe("updateStopStatusSchema", () => {
    it("should accept valid status updates", () => {
      const validStatuses = ["enroute", "arrived", "delivered", "skipped"];

      for (const status of validStatuses) {
        const result = updateStopStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status values", () => {
      const invalidStatuses = ["pending", "cancelled", "invalid", ""];

      for (const status of invalidStatuses) {
        const result = updateStopStatusSchema.safeParse({ status });
        expect(result.success).toBe(false);
      }
    });

    it("should accept optional delivery notes", () => {
      const result = updateStopStatusSchema.safeParse({
        status: "delivered",
        deliveryNotes: "Left at front door",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveryNotes).toBe("Left at front door");
      }
    });

    it("should reject delivery notes exceeding 500 characters", () => {
      const longNote = "x".repeat(501);
      const result = updateStopStatusSchema.safeParse({
        status: "delivered",
        deliveryNotes: longNote,
      });
      expect(result.success).toBe(false);
    });

    it("should accept delivery notes exactly 500 characters", () => {
      const maxNote = "x".repeat(500);
      const result = updateStopStatusSchema.safeParse({
        status: "delivered",
        deliveryNotes: maxNote,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("locationUpdateSchema", () => {
    it("should accept valid location data", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should accept location with optional fields", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 10,
        heading: 90,
        speed: 15.5,
        routeId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject latitude out of range", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 91, // Max is 90
        longitude: -118.2437,
        accuracy: 10,
      });
      expect(result.success).toBe(false);
    });

    it("should reject longitude out of range", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 34.0522,
        longitude: -181, // Min is -180
        accuracy: 10,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative accuracy", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: -5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid routeId format", () => {
      const result = locationUpdateSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 10,
        routeId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("reportExceptionSchema", () => {
    const validExceptionTypes = [
      "customer_not_home",
      "wrong_address",
      "access_issue",
      "refused_delivery",
      "damaged_order",
      "other",
    ];

    it("should accept all valid exception types", () => {
      for (const type of validExceptionTypes) {
        const result = reportExceptionSchema.safeParse({ type });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid exception types", () => {
      const result = reportExceptionSchema.safeParse({
        type: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional description", () => {
      const result = reportExceptionSchema.safeParse({
        type: "customer_not_home",
        description: "Called customer twice, no answer",
      });
      expect(result.success).toBe(true);
    });

    it("should reject description exceeding 1000 characters", () => {
      const longDescription = "x".repeat(1001);
      const result = reportExceptionSchema.safeParse({
        type: "other",
        description: longDescription,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("completeRouteSchema", () => {
    it("should accept empty object", () => {
      const result = completeRouteSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept optional notes", () => {
      const result = completeRouteSchema.safeParse({
        notes: "All deliveries completed successfully",
      });
      expect(result.success).toBe(true);
    });

    it("should reject notes exceeding 1000 characters", () => {
      const longNotes = "x".repeat(1001);
      const result = completeRouteSchema.safeParse({
        notes: longNotes,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("VALID_STOP_TRANSITIONS", () => {
    it("should define valid transitions for pending status", () => {
      expect(VALID_STOP_TRANSITIONS["pending"]).toContain("enroute");
      expect(VALID_STOP_TRANSITIONS["pending"]).toContain("skipped");
    });

    it("should define valid transitions for enroute status", () => {
      expect(VALID_STOP_TRANSITIONS["enroute"]).toContain("arrived");
      expect(VALID_STOP_TRANSITIONS["enroute"]).toContain("skipped");
    });

    it("should define valid transitions for arrived status", () => {
      expect(VALID_STOP_TRANSITIONS["arrived"]).toContain("delivered");
      expect(VALID_STOP_TRANSITIONS["arrived"]).toContain("skipped");
    });

    it("should have no transitions for delivered status", () => {
      expect(VALID_STOP_TRANSITIONS["delivered"]).toHaveLength(0);
    });

    it("should have no transitions for skipped status", () => {
      expect(VALID_STOP_TRANSITIONS["skipped"]).toHaveLength(0);
    });
  });

  describe("isValidStatusTransition", () => {
    it("should return true for valid transitions", () => {
      expect(isValidStatusTransition("pending", "enroute")).toBe(true);
      expect(isValidStatusTransition("pending", "skipped")).toBe(true);
      expect(isValidStatusTransition("enroute", "arrived")).toBe(true);
      expect(isValidStatusTransition("arrived", "delivered")).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      expect(isValidStatusTransition("pending", "delivered")).toBe(false);
      expect(isValidStatusTransition("delivered", "pending")).toBe(false);
      expect(isValidStatusTransition("skipped", "delivered")).toBe(false);
      expect(isValidStatusTransition("enroute", "pending")).toBe(false);
    });

    it("should return false for same status transitions", () => {
      expect(isValidStatusTransition("pending", "pending")).toBe(false);
      expect(isValidStatusTransition("delivered", "delivered")).toBe(false);
    });
  });
});
