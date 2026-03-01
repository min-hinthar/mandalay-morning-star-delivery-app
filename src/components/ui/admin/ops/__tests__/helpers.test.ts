import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  computeStatusCounts,
  deriveDriverReadiness,
  groupByTimeWindow,
  getNextSaturday,
  getDeliveryStart,
  BULK_TRANSITIONS,
  type OpsOrder,
} from "../helpers";

// ============================================
// computeStatusCounts
// ============================================

describe("computeStatusCounts", () => {
  it("counts orders by status", () => {
    const orders: OpsOrder[] = [
      mockOrder({ status: "pending" }),
      mockOrder({ status: "pending" }),
      mockOrder({ status: "confirmed" }),
    ];
    const counts = computeStatusCounts(orders);
    expect(counts).toEqual({
      pending: 2,
      confirmed: 1,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    });
  });

  it("returns all zeros for empty array", () => {
    const counts = computeStatusCounts([]);
    expect(counts).toEqual({
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    });
  });

  it("counts all statuses correctly", () => {
    const orders: OpsOrder[] = [
      mockOrder({ status: "pending" }),
      mockOrder({ status: "confirmed" }),
      mockOrder({ status: "preparing" }),
      mockOrder({ status: "out_for_delivery" }),
      mockOrder({ status: "delivered" }),
      mockOrder({ status: "cancelled" }),
    ];
    const counts = computeStatusCounts(orders);
    expect(counts).toEqual({
      pending: 1,
      confirmed: 1,
      preparing: 1,
      out_for_delivery: 1,
      delivered: 1,
      cancelled: 1,
    });
  });
});

// ============================================
// BULK_TRANSITIONS
// ============================================

describe("BULK_TRANSITIONS", () => {
  it("maps pending to confirmed", () => {
    expect(BULK_TRANSITIONS.pending).toBe("confirmed");
  });

  it("maps confirmed to preparing", () => {
    expect(BULK_TRANSITIONS.confirmed).toBe("preparing");
  });

  it("maps preparing to out_for_delivery", () => {
    expect(BULK_TRANSITIONS.preparing).toBe("out_for_delivery");
  });

  it("maps out_for_delivery to null (terminal)", () => {
    expect(BULK_TRANSITIONS.out_for_delivery).toBeNull();
  });

  it("maps delivered to null (terminal)", () => {
    expect(BULK_TRANSITIONS.delivered).toBeNull();
  });

  it("maps cancelled to null (terminal)", () => {
    expect(BULK_TRANSITIONS.cancelled).toBeNull();
  });
});

// ============================================
// deriveDriverReadiness
// ============================================

describe("deriveDriverReadiness", () => {
  it("returns available for active driver with matching day", () => {
    const driver = mockDriver({
      isActive: true,
      availability: { available_days: ["saturday"], blocked_dates: [] },
    });
    // Saturday date
    const saturday = new Date(2026, 2, 7); // March 7, 2026 is Saturday
    const result = deriveDriverReadiness(driver, saturday);
    expect(result.isAvailable).toBe(true);
    expect(result.unavailableReason).toBeNull();
  });

  it("returns unavailable when day not in available_days", () => {
    const driver = mockDriver({
      isActive: true,
      availability: { available_days: ["sunday"], blocked_dates: [] },
    });
    const saturday = new Date(2026, 2, 7);
    const result = deriveDriverReadiness(driver, saturday);
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toBe("Not available on Saturdays");
  });

  it("returns unavailable when date is blocked", () => {
    const driver = mockDriver({
      isActive: true,
      availability: { available_days: ["saturday"], blocked_dates: ["2026-03-07"] },
    });
    const saturday = new Date(2026, 2, 7);
    const result = deriveDriverReadiness(driver, saturday);
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toBe("Blocked for 2026-03-07");
  });

  it("returns unavailable for inactive driver", () => {
    const driver = mockDriver({
      isActive: false,
      availability: { available_days: ["saturday"], blocked_dates: [] },
    });
    const saturday = new Date(2026, 2, 7);
    const result = deriveDriverReadiness(driver, saturday);
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toBe("Inactive");
  });

  it("returns unavailable for null availability", () => {
    const driver = mockDriver({ isActive: true, availability: null });
    const saturday = new Date(2026, 2, 7);
    const result = deriveDriverReadiness(driver, saturday);
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toBe("No availability set");
  });
});

// ============================================
// groupByTimeWindow
// ============================================

describe("groupByTimeWindow", () => {
  it("groups orders by delivery_window_start", () => {
    const orders: OpsOrder[] = [
      mockOrder({ deliveryWindowStart: "2026-03-07T11:00:00Z" }),
      mockOrder({ deliveryWindowStart: "2026-03-07T11:00:00Z" }),
      mockOrder({ deliveryWindowStart: "2026-03-07T13:00:00Z" }),
    ];
    const grouped = groupByTimeWindow(orders);
    expect(grouped.size).toBe(2);
    expect(grouped.get("2026-03-07T11:00:00Z")?.length).toBe(2);
    expect(grouped.get("2026-03-07T13:00:00Z")?.length).toBe(1);
  });

  it("groups null windows under Unscheduled", () => {
    const orders: OpsOrder[] = [
      mockOrder({ deliveryWindowStart: null }),
      mockOrder({ deliveryWindowStart: "2026-03-07T11:00:00Z" }),
    ];
    const grouped = groupByTimeWindow(orders);
    expect(grouped.get("Unscheduled")?.length).toBe(1);
    expect(grouped.get("2026-03-07T11:00:00Z")?.length).toBe(1);
  });

  it("returns empty map for empty array", () => {
    const grouped = groupByTimeWindow([]);
    expect(grouped.size).toBe(0);
  });
});

// ============================================
// getNextSaturday
// ============================================

describe("getNextSaturday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns next cutoff day from a Wednesday", () => {
    // Wednesday March 4, 2026 at 10:00
    vi.setSystemTime(new Date(2026, 2, 4, 10, 0, 0));
    const result = getNextSaturday(5, 15); // Friday 3PM
    expect(result.getDay()).toBe(5); // Friday
    expect(result.getHours()).toBe(15);
    // Should be March 6 (the upcoming Friday)
    expect(result.getDate()).toBe(6);
  });

  it("returns next week if cutoff has passed", () => {
    // Friday March 6, 2026 at 16:00 (after 3PM cutoff)
    vi.setSystemTime(new Date(2026, 2, 6, 16, 0, 0));
    const result = getNextSaturday(5, 15);
    expect(result.getDay()).toBe(5);
    expect(result.getHours()).toBe(15);
    // Should be March 13 (next Friday)
    expect(result.getDate()).toBe(13);
  });

  it("returns same day if cutoff not yet reached", () => {
    // Friday March 6, 2026 at 10:00 (before 3PM cutoff)
    vi.setSystemTime(new Date(2026, 2, 6, 10, 0, 0));
    const result = getNextSaturday(5, 15);
    expect(result.getDay()).toBe(5);
    expect(result.getDate()).toBe(6);
  });
});

// ============================================
// getDeliveryStart
// ============================================

describe("getDeliveryStart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns next Saturday at deliveryStartHour", () => {
    // Wednesday March 4, 2026
    vi.setSystemTime(new Date(2026, 2, 4, 10, 0, 0));
    const result = getDeliveryStart(11);
    expect(result.getDay()).toBe(6); // Saturday
    expect(result.getHours()).toBe(11);
    expect(result.getDate()).toBe(7); // March 7
  });
});

// ============================================
// Helpers
// ============================================

let orderCounter = 0;

function mockOrder(overrides: Partial<OpsOrder> = {}): OpsOrder {
  orderCounter++;
  return {
    id: `order-${orderCounter}`,
    status: "pending",
    refundStatus: "none",
    totalCents: 5000,
    deliveryWindowStart: "2026-03-07T11:00:00Z",
    placedAt: "2026-03-01T10:00:00Z",
    itemCount: 2,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    isAssigned: false,
    ...overrides,
  };
}

interface MockDriverInput {
  isActive?: boolean;
  availability?: { available_days: string[]; blocked_dates: string[] } | null;
}

function mockDriver(overrides: MockDriverInput = {}) {
  return {
    id: "driver-1",
    fullName: "Test Driver",
    vehicleType: "car" as const,
    ratingAvg: 4.5,
    isActive: overrides.isActive ?? true,
    availability: overrides.availability ?? { available_days: ["saturday"], blocked_dates: [] },
  };
}
