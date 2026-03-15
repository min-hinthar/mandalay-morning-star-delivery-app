import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReorderStops } from "../useReorderStops";
import type { StopDetail } from "@/types/driver";

vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: vi.fn(),
}));

function makeStop(overrides: Partial<StopDetail> & { id: string; stopIndex: number }): StopDetail {
  return {
    eta: null,
    status: "pending",
    arrivedAt: null,
    deliveredAt: null,
    deliveryPhotoUrl: null,
    deliveryNotes: null,
    order: {
      id: `order-${overrides.id}`,
      totalCents: 1000,
      deliveryWindowStart: null,
      deliveryWindowEnd: null,
      specialInstructions: null,
      itemCount: 2,
      customer: { id: "cust-1", fullName: "Test Customer", phone: null },
      address: {
        line1: "123 Main St",
        line2: null,
        city: "Covina",
        state: "CA",
        postalCode: "91722",
        lat: null,
        lng: null,
      },
    },
    exception: null,
    ...overrides,
  };
}

const STOPS: StopDetail[] = [
  makeStop({ id: "stop-1", stopIndex: 0 }),
  makeStop({ id: "stop-2", stopIndex: 1 }),
  makeStop({ id: "stop-3", stopIndex: 2 }),
];

describe("useReorderStops", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends PATCH with stopOrder payload on handleReorder", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "planned",
        onSuccess,
        onError,
      }),
    );

    const reordered = [STOPS[2], STOPS[0], STOPS[1]];

    await act(async () => {
      await result.current.handleReorder(reordered);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/routes/route-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stopOrder: [
          { stopId: "stop-3", stopIndex: 0 },
          { stopId: "stop-1", stopIndex: 1 },
          { stopId: "stop-2", stopIndex: 2 },
        ],
      }),
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("includes forceOverride for in_progress routes", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "in_progress",
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleReorder(STOPS);
    });

    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.forceOverride).toBe(true);
  });

  it("does not include forceOverride for planned routes", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "planned",
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleReorder(STOPS);
    });

    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.forceOverride).toBeUndefined();
  });

  it("calls onError with previous stops on API error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "planned",
        onSuccess,
        onError,
      }),
    );

    const reordered = [STOPS[2], STOPS[0], STOPS[1]];

    await act(async () => {
      await result.current.handleReorder(reordered);
    });

    expect(onError).toHaveBeenCalledWith(reordered);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onError on fetch exception", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const onError = vi.fn();

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "planned",
        onSuccess: vi.fn(),
        onError,
      }),
    );

    await act(async () => {
      await result.current.handleReorder(STOPS);
    });

    expect(onError).toHaveBeenCalledWith(STOPS);
  });

  it("tracks isReordering state during request", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    const { result } = renderHook(() =>
      useReorderStops({
        routeId: "route-1",
        routeStatus: "planned",
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );

    expect(result.current.isReordering).toBe(false);

    let reorderPromise: Promise<void>;
    act(() => {
      reorderPromise = result.current.handleReorder(STOPS);
    });

    expect(result.current.isReordering).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await reorderPromise!;
    });

    expect(result.current.isReordering).toBe(false);
  });
});
