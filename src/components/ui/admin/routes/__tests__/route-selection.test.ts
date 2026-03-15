import { describe, it, expect } from "vitest";
import {
  toggleStopSelection,
  selectAllStops,
  deselectAllStops,
  validateSplitSelection,
  getSelectableStops,
} from "../route-selection-utils";
import type { StopDetail } from "@/types/driver";

function makeStop(
  overrides: Partial<StopDetail> & { id: string; stopIndex: number },
): StopDetail {
  return {
    eta: null,
    status: "pending",
    arrivedAt: null,
    deliveredAt: null,
    deliveryPhotoUrl: null,
    deliveryNotes: null,
    order: {
      id: `order-${overrides.id}`,
      totalCents: 1000,
      deliveryWindowStart: null,
      deliveryWindowEnd: null,
      specialInstructions: null,
      itemCount: 2,
      customer: { id: "cust-1", fullName: "Test Customer", phone: null },
      address: {
        line1: "123 Main St",
        line2: null,
        city: "Covina",
        state: "CA",
        postalCode: "91722",
        lat: null,
        lng: null,
      },
    },
    exception: null,
    ...overrides,
  };
}

const STOPS: StopDetail[] = [
  makeStop({ id: "stop-1", stopIndex: 0, status: "pending" }),
  makeStop({ id: "stop-2", stopIndex: 1, status: "delivered" }),
  makeStop({ id: "stop-3", stopIndex: 2, status: "pending" }),
];

describe("route-selection-utils", () => {
  describe("toggleStopSelection", () => {
    it("adds stop ID when not selected", () => {
      const selected = new Set<string>();
      const result = toggleStopSelection(selected, "stop-1");
      expect(result.has("stop-1")).toBe(true);
      expect(result.size).toBe(1);
    });

    it("removes stop ID when already selected", () => {
      const selected = new Set(["stop-1", "stop-2"]);
      const result = toggleStopSelection(selected, "stop-1");
      expect(result.has("stop-1")).toBe(false);
      expect(result.has("stop-2")).toBe(true);
      expect(result.size).toBe(1);
    });

    it("does not mutate original set", () => {
      const selected = new Set(["stop-1"]);
      toggleStopSelection(selected, "stop-2");
      expect(selected.size).toBe(1);
    });
  });

  describe("selectAllStops", () => {
    it("returns all stop IDs for planned routes", () => {
      const result = selectAllStops(STOPS, "planned");
      expect(result.size).toBe(3);
      expect(result.has("stop-1")).toBe(true);
      expect(result.has("stop-2")).toBe(true);
      expect(result.has("stop-3")).toBe(true);
    });

    it("returns only pending stop IDs for in_progress routes", () => {
      const result = selectAllStops(STOPS, "in_progress");
      expect(result.size).toBe(2);
      expect(result.has("stop-1")).toBe(true);
      expect(result.has("stop-3")).toBe(true);
      expect(result.has("stop-2")).toBe(false);
    });
  });

  describe("deselectAllStops", () => {
    it("returns empty set", () => {
      const result = deselectAllStops();
      expect(result.size).toBe(0);
    });
  });

  describe("validateSplitSelection", () => {
    it("rejects when 0 selected", () => {
      const result = validateSplitSelection(new Set(), 3);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Select at least one stop");
    });

    it("rejects when all stops selected", () => {
      const result = validateSplitSelection(new Set(["a", "b", "c"]), 3);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("At least one stop must remain");
    });

    it("accepts when at least 1 remains", () => {
      const result = validateSplitSelection(new Set(["a", "b"]), 3);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts when exactly 1 selected of multiple", () => {
      const result = validateSplitSelection(new Set(["a"]), 5);
      expect(result.valid).toBe(true);
    });
  });

  describe("getSelectableStops", () => {
    it("returns all stop IDs for planned routes", () => {
      const result = getSelectableStops(STOPS, "planned");
      expect(result).toEqual(["stop-1", "stop-2", "stop-3"]);
    });

    it("returns only pending stop IDs for in_progress routes", () => {
      const result = getSelectableStops(STOPS, "in_progress");
      expect(result).toEqual(["stop-1", "stop-3"]);
    });

    it("returns all stop IDs for completed routes", () => {
      const result = getSelectableStops(STOPS, "completed");
      expect(result).toEqual(["stop-1", "stop-2", "stop-3"]);
    });
  });
});
