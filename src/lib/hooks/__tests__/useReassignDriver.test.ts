import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReassignDriver } from "../useReassignDriver";

// Mock project toast
const mockToast = vi.fn();
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

describe("useReassignDriver", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fires immediately for planned routes without confirmation", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "planned",
        currentDriverName: "Driver A",
      })
    );

    expect(result.current.showConfirmation).toBe(false);

    await act(async () => {
      await result.current.reassignDriver("driver-2");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/routes/route-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: "driver-2" }),
    });
    expect(result.current.showConfirmation).toBe(false);
  });

  it("shows confirmation for in_progress routes", async () => {
    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "in_progress",
        currentDriverName: "Driver A",
      })
    );

    act(() => {
      result.current.reassignDriver("driver-2");
    });

    expect(result.current.showConfirmation).toBe(true);
    expect(result.current.pendingDriverId).toBe("driver-2");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fires request on confirmReassign for in_progress routes", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "in_progress",
        currentDriverName: "Driver A",
      })
    );

    act(() => {
      result.current.reassignDriver("driver-2");
    });

    await act(async () => {
      await result.current.confirmReassign();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/routes/route-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: "driver-2" }),
    });
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.pendingDriverId).toBeNull();
  });

  it("clears state on cancelReassign", () => {
    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "in_progress",
        currentDriverName: "Driver A",
      })
    );

    act(() => {
      result.current.reassignDriver("driver-2");
    });

    expect(result.current.showConfirmation).toBe(true);

    act(() => {
      result.current.cancelReassign();
    });

    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.pendingDriverId).toBeNull();
  });

  it("handles API error with toast", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "planned",
        currentDriverName: "Driver A",
      })
    );

    await act(async () => {
      await result.current.reassignDriver("driver-2");
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });

  it("tracks isReassigning state", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() =>
      useReassignDriver({
        routeId: "route-1",
        routeStatus: "planned",
        currentDriverName: "Driver A",
      })
    );

    expect(result.current.isReassigning).toBe(false);

    let reassignPromise: Promise<void>;
    act(() => {
      reassignPromise = result.current.reassignDriver("driver-2") as unknown as Promise<void>;
    });

    expect(result.current.isReassigning).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await reassignPromise!;
    });

    expect(result.current.isReassigning).toBe(false);
  });
});
