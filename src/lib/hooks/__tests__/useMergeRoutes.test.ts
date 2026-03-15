import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMergeRoutes } from "../useMergeRoutes";

vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: vi.fn(),
}));

describe("useMergeRoutes", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST with sourceRouteId to merge endpoint", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalStops: 8 }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useMergeRoutes({ onSuccess }));

    await act(async () => {
      await result.current.mergeRoutes("dest-route", "source-route");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/routes/dest-route/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceRouteId: "source-route" }),
    });
    expect(onSuccess).toHaveBeenCalledWith(8);
  });

  it("shows error toast and does not call onSuccess on API error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Merge failed" }),
    });

    const { toast } = await import("@/lib/hooks/useToastV8");
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useMergeRoutes({ onSuccess }));

    await act(async () => {
      await result.current.mergeRoutes("dest-route", "source-route");
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    );
  });

  it("tracks isMerging state during request", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useMergeRoutes({ onSuccess: vi.fn() }));

    expect(result.current.isMerging).toBe(false);

    let mergePromise: Promise<void>;
    act(() => {
      mergePromise = result.current.mergeRoutes("dest-route", "source-route");
    });

    expect(result.current.isMerging).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ totalStops: 5 }),
      });
      await mergePromise!;
    });

    expect(result.current.isMerging).toBe(false);
  });

  it("shows success toast with merge message on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalStops: 6 }),
    });

    const { toast } = await import("@/lib/hooks/useToastV8");
    const { result } = renderHook(() => useMergeRoutes({ onSuccess: vi.fn() }));

    await act(async () => {
      await result.current.mergeRoutes("dest-route", "source-route");
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" }),
    );
  });
});
