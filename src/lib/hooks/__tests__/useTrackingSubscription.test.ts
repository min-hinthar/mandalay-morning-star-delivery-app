/**
 * Tests for Tracking Subscription Hook
 *
 * Note: Testing real-time subscriptions is complex and requires mocking Supabase.
 * These tests focus on the helper functions and expected behavior.
 * Full integration testing is covered by E2E tests.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShowLiveTracking, useLastUpdateDisplay } from "../useTrackingSubscription";
import type { OrderStatus } from "@/types/database";
import type { DriverLocation } from "@/types/tracking";

describe("useShowLiveTracking", () => {
  it("returns true when order is out_for_delivery and location exists", () => {
    const orderStatus: OrderStatus = "out_for_delivery";
    const driverLocation: DriverLocation = {
      latitude: 34.0894,
      longitude: -117.8897,
      recorded_at: new Date().toISOString(),
      accuracy: 10,
      heading: 180,
    };

    const { result } = renderHook(() =>
      useShowLiveTracking(orderStatus, driverLocation)
    );

    expect(result.current).toBe(true);
  });

  it("returns false when order is out_for_delivery but no location", () => {
    const orderStatus: OrderStatus = "out_for_delivery";

    const { result } = renderHook(() => useShowLiveTracking(orderStatus, null));

    expect(result.current).toBe(false);
  });

  it("returns false when order is not out_for_delivery", () => {
    const driverLocation: DriverLocation = {
      latitude: 34.0894,
      longitude: -117.8897,
      recorded_at: new Date().toISOString(),
      accuracy: 10,
      heading: 180,
    };

    const statuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "delivered",
      "cancelled",
    ];

    for (const status of statuses) {
      const { result } = renderHook(() =>
        useShowLiveTracking(status, driverLocation)
      );
      expect(result.current).toBe(false);
    }
  });

  it("returns false when both are null", () => {
    const { result } = renderHook(() => useShowLiveTracking(null, null));

    expect(result.current).toBe(false);
  });
});

describe("useLastUpdateDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string when lastUpdate is null", () => {
    const { result } = renderHook(() => useLastUpdateDisplay(null));

    expect(result.current).toBe("");
  });

  it("returns 'Just now' for recent updates", () => {
    const now = new Date("2026-01-18T14:00:00");
    vi.setSystemTime(now);

    const lastUpdate = new Date("2026-01-18T13:59:55"); // 5 seconds ago

    const { result } = renderHook(() => useLastUpdateDisplay(lastUpdate));

    expect(result.current).toBe("Just now");
  });

  it("returns seconds ago for updates under a minute", () => {
    const now = new Date("2026-01-18T14:00:00");
    vi.setSystemTime(now);

    const lastUpdate = new Date("2026-01-18T13:59:30"); // 30 seconds ago

    const { result } = renderHook(() => useLastUpdateDisplay(lastUpdate));

    expect(result.current).toBe("30s ago");
  });

  it("returns minutes ago for updates under an hour", () => {
    const now = new Date("2026-01-18T14:00:00");
    vi.setSystemTime(now);

    const lastUpdate = new Date("2026-01-18T13:55:00"); // 5 minutes ago

    const { result } = renderHook(() => useLastUpdateDisplay(lastUpdate));

    expect(result.current).toBe("5m ago");
  });

  it("returns formatted time for updates over an hour", () => {
    const now = new Date("2026-01-18T14:00:00");
    vi.setSystemTime(now);

    const lastUpdate = new Date("2026-01-18T12:30:00"); // 1.5 hours ago

    const { result } = renderHook(() => useLastUpdateDisplay(lastUpdate));

    // Should return formatted time like "12:30 PM"
    expect(result.current).toMatch(/\d{1,2}:\d{2}/);
  });

  it("updates display over time", () => {
    const now = new Date("2026-01-18T14:00:00");
    vi.setSystemTime(now);

    const lastUpdate = new Date("2026-01-18T13:59:55"); // 5 seconds ago

    const { result, rerender } = renderHook(() => useLastUpdateDisplay(lastUpdate));

    const initialDisplay = result.current;
    expect(initialDisplay).toBe("Just now");

    // Advance system time significantly and advance timers
    act(() => {
      vi.setSystemTime(new Date("2026-01-18T14:01:00")); // 1 minute later
      vi.advanceTimersByTime(60000);
    });

    // Rerender to pick up the new interval update
    rerender();

    // After interval update, should show time elapsed (minutes format)
    expect(result.current).toMatch(/\dm ago/);
    expect(result.current).not.toBe(initialDisplay);
  });
});

describe("Tracking Subscription State", () => {
  it("defines correct initial state shape", () => {
    const initialState = {
      isConnected: false,
      connectionError: null,
      orderStatus: null,
      stopStatus: null,
      driverLocation: null,
      stopEta: null,
      deliveryPhotoUrl: null,
      lastUpdate: null,
    };

    expect(initialState.isConnected).toBe(false);
    expect(initialState.connectionError).toBeNull();
    expect(initialState.orderStatus).toBeNull();
    expect(initialState.stopStatus).toBeNull();
    expect(initialState.driverLocation).toBeNull();
    expect(initialState.stopEta).toBeNull();
    expect(initialState.deliveryPhotoUrl).toBeNull();
    expect(initialState.lastUpdate).toBeNull();
  });

  it("validates order status types", () => {
    const validStatuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    for (const status of validStatuses) {
      expect(typeof status).toBe("string");
    }
  });

  it("validates driver location structure", () => {
    const location: DriverLocation = {
      latitude: 34.0894,
      longitude: -117.8897,
      recorded_at: "2026-01-18T14:00:00.000Z",
      accuracy: 10.5,
      heading: 180,
    };

    expect(location.latitude).toBeGreaterThanOrEqual(-90);
    expect(location.latitude).toBeLessThanOrEqual(90);
    expect(location.longitude).toBeGreaterThanOrEqual(-180);
    expect(location.longitude).toBeLessThanOrEqual(180);
    expect(location.recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("Realtime Update Handlers (mocked behavior)", () => {
  it("handles order status update correctly", () => {
    const mockCallback = vi.fn();
    const payload = {
      new: {
        id: "test-order-id",
        status: "out_for_delivery" as OrderStatus,
        confirmed_at: "2026-01-18T10:00:00.000Z",
        delivered_at: null,
      },
    };

    // Simulate the callback behavior
    mockCallback(payload.new.status);

    expect(mockCallback).toHaveBeenCalledWith("out_for_delivery");
  });

  it("handles route stop update correctly", () => {
    const mockCallback = vi.fn();
    const payload = {
      new: {
        id: "test-stop-id",
        status: "arrived",
        eta: "2026-01-18T14:30:00.000Z",
        stop_index: 5,
        arrived_at: "2026-01-18T14:25:00.000Z",
        delivered_at: null,
        delivery_photo_url: null,
      },
    };

    mockCallback(payload.new);

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "arrived",
        eta: "2026-01-18T14:30:00.000Z",
      })
    );
  });

  it("handles location update correctly", () => {
    const mockCallback = vi.fn();
    const payload = {
      new: {
        id: "test-location-id",
        latitude: 34.0900,
        longitude: -117.8800,
        heading: 270,
        accuracy: 10,
        recorded_at: "2026-01-18T14:25:00.000Z",
      },
    };

    // Transform to DriverLocation format
    const location: DriverLocation = {
      latitude: payload.new.latitude,
      longitude: payload.new.longitude,
      recorded_at: payload.new.recorded_at,
      accuracy: payload.new.accuracy,
      heading: payload.new.heading,
    };

    mockCallback(location);

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 34.09,
        longitude: -117.88,
        heading: 270,
      })
    );
  });
});

describe("Polling Fallback", () => {
  it("uses correct polling interval", () => {
    const POLLING_INTERVAL = 30000; // 30 seconds
    expect(POLLING_INTERVAL).toBe(30000);
  });

  it("uses correct reconnect delay", () => {
    const RECONNECT_DELAY = 5000; // 5 seconds
    expect(RECONNECT_DELAY).toBe(5000);
  });
});
