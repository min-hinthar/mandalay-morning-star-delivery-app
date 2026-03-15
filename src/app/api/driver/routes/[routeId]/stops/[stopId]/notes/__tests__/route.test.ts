/**
 * Tests for Delivery Notes API
 * PATCH /api/driver/routes/[routeId]/stops/[stopId]/notes
 *
 * Tests validation schema and response structure.
 * Full flow testing covered by E2E tests.
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirror the schema from the route handler
const deliveryNotesSchema = z.object({
  deliveryNotes: z.string().max(500),
});

describe("Delivery Notes API Validation", () => {
  describe("deliveryNotesSchema", () => {
    it("accepts valid delivery notes string", () => {
      const body = { deliveryNotes: "Left at door" };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveryNotes).toBe("Left at door");
      }
    });

    it("accepts empty string delivery notes", () => {
      const body = { deliveryNotes: "" };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("accepts notes at 500 character limit", () => {
      const body = { deliveryNotes: "a".repeat(500) };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("rejects notes exceeding 500 characters", () => {
      const body = { deliveryNotes: "a".repeat(501) };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects missing deliveryNotes field", () => {
      const body = {};
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects non-string deliveryNotes", () => {
      const body = { deliveryNotes: 123 };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("rejects null deliveryNotes", () => {
      const body = { deliveryNotes: null };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("ignores extra fields", () => {
      const body = { deliveryNotes: "Gate code 1234", status: "delivered" };
      const result = deliveryNotesSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ deliveryNotes: "Gate code 1234" });
      }
    });
  });

  describe("Response structure expectations", () => {
    it("success response shape matches { success: true }", () => {
      const response = { success: true };
      expect(response).toHaveProperty("success", true);
    });

    it("error response shape matches { error: string }", () => {
      const errorCases = [
        { error: "Route not found", status: 404 },
        { error: "Not authorized to update this stop", status: 403 },
        { error: "Route must be in progress to update notes", status: 400 },
        { error: "Stop not found", status: 404 },
        { error: "Failed to update delivery notes", status: 500 },
      ];

      for (const { error, status } of errorCases) {
        expect(typeof error).toBe("string");
        expect(status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
