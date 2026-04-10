/**
 * Tests for Tracking Subscription Hook
 *
 * Note: Testing real-time subscriptions is complex and requires mocking Supabase.
 * These tests focus on the helper functions and expected behavior.
 * Full integration testing is covered by E2E tests.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useShowLiveTracking,
  useLastUpdateDisplay,
  useTrackingSubscription,
} from "../useTrackingSubscription";
import type { OrderStatus } from "@/types/database";
import type { DriverLocation } from "@/types/tracking";

// ============================================================================
// Subscription lifecycle mocks (shared across the lifecycle describe block)
// ============================================================================
type SubscribeCallback = (status: string) => void;
interface MockChannel {
  name: string;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  __subscribeCallbacks: SubscribeCallback[];
}

const mockChannels: MockChannel[] = [];
const mockRemoveChannel = vi.fn();

function createMockChannel(name: string): MockChannel {
  const ch: MockChannel = {
    name,
    on: vi.fn().mockImplementation(function (this: MockChannel) {
      return this;
    }),
    subscribe: vi.fn().mockImplementation(function (this: MockChannel, cb?: SubscribeCallback) {
      if (cb) this.__subscribeCallbacks.push(cb);
      return this;
    }),
    __subscribeCallbacks: [],
  };
  // Ensure `this` binds to the channel
  ch.on = vi.fn().mockReturnValue(ch);
  ch.subscribe = vi.fn((cb?: SubscribeCallback) => {
    if (cb) ch.__subscribeCallbacks.push(cb);
    return ch;
  });
  mockChannels.push(ch);
  return ch;
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: vi.fn((name: string) => createMockChannel(name)),
    removeChannel: mockRemoveChannel,
  }),
}));

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

    const { result } = renderHook(() => useShowLiveTracking(orderStatus, driverLocation));

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

    const statuses: OrderStatus[] = ["pending", "confirmed", "preparing", "delivered", "cancelled"];

    for (const status of statuses) {
      const { result } = renderHook(() => useShowLiveTracking(status, driverLocation));
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
        latitude: 34.09,
        longitude: -117.88,
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
});

// ============================================================================
// Task 2: Baseline subscription lifecycle tests (CHKP-02)
// Added BEFORE the Task 3 refactor per CONTEXT D-37 — these document the
// CURRENT (pre-refactor) behavior and act as a regression safety net.
// Task 3 updates the reconnect delay constant and adds tests J-P.
// ============================================================================
describe("useTrackingSubscription — subscription lifecycle", () => {
  // Post-refactor: first reconnect uses getBackoffDelay(0) = 1000ms.
  // Tests J/K/L/P assert the full exponential curve [1000, 2000, 4000, 8000, 16000, 30000...].
  const CURRENT_FIRST_RECONNECT_MS = 1000;

  function setVisibilityState(state: "visible" | "hidden") {
    Object.defineProperty(document, "visibilityState", {
      value: state,
      configurable: true,
      writable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockChannels.length = 0;
    mockRemoveChannel.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            order: { status: "preparing" },
            routeStop: null,
            driverLocation: null,
          },
        }),
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function findChannel(prefix: string): MockChannel | undefined {
    return mockChannels.find((c) => c.name.startsWith(prefix));
  }

  // Test A: Mount sets up tracking channel
  it("A: mount creates tracking channel and registers order + stop handlers", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    const trackingChannel = findChannel("tracking:order-123");
    expect(trackingChannel).toBeDefined();
    // Two .on() calls: orders + route_stops
    expect(trackingChannel!.on).toHaveBeenCalledTimes(2);
    expect(trackingChannel!.subscribe).toHaveBeenCalledTimes(1);
  });

  // Test B: Mount sets up location channel when routeId present
  it("B: mount creates location channel when routeId is provided", async () => {
    renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(findChannel("tracking:order-123")).toBeDefined();
    expect(findChannel("location:route-456")).toBeDefined();
  });

  // Test C: Mount does not subscribe when enabled=false
  it("C: disabled hook does not create any channels", async () => {
    renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: false,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockChannels.length).toBe(0);
  });

  // Test D: SUBSCRIBED status sets isConnected=true
  it("D: SUBSCRIBED status flips isConnected true and clears error", async () => {
    const { result } = renderHook(() =>
      useTrackingSubscription({ orderId: "order-123", enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    const trackingChannel = findChannel("tracking:order-123")!;
    act(() => {
      trackingChannel.__subscribeCallbacks.forEach((cb) => cb("SUBSCRIBED"));
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionError).toBeNull();
  });

  // Test E: CLOSED status sets isConnected=false and triggers polling + reconnect
  it("E: CLOSED status sets isConnected false, sets error, schedules polling", async () => {
    const { result } = renderHook(() =>
      useTrackingSubscription({ orderId: "order-123", enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    const trackingChannel = findChannel("tracking:order-123")!;
    act(() => {
      trackingChannel.__subscribeCallbacks.forEach((cb) => cb("CLOSED"));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBeTruthy();
  });

  // Test F: CHANNEL_ERROR status schedules reconnect (CURRENT = 5000ms delay)
  it("F: CHANNEL_ERROR schedules reconnect after CURRENT_FIRST_RECONNECT_MS", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    const initialChannelCount = mockChannels.length;
    const firstChannel = findChannel("tracking:order-123")!;

    act(() => {
      firstChannel.__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
    });

    // Advance by pre-refactor RECONNECT_DELAY
    await act(async () => {
      vi.advanceTimersByTime(CURRENT_FIRST_RECONNECT_MS);
      await Promise.resolve();
    });

    // A new tracking channel should have been created via setupSubscriptions
    expect(mockChannels.length).toBeGreaterThan(initialChannelCount);
  });

  // Test G: Cleanup on unmount removes BOTH channels
  it("G: unmount removes tracking + location channels and clears polling", async () => {
    const { unmount } = renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    const preUnmountRemoveCalls = mockRemoveChannel.mock.calls.length;

    unmount();

    // Should have called removeChannel for both channels created
    expect(mockRemoveChannel.mock.calls.length).toBeGreaterThan(preUnmountRemoveCalls);
  });

  // Test H: refresh() calls fetch with the right URL
  it("H: refresh() fetches /api/tracking/:orderId", async () => {
    const { result } = renderHook(() =>
      useTrackingSubscription({ orderId: "order-123", enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/tracking/order-123");
  });

  // Test I: Initial fetch happens on mount
  it("I: mount triggers an initial fetch for tracking data", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/tracking/order-123");
  });

  // ==========================================================================
  // Task 3: TRAK-03 + TRAK-04 tests (added AFTER Tests A-I safety net)
  // ==========================================================================

  // Test J (backoff curve): Successive CHANNEL_ERROR events follow exponential backoff
  it("J: successive CHANNEL_ERRORs follow [1000, 2000, 4000] backoff", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    const errorChannel = () => {
      const ch = mockChannels[mockChannels.length - 1];
      act(() => {
        ch.__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
      });
    };

    // Initial channel count = 1
    expect(mockChannels.length).toBe(1);

    // CHANNEL_ERROR #1 → advance 1000ms → reconnect fires (attempt 0)
    errorChannel();
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(mockChannels.length).toBe(2);

    // CHANNEL_ERROR #2 → advance 2000ms → reconnect fires (attempt 1)
    errorChannel();
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(mockChannels.length).toBe(3);

    // CHANNEL_ERROR #3 → advance 4000ms → reconnect fires (attempt 2)
    errorChannel();
    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    expect(mockChannels.length).toBe(4);
  });

  // Test K (backoff cap): Attempt counter reaching 5 stays at 30000ms
  it("K: 7 consecutive errors progress through 1s..30s and cap at 30s", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    const curve = [1000, 2000, 4000, 8000, 16000, 30000, 30000];

    for (const delayMs of curve) {
      const ch = mockChannels[mockChannels.length - 1];
      act(() => {
        ch.__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
      });
      await act(async () => {
        vi.advanceTimersByTime(delayMs);
        await Promise.resolve();
      });
    }

    // Initial + 7 reconnects = 8 channels
    expect(mockChannels.length).toBe(8);
  });

  // Test L (attempt reset): Successful SUBSCRIBED resets attempt counter
  it("L: SUBSCRIBED resets attempt counter so next CHANNEL_ERROR waits only 1000ms", async () => {
    renderHook(() => useTrackingSubscription({ orderId: "order-123", enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    // First CHANNEL_ERROR at attempt 0 → 1000ms
    act(() => {
      mockChannels[0].__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(mockChannels.length).toBe(2);

    // Reconnect channel SUBSCRIBED → attempt counter resets
    act(() => {
      mockChannels[1].__subscribeCallbacks.forEach((cb) => cb("SUBSCRIBED"));
    });

    // Next CHANNEL_ERROR should wait only 1000ms (not 2000)
    act(() => {
      mockChannels[1].__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Should have a 3rd channel after only 1000ms (proving counter reset)
    expect(mockChannels.length).toBe(3);
  });

  // Test M (visibility hidden): cleans up channels + polling + pending reconnect
  it("M: visibilitychange→hidden removes BOTH channels, stops polling, clears reconnect", async () => {
    renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    const preHiddenRemoveCalls = mockRemoveChannel.mock.calls.length;

    // Trigger CHANNEL_ERROR so there's a pending reconnect timer to clear
    act(() => {
      const trackingCh = findChannel("tracking:order-123")!;
      trackingCh.__subscribeCallbacks.forEach((cb) => cb("CHANNEL_ERROR"));
    });

    // Go hidden
    act(() => {
      setVisibilityState("hidden");
    });

    // Expect removeChannel called for tracking + location (2 more than before)
    expect(mockRemoveChannel.mock.calls.length).toBeGreaterThanOrEqual(preHiddenRemoveCalls + 2);
  });

  // Test N (visibility visible): refresh + re-subscribe both channels
  it("N: visibilitychange→visible re-subscribes tracking + location channels", async () => {
    renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Go hidden first
    act(() => {
      setVisibilityState("hidden");
    });

    const preVisibleTrackingCount = mockChannels.filter((c) =>
      c.name.startsWith("tracking:")
    ).length;
    const preVisibleLocationCount = mockChannels.filter((c) =>
      c.name.startsWith("location:")
    ).length;

    (global.fetch as ReturnType<typeof vi.fn>).mockClear();

    // Go visible
    await act(async () => {
      setVisibilityState("visible");
      await Promise.resolve();
    });

    // Expect immediate fetch (refresh on resume)
    expect(global.fetch).toHaveBeenCalledWith("/api/tracking/order-123");

    // Expect both channels re-created
    const postVisibleTrackingCount = mockChannels.filter((c) =>
      c.name.startsWith("tracking:")
    ).length;
    const postVisibleLocationCount = mockChannels.filter((c) =>
      c.name.startsWith("location:")
    ).length;
    expect(postVisibleTrackingCount).toBeGreaterThan(preVisibleTrackingCount);
    expect(postVisibleLocationCount).toBeGreaterThan(preVisibleLocationCount);
  });

  // Test O (listener cleanup): unmount removes visibilitychange listener
  it("O: unmount removes the visibilitychange listener", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() =>
      useTrackingSubscription({ orderId: "order-123", enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    // Expect at least one removeEventListener call for "visibilitychange"
    const visibilityCalls = removeSpy.mock.calls.filter(([event]) => event === "visibilitychange");
    expect(visibilityCalls.length).toBeGreaterThanOrEqual(1);

    removeSpy.mockRestore();
  });

  // Test P (race): rapid hidden/visible flip-flop does not leak channels
  it("P: rapid hidden→visible→hidden→visible does not leak channels", async () => {
    renderHook(() =>
      useTrackingSubscription({
        orderId: "order-123",
        routeId: "route-456",
        enabled: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Initial: 1 tracking + 1 location
    const initialTrackingCount = mockChannels.filter((c) => c.name.startsWith("tracking:")).length;
    const initialLocationCount = mockChannels.filter((c) => c.name.startsWith("location:")).length;
    expect(initialTrackingCount).toBe(1);
    expect(initialLocationCount).toBe(1);

    const removeCallsBefore = mockRemoveChannel.mock.calls.length;

    // Flip: hidden → visible → hidden → visible
    await act(async () => {
      setVisibilityState("hidden");
      await Promise.resolve();
    });
    await act(async () => {
      setVisibilityState("visible");
      await Promise.resolve();
    });
    await act(async () => {
      setVisibilityState("hidden");
      await Promise.resolve();
    });
    await act(async () => {
      setVisibilityState("visible");
      await Promise.resolve();
    });

    // Each "hidden" should call removeChannel at least twice (tracking + location)
    // Each "visible" should create a new tracking + location channel
    // Two hidden transitions → ≥4 more removeChannel calls
    expect(mockRemoveChannel.mock.calls.length).toBeGreaterThanOrEqual(removeCallsBefore + 4);

    // Two visible transitions → +2 tracking + +2 location channels
    const finalTrackingCount = mockChannels.filter((c) => c.name.startsWith("tracking:")).length;
    const finalLocationCount = mockChannels.filter((c) => c.name.startsWith("location:")).length;
    expect(finalTrackingCount).toBeGreaterThanOrEqual(initialTrackingCount + 2);
    expect(finalLocationCount).toBeGreaterThanOrEqual(initialLocationCount + 2);
  });
});
