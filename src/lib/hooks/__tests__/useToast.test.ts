import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "../useToast";

describe("useToast persistent flag (Phase 110 D-32)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Drain all pending toasts to reset shared memoryState across tests
    const { result } = renderHook(() => useToast());
    act(() => {
      for (const t of [...result.current.toasts]) {
        result.current.dismiss(t.id);
      }
    });
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("non-persistent toast auto-removes after TOAST_REMOVE_DELAY (5000ms)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "ephemeral" });
    });

    expect(result.current.toasts.some((t) => t.title === "ephemeral")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5001);
    });

    expect(result.current.toasts.some((t) => t.title === "ephemeral")).toBe(false);
  });

  it("persistent toast does NOT auto-remove after 60s", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "critical", persistent: true });
    });

    expect(result.current.toasts.some((t) => t.title === "critical")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(60000); // 60 seconds — way past 5s
    });

    expect(result.current.toasts.some((t) => t.title === "critical")).toBe(true);
  });

  it("persistent toast can be manually dismissed via the returned dismiss()", () => {
    const { result } = renderHook(() => useToast());

    let handle: ReturnType<typeof toast> | undefined;
    act(() => {
      handle = toast({ title: "manual-dismiss", persistent: true });
    });

    expect(result.current.toasts.some((t) => t.title === "manual-dismiss")).toBe(true);

    act(() => {
      handle?.dismiss();
    });

    expect(result.current.toasts.some((t) => t.title === "manual-dismiss")).toBe(false);
  });

  it("destructive + persistent toast is supported (Phase 110 CFIX-04 shape)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({
        title: "Payment service is slow to respond",
        description: "We couldn't reach our payment provider. Your cart and address are still saved.",
        variant: "destructive",
        persistent: true,
      });
    });

    const found = result.current.toasts.find(
      (t) => t.title === "Payment service is slow to respond"
    );
    expect(found).toBeDefined();
    expect(found?.variant).toBe("destructive");
    expect(found?.persistent).toBe(true);
  });

  it("multiple persistent + non-persistent toasts coexist correctly", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "mixed-persistent", persistent: true });
      toast({ title: "mixed-ephemeral" });
    });

    expect(result.current.toasts.some((t) => t.title === "mixed-persistent")).toBe(true);
    expect(result.current.toasts.some((t) => t.title === "mixed-ephemeral")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5001);
    });

    // Persistent survives; ephemeral auto-removes
    expect(result.current.toasts.some((t) => t.title === "mixed-persistent")).toBe(true);
    expect(result.current.toasts.some((t) => t.title === "mixed-ephemeral")).toBe(false);
  });
});
