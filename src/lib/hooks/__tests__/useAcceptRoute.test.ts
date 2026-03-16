import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAcceptRoute } from "../useAcceptRoute";

const mockToast = vi.fn();
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

describe("useAcceptRoute", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls fetch POST /api/driver/routes/{routeId}/accept", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));

    await act(async () => {
      await result.current.acceptRoute();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/driver/routes/route-1/accept", {
      method: "POST",
    });
  });

  it("calls onSuccess and shows success toast on 200", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1", onSuccess }));

    await act(async () => {
      await result.current.acceptRoute();
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Route accepted!", type: "success" })
    );
  });

  it("shows error toast on non-200 response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad request" }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1", onSuccess }));

    await act(async () => {
      await result.current.acceptRoute();
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });

  it("tracks isAccepting state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));

    expect(result.current.isAccepting).toBe(false);

    let acceptPromise: Promise<void>;
    act(() => {
      acceptPromise = result.current.acceptRoute();
    });

    expect(result.current.isAccepting).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await acceptPromise!;
    });

    expect(result.current.isAccepting).toBe(false);
  });

  it("shows error toast on network error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));

    await act(async () => {
      await result.current.acceptRoute();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });
});
