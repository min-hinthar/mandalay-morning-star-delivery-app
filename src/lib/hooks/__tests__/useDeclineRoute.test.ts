import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeclineRoute } from "../useDeclineRoute";

const mockToast = vi.fn();
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

describe("useDeclineRoute", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls fetch POST /api/driver/routes/{routeId}/decline", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useDeclineRoute({ routeId: "route-1" }));

    await act(async () => {
      await result.current.declineRoute();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/driver/routes/route-1/decline",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends reason in JSON body when provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useDeclineRoute({ routeId: "route-1" }));

    await act(async () => {
      await result.current.declineRoute("Schedule conflict");
    });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.reason).toBe("Schedule conflict");
  });

  it("calls onSuccess and shows success toast on 200", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeclineRoute({ routeId: "route-1", onSuccess }));

    await act(async () => {
      await result.current.declineRoute();
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Route declined", type: "success" })
    );
  });

  it("shows error toast on non-200 response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeclineRoute({ routeId: "route-1", onSuccess }));

    await act(async () => {
      await result.current.declineRoute();
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });

  it("tracks isDeclining state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useDeclineRoute({ routeId: "route-1" }));

    expect(result.current.isDeclining).toBe(false);

    let declinePromise: Promise<void>;
    act(() => {
      declinePromise = result.current.declineRoute();
    });

    expect(result.current.isDeclining).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await declinePromise!;
    });

    expect(result.current.isDeclining).toBe(false);
  });
});
