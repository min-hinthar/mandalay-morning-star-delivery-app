import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSplitRoute } from "../useSplitRoute";

vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: vi.fn(),
}));

describe("useSplitRoute", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST with stopIds and driverId to split endpoint", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ newRouteId: "new-route-1" }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSplitRoute({ onSuccess }));

    await act(async () => {
      await result.current.splitRoute("route-1", ["stop-a", "stop-b"], "driver-1");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/routes/route-1/split", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopIds: ["stop-a", "stop-b"], driverId: "driver-1" }),
    });
    expect(onSuccess).toHaveBeenCalledWith("new-route-1");
  });

  it("sends POST without driverId when not provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ newRouteId: "new-route-2" }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSplitRoute({ onSuccess }));

    await act(async () => {
      await result.current.splitRoute("route-1", ["stop-a"]);
    });

    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.driverId).toBeUndefined();
    expect(onSuccess).toHaveBeenCalledWith("new-route-2");
  });

  it("shows error toast and does not call onSuccess on API error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Split failed" }),
    });

    const { toast } = await import("@/lib/hooks/useToastV8");
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSplitRoute({ onSuccess }));

    await act(async () => {
      await result.current.splitRoute("route-1", ["stop-a"]);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    );
  });

  it("tracks isSplitting state during request", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useSplitRoute({ onSuccess: vi.fn() }));

    expect(result.current.isSplitting).toBe(false);

    let splitPromise: Promise<void>;
    act(() => {
      splitPromise = result.current.splitRoute("route-1", ["stop-a"]);
    });

    expect(result.current.isSplitting).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ newRouteId: "new-route" }),
      });
      await splitPromise!;
    });

    expect(result.current.isSplitting).toBe(false);
  });

  it("rejects if stopIds is empty", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSplitRoute({ onSuccess }));

    await act(async () => {
      await result.current.splitRoute("route-1", []);
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
