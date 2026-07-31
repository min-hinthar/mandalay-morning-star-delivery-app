import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNextDatesForDays } from "../checkout-error-dates";

/**
 * The `date` field is submitted; the `label` is what the customer reads. They
 * are derived separately (one machine-readable, one localized), so the thing
 * worth pinning is that they can never describe different days — the classic
 * UTC-vs-local footgun this repo has hit before.
 */
describe("getNextDatesForDays", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the requested count, in the future, on the requested weekdays", () => {
    const result = getNextDatesForDays(["Monday", "Thursday"], 4);
    expect(result).toHaveLength(4);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const { date } of result) {
      const [y, m, d] = date.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      expect(parsed.getTime()).toBeGreaterThan(today.getTime());
      expect([1, 4]).toContain(parsed.getDay());
    }
  });

  it("returns dates in ascending order", () => {
    const dates = getNextDatesForDays(["Monday", "Wednesday", "Saturday"], 5).map((r) => r.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("ignores unknown day names rather than emitting bogus dates", () => {
    expect(getNextDatesForDays(["Caturday"], 3)).toEqual([]);
  });

  describe("late-evening LA (the UTC rollover)", () => {
    beforeEach(() => {
      // 2026-03-10 22:30 PT is already 2026-03-11 05:30 UTC. A UTC-derived date
      // string would be a day ahead of the locally-rendered label.
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-11T05:30:00Z"));
    });

    it("keeps the submitted date and the displayed label on the same day", () => {
      for (const { label, date } of getNextDatesForDays(
        ["Monday", "Wednesday", "Thursday", "Saturday"],
        4
      )) {
        const [y, m, d] = date.split("-").map(Number);
        const expectedLabel = new Date(y, m - 1, d).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        expect(label).toBe(expectedLabel);
      }
    });

    it("derives the date from local Y/M/D, not toISOString", () => {
      const [first] = getNextDatesForDays(["Thursday"], 1);
      // Local "now" is Tue 2026-03-10; the next Thursday is the 12th. A UTC
      // derivation would start from the 11th and could report the 19th.
      expect(first.date).toBe("2026-03-12");
    });
  });
});
