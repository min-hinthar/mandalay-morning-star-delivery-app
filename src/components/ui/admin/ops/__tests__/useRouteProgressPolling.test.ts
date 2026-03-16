import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouteProgressPolling } from "../useRouteProgressPolling";

// Mock the type import to avoid importing server-side code
vi.mock("@/app/api/admin/ops/routes-progress/route", () => ({}));

const mockRoutes = [
  {
    id: "r1",
    status: "in_progress" as const,
    driver_name: "Alice",
    stats_json: { total_stops: 5, delivered_stops: 2 },
    started_at: null,
    delivery_date: "2026-03-16",
  },
];

describe("useRouteProgressPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockRoutes,
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetches routes on mount", async () => {
    const { result } = renderHook(() => useRouteProgressPolling(5000));
    // Flush microtasks so the initial fetch + state update completes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/ops/routes-progress",
    );
    expect(result.current.routes).toHaveLength(1);
  });

  it("polls every N milliseconds", async () => {
    renderHook(() => useRouteProgressPolling(3000));
    // Initial call
    await vi.advanceTimersByTimeAsync(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Advance past first interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Advance another interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("sets isRefreshing during fetch", async () => {
    let resolveFetch!: (value: Response) => void;
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { result } = renderHook(() => useRouteProgressPolling(5000));
    // isRefreshing should be true while fetch is pending
    expect(result.current.isRefreshing).toBe(true);
    // Resolve fetch
    await act(async () => {
      resolveFetch({ ok: true, json: async () => [] } as Response);
    });
    expect(result.current.isRefreshing).toBe(false);
  });

  it("cleans up interval on unmount", async () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() => useRouteProgressPolling(5000));
    await vi.advanceTimersByTimeAsync(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("does not update state after unmount", async () => {
    let resolveFetch!: (value: Response) => void;
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { result, unmount } = renderHook(() =>
      useRouteProgressPolling(5000),
    );
    unmount();
    // Resolve fetch after unmount -- should not throw
    await act(async () => {
      resolveFetch({ ok: true, json: async () => mockRoutes } as Response);
    });
    // routes should still be empty (initial state)
    expect(result.current.routes).toHaveLength(0);
  });

  it("accepts custom interval", async () => {
    renderHook(() => useRouteProgressPolling(10000));
    await vi.advanceTimersByTimeAsync(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    // At 5s with 10s interval, no second call yet
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    // At 10s, second call
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
