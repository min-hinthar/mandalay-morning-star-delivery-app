import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock cart store — inline factory to avoid top-level variable hoisting issues.
// Vitest hoists vi.mock() calls above top-of-file, so external references are
// forbidden. We construct the store+persist shape inside the factory itself.
vi.mock("@/lib/stores/cart-store", () => {
  const core = ((selector: (s: { items: unknown[] }) => unknown) =>
    selector({ items: [] })) as {
    (selector: (s: { items: unknown[] }) => unknown): unknown;
    persist: {
      hasHydrated: () => boolean;
      onFinishHydration: (cb: () => void) => () => void;
    };
  };
  core.persist = {
    hasHydrated: () => true,
    onFinishHydration: () => () => {},
  };
  return { useCartStore: core };
});

// Mock useMenu — also uses an inline factory. We expose a handle via a
// module-scope accessor because vi.mock hoists above top-level declarations.
vi.mock("@/lib/hooks/useMenu", () => {
  const refetch = vi.fn();
  return {
    useMenu: () => ({
      data: { data: { categories: [] } },
      isError: false,
      refetch,
      dataUpdatedAt: 0,
    }),
    // Test-only escape hatch so our tests can control the mock
    __getRefetchMock: () => refetch,
  };
});

// Dynamic import to grab the mocked refetch AFTER vi.mock has hoisted
async function getRefetchMock() {
  const mod = (await import("@/lib/hooks/useMenu")) as unknown as {
    __getRefetchMock: () => ReturnType<typeof vi.fn>;
  };
  return mod.__getRefetchMock();
}

import { useCartValidation } from "../useCartValidation";

describe("useCartValidation CFIX-05 timeout (Phase 110 D-16..D-19)", () => {
  let refetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // shouldAdvanceTime: true lets waitFor's internal polling tick forward
    // under fake timers. Without this, renderHook's act wrapper times out.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    refetchMock = await getRefetchMock();
    refetchMock.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("initial state has timedOut: false", () => {
    refetchMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCartValidation());
    expect(result.current.timedOut).toBe(false);
  });

  it("exposes a proceedAnyway function", () => {
    refetchMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCartValidation());
    expect(typeof result.current.proceedAnyway).toBe("function");
  });

  it("flips timedOut to true after 30s when refetch hangs forever", async () => {
    refetchMock.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCartValidation());

    expect(result.current.timedOut).toBe(false);

    // Advance 29s — still false
    await act(async () => {
      vi.advanceTimersByTime(29000);
    });
    expect(result.current.timedOut).toBe(false);

    // Cross the 30s threshold
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.timedOut).toBe(true);
    });
  });

  it("proceedAnyway resets timedOut to false WITHOUT re-fetching (D-19)", async () => {
    refetchMock.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useCartValidation());

    await act(async () => {
      vi.advanceTimersByTime(31000);
    });
    await waitFor(() => {
      expect(result.current.timedOut).toBe(true);
    });

    const callsBeforeProceed = refetchMock.mock.calls.length;

    act(() => {
      result.current.proceedAnyway();
    });

    expect(result.current.timedOut).toBe(false);
    // No additional refetch calls — customer agency wins
    expect(refetchMock.mock.calls.length).toBe(callsBeforeProceed);
  });

  it("unmount clears timeout and aborts controller (no leaked state updates)", async () => {
    refetchMock.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderHook(() => useCartValidation());

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(() => unmount()).not.toThrow();

    // Advance past 30s after unmount — cleanup should have cleared the timeout,
    // so no setTimedOut state update fires on an unmounted component.
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
  });

  it("timedOut surfaces status='error' so existing gate consumers still block", async () => {
    refetchMock.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useCartValidation());

    await act(async () => {
      vi.advanceTimersByTime(31000);
    });

    await waitFor(() => {
      expect(result.current.timedOut).toBe(true);
    });

    expect(result.current.status).toBe("error");
  });

  it("hasBlockingIssues defaults to false under timeout (no cart contents to block)", async () => {
    refetchMock.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useCartValidation());

    await act(async () => {
      vi.advanceTimersByTime(31000);
    });

    await waitFor(() => {
      expect(result.current.timedOut).toBe(true);
    });

    expect(result.current.hasBlockingIssues).toBe(false);
  });
});
