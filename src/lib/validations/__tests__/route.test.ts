/**
 * Tests for route validation schemas
 * Phase 80 Plan 01 - Route & Driver Assignment Foundation
 */

import { describe, it, expect } from "vitest";
import { reassignStopSchema, createRouteSchema, type ReassignStopInput } from "../route";

const VALID_UUID_1 = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("reassignStopSchema", () => {
  it("accepts valid UUIDs for both fields", () => {
    const input = { stopId: VALID_UUID_1, targetRouteId: VALID_UUID_2 };
    const result = reassignStopSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const data: ReassignStopInput = result.data;
      expect(data.stopId).toBe(VALID_UUID_1);
      expect(data.targetRouteId).toBe(VALID_UUID_2);
    }
  });

  it("rejects invalid stopId (not a UUID)", () => {
    const input = { stopId: "bad-id", targetRouteId: VALID_UUID_2 };
    const result = reassignStopSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid targetRouteId (not a UUID)", () => {
    const input = { stopId: VALID_UUID_1, targetRouteId: "not-a-uuid" };
    const result = reassignStopSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing stopId", () => {
    const input = { targetRouteId: VALID_UUID_2 };
    const result = reassignStopSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing targetRouteId", () => {
    const input = { stopId: VALID_UUID_1 };
    const result = reassignStopSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = reassignStopSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createRouteSchema (existing coverage confirmation)", () => {
  it("accepts valid Saturday delivery date", () => {
    // 2026-03-07 is a Saturday
    const input = {
      deliveryDate: "2026-03-07",
      orderIds: [VALID_UUID_1],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects non-Saturday delivery date", () => {
    // 2026-03-06 is a Friday
    const input = {
      deliveryDate: "2026-03-06",
      orderIds: [VALID_UUID_1],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty orderIds array", () => {
    const input = {
      deliveryDate: "2026-03-07",
      orderIds: [],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts optional driverId", () => {
    const input = {
      deliveryDate: "2026-03-07",
      driverId: VALID_UUID_1,
      orderIds: [VALID_UUID_2],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
