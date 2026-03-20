/**
 * Tests for route validation schemas
 * Phase 80 Plan 01 - Route & Driver Assignment Foundation
 */

import { describe, it, expect } from "vitest";
import {
  reassignStopSchema,
  createRouteSchema,
  splitRouteSchema,
  mergeRouteSchema,
  VALID_ROUTE_TRANSITIONS,
  isValidRouteTransition,
  getValidRouteTransitions,
  type ReassignStopInput,
  type SplitRouteInput,
  type MergeRouteInput,
} from "../route";

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

describe("createRouteSchema (multi-day delivery)", () => {
  it("accepts valid delivery date (Saturday)", () => {
    // 2026-03-07 is a Saturday
    const input = {
      deliveryDate: "2026-03-07",
      orderIds: [VALID_UUID_1],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts valid delivery date (Wednesday)", () => {
    // 2026-03-04 is a Wednesday
    const input = {
      deliveryDate: "2026-03-04",
      orderIds: [VALID_UUID_1],
    };
    const result = createRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const input = {
      deliveryDate: "not-a-date",
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

describe("splitRouteSchema", () => {
  it("accepts valid stopIds array with UUIDs", () => {
    const input = { stopIds: [VALID_UUID_1, VALID_UUID_2] };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const data: SplitRouteInput = result.data;
      expect(data.stopIds).toEqual([VALID_UUID_1, VALID_UUID_2]);
    }
  });

  it("rejects empty stopIds array", () => {
    const input = { stopIds: [] };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("At least one stop");
    }
  });

  it("rejects non-UUID stopIds", () => {
    const input = { stopIds: ["not-a-uuid"] };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts missing driverId (optional)", () => {
    const input = { stopIds: [VALID_UUID_1] };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.driverId).toBeUndefined();
    }
  });

  it("accepts valid driverId UUID", () => {
    const input = { stopIds: [VALID_UUID_1], driverId: VALID_UUID_2 };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.driverId).toBe(VALID_UUID_2);
    }
  });

  it("rejects non-UUID driverId", () => {
    const input = { stopIds: [VALID_UUID_1], driverId: "bad" };
    const result = splitRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("mergeRouteSchema", () => {
  it("accepts valid sourceRouteId UUID", () => {
    const input = { sourceRouteId: VALID_UUID_1 };
    const result = mergeRouteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const data: MergeRouteInput = result.data;
      expect(data.sourceRouteId).toBe(VALID_UUID_1);
    }
  });

  it("rejects missing sourceRouteId", () => {
    const result = mergeRouteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID sourceRouteId", () => {
    const input = { sourceRouteId: "not-a-uuid" };
    const result = mergeRouteSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Invalid route ID");
    }
  });
});

describe("VALID_ROUTE_TRANSITIONS", () => {
  it("has exactly 5 keys matching RouteStatus values", () => {
    const keys = Object.keys(VALID_ROUTE_TRANSITIONS);
    expect(keys).toHaveLength(5);
    expect(keys).toEqual(
      expect.arrayContaining(["planned", "assigned", "accepted", "in_progress", "completed"])
    );
  });

  it("completed has empty transitions array", () => {
    expect(VALID_ROUTE_TRANSITIONS.completed).toEqual([]);
  });

  it("planned only has assigned", () => {
    expect(VALID_ROUTE_TRANSITIONS.planned).toEqual(["assigned"]);
  });

  it("assigned can go to planned or accepted", () => {
    expect(VALID_ROUTE_TRANSITIONS.assigned).toEqual(["planned", "accepted"]);
  });

  it("accepted can go to planned, assigned, or in_progress", () => {
    expect(VALID_ROUTE_TRANSITIONS.accepted).toEqual(["planned", "assigned", "in_progress"]);
  });

  it("in_progress can only go to completed", () => {
    expect(VALID_ROUTE_TRANSITIONS.in_progress).toEqual(["completed"]);
  });
});

describe("isValidRouteTransition", () => {
  // Valid transitions
  it.each([
    ["planned", "assigned"],
    ["assigned", "planned"],
    ["assigned", "accepted"],
    ["accepted", "planned"],
    ["accepted", "assigned"],
    ["accepted", "in_progress"],
    ["in_progress", "completed"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(isValidRouteTransition(from, to)).toBe(true);
  });

  // Invalid transitions
  it.each([
    ["planned", "accepted"],
    ["planned", "in_progress"],
    ["planned", "completed"],
    ["assigned", "in_progress"],
    ["assigned", "completed"],
    ["accepted", "completed"],
    ["in_progress", "planned"],
    ["in_progress", "assigned"],
    ["in_progress", "accepted"],
    ["completed", "planned"],
    ["completed", "assigned"],
    ["completed", "accepted"],
    ["completed", "in_progress"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(isValidRouteTransition(from, to)).toBe(false);
  });
});

describe("getValidRouteTransitions", () => {
  it("returns ['assigned'] for planned", () => {
    expect(getValidRouteTransitions("planned")).toEqual(["assigned"]);
  });

  it("returns ['planned', 'accepted'] for assigned", () => {
    expect(getValidRouteTransitions("assigned")).toEqual(["planned", "accepted"]);
  });

  it("returns ['planned', 'assigned', 'in_progress'] for accepted", () => {
    expect(getValidRouteTransitions("accepted")).toEqual(["planned", "assigned", "in_progress"]);
  });

  it("returns ['completed'] for in_progress", () => {
    expect(getValidRouteTransitions("in_progress")).toEqual(["completed"]);
  });

  it("returns [] for completed", () => {
    expect(getValidRouteTransitions("completed")).toEqual([]);
  });
});
