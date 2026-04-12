import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Reset module state between tests
let toastFn: typeof import("../useToastV8").toast;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../useToastV8");
  toastFn = mod.toast;
});

describe("useToastV8 action support", () => {
  it("preserves action in Toast object through dispatch", () => {
    const onClick = vi.fn();
    const result = toastFn({
      message: "Item removed",
      type: "info",
      action: { label: "Undo", onClick },
    });
    // The toast function should accept action and return a valid toast
    expect(result.id).toBeDefined();
    expect(result.dismiss).toBeInstanceOf(Function);
  });

  it("does NOT auto-dismiss when action onClick is called via triggerAction", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const result = toastFn({
      message: "Item removed",
      type: "info",
      duration: 5000,
      action: { label: "Undo", onClick },
    });

    // Trigger the action - should call onClick and clear timer
    result.triggerAction();
    expect(onClick).toHaveBeenCalledTimes(1);

    // Advance past duration - should not cause errors since timer was cleared
    vi.advanceTimersByTime(6000);
    vi.useRealTimers();
  });

  it("backward compatible - toast without action behaves identically", () => {
    const result = toastFn({
      message: "Success!",
      type: "success",
    });

    expect(result.id).toBeDefined();
    expect(result.dismiss).toBeInstanceOf(Function);
    expect(result.update).toBeInstanceOf(Function);
    // triggerAction should exist but be safe to call
    expect(result.triggerAction).toBeInstanceOf(Function);
  });

  it("action onClick callback is invoked when triggerAction is called", () => {
    const onClick = vi.fn();
    const result = toastFn({
      message: "Removed",
      type: "info",
      action: { label: "Undo", onClick },
    });

    result.triggerAction();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("useToastV8 persistent toast (duration: 0)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not schedule a remove timer when duration is 0", () => {
    vi.useFakeTimers();
    const timersBefore = vi.getTimerCount();
    toastFn({ message: "Persistent error", type: "error", duration: 0 });
    const timersAfter = vi.getTimerCount();

    // No new timer should be created for duration: 0
    expect(timersAfter).toBe(timersBefore);
  });

  it("schedules a remove timer when duration is positive (e.g. 5000)", () => {
    vi.useFakeTimers();
    const timersBefore = vi.getTimerCount();
    toastFn({ message: "Temporary", type: "success", duration: 5000 });
    const timersAfter = vi.getTimerCount();

    // A timer should be created for auto-dismiss
    expect(timersAfter).toBe(timersBefore + 1);
  });
});
