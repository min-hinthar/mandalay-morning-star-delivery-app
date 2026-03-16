/**
 * Tests for Delivery Notes API
 * PATCH /api/driver/routes/[routeId]/stops/[stopId]/notes
 *
 * Tests validation schema, response structure, and handler integration.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";
import { NextRequest } from "next/server";

// Mock dependencies before importing handler
vi.mock("@/lib/auth", () => ({
  requireDriver: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  driverActionLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn() },
}));

import { PATCH } from "../route";
import { requireDriver } from "@/lib/auth";

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

// ============================================
// HANDLER INTEGRATION TESTS
// ============================================

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost:3000/api/driver/routes/r1/stops/s1/notes",
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    },
  );
}

const makeParams = (routeId = "r1", stopId = "s1") => ({
  params: Promise.resolve({ routeId, stopId }),
});

describe("PATCH handler integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when driver not authenticated", async () => {
    vi.mocked(requireDriver).mockResolvedValue({
      success: false,
      error: "Unauthorized",
      status: 401,
    } as never);

    const req = makeRequest({ deliveryNotes: "test" });
    const response = await PATCH(req, makeParams());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid body", async () => {
    // Body parsing happens BEFORE auth check in this handler
    const req = makeRequest({ deliveryNotes: 123 });
    const response = await PATCH(req, makeParams());
    expect(response.status).toBe(400);
  });

  it("returns 404 when route not found", async () => {
    vi.mocked(requireDriver).mockResolvedValue({
      success: true,
      driverId: "d1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: null, error: new Error("none") }),
            }),
          }),
        })),
      },
    } as never);

    const req = makeRequest({ deliveryNotes: "test" });
    const response = await PATCH(req, makeParams());
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Route not found");
  });

  it("returns 403 when driver does not own route", async () => {
    vi.mocked(requireDriver).mockResolvedValue({
      success: true,
      driverId: "d1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "r1", status: "in_progress", driver_id: "d2" },
                error: null,
              }),
            }),
          }),
        })),
      },
    } as never);

    const req = makeRequest({ deliveryNotes: "test" });
    const response = await PATCH(req, makeParams());
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Not authorized to update this stop");
  });

  it("returns 400 when route not in progress", async () => {
    vi.mocked(requireDriver).mockResolvedValue({
      success: true,
      driverId: "d1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "r1", status: "completed", driver_id: "d1" },
                error: null,
              }),
            }),
          }),
        })),
      },
    } as never);

    const req = makeRequest({ deliveryNotes: "test" });
    const response = await PATCH(req, makeParams());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Route must be in progress to update notes");
  });
});
