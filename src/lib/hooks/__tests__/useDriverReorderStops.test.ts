import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDriverReorderStops } from "../useDriverReorderStops";

const mockToast = vi.fn();
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

describe("useDriverReorderStops", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const stopOrder = [
    { stopId: "stop-1", stopIndex: 0 },
    { stopId: "stop-2", stopIndex: 1 },
  ];

  it("calls fetch POST /api/driver/routes/{routeId}/reorder with stopOrder payload", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useDriverReorderStops({ routeId: "route-1" }));

    await act(async () => {
      await result.current.reorderStops(stopOrder);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/driver/routes/route-1/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopOrder }),
    });
  });

  it("does not show toast on success (silent save)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useDriverReorderStops({ routeId: "route-1" }));

    await act(async () => {
      await result.current.reorderStops(stopOrder);
    });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it("shows error toast and calls onError on non-200 response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useDriverReorderStops({ routeId: "route-1", onError }));

    await act(async () => {
      await result.current.reorderStops(stopOrder);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to save stop order", type: "error" })
    );
    expect(onError).toHaveBeenCalled();
  });

  it("tracks isReordering state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useDriverReorderStops({ routeId: "route-1" }));

    expect(result.current.isReordering).toBe(false);

    let reorderPromise: Promise<void>;
    act(() => {
      reorderPromise = result.current.reorderStops(stopOrder);
    });

    expect(result.current.isReordering).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await reorderPromise!;
    });

    expect(result.current.isReordering).toBe(false);
  });
});
