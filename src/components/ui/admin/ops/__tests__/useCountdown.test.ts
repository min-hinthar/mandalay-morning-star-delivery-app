import { describe, it, expect } from "vitest";
import { computeCountdown } from "../useCountdown";

describe("computeCountdown", () => {
  it("returns correct hours/minutes/seconds for future target", () => {
    const now = new Date(2026, 2, 7, 10, 0, 0); // 10:00 AM
    const target = new Date(2026, 2, 7, 11, 0, 0); // 11:00 AM (1 hour away)
    const result = computeCountdown(target, "Cutoff", now);
    expect(result).toEqual({
      hours: 1,
      minutes: 0,
      seconds: 0,
      isPast: false,
      label: "Cutoff",
    });
  });

  it("returns isPast true when target is in the past", () => {
    const now = new Date(2026, 2, 7, 12, 0, 0);
    const target = new Date(2026, 2, 7, 11, 0, 0);
    const result = computeCountdown(target, "Cutoff", now);
    expect(result).toEqual({
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      label: "Cutoff",
    });
  });

  it("returns isPast true when target equals now", () => {
    const now = new Date(2026, 2, 7, 11, 0, 0);
    const target = new Date(2026, 2, 7, 11, 0, 0);
    const result = computeCountdown(target, "Cutoff", now);
    expect(result.isPast).toBe(true);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("computes mixed hours/minutes/seconds correctly", () => {
    const now = new Date(2026, 2, 7, 10, 0, 0);
    // 2 hours, 30 minutes, 45 seconds away
    const target = new Date(2026, 2, 7, 12, 30, 45);
    const result = computeCountdown(target, "Delivery", now);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(30);
    expect(result.seconds).toBe(45);
    expect(result.isPast).toBe(false);
    expect(result.label).toBe("Delivery");
  });

  it("handles large time differences", () => {
    // Use dates that don't cross DST boundary (Jan dates are safe)
    const now = new Date(2026, 0, 10, 10, 0, 0);
    const target = new Date(2026, 0, 11, 10, 0, 0); // 24 hours away
    const result = computeCountdown(target, "Tomorrow", now);
    expect(result.hours).toBe(24);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.isPast).toBe(false);
  });
});
