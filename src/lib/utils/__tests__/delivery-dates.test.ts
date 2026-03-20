import { describe, expect, it, vi } from "vitest";
import { TIMEZONE } from "@/types/delivery";
import {
  getCutoffForSaturday,
  getDeliveryDate,
  getNextSaturday,
  getTimeUntilCutoff,
  isPastCutoff,
  getAvailableDeliveryDates,
} from "../delivery-dates";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

/**
 * Create a Date from an LA-local datetime string.
 * Dynamically computes the correct UTC offset (PST=-08:00, PDT=-07:00)
 * by probing Intl.DateTimeFormat for the target date.
 */
function makePtDate(value: string): Date {
  const naive = new Date(`${value}Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(naive);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-8";
  const match = tzName.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1], 10) : -8;
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours).toString().padStart(2, "0");
  return new Date(`${value}${sign}${abs}:00`);
}

// Default cutoff values matching old constants
const CUTOFF_DAY = 5; // Friday
const CUTOFF_HOUR = 15; // 3 PM

describe("TIMEZONE env var", () => {
  it("defaults to America/Los_Angeles when DELIVERY_TIMEZONE is not set", async () => {
    vi.stubEnv("DELIVERY_TIMEZONE", "");
    vi.resetModules();
    const mod = await import("@/types/delivery");
    expect(mod.TIMEZONE).toBe("America/Los_Angeles");
    vi.unstubAllEnvs();
  });

  it("reads from DELIVERY_TIMEZONE env var when set", async () => {
    vi.stubEnv("DELIVERY_TIMEZONE", "Asia/Yangon");
    vi.resetModules();
    const mod = await import("@/types/delivery");
    expect(mod.TIMEZONE).toBe("Asia/Yangon");
    vi.unstubAllEnvs();
  });
});

describe("delivery date utils", () => {
  describe("getNextSaturday", () => {
    it("returns this Saturday when called on Monday", () => {
      const monday = makePtDate("2026-01-12T10:00:00");
      const saturday = getNextSaturday(monday);
      expect(formatDate(saturday)).toBe("2026-01-17");
    });

    it("returns next Saturday when called on Saturday", () => {
      const saturday = makePtDate("2026-01-17T10:00:00");
      const nextSaturday = getNextSaturday(saturday);
      expect(formatDate(nextSaturday)).toBe("2026-01-24");
    });
  });

  describe("isPastCutoff", () => {
    it("returns false before Friday 3pm", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const fridayMorning = makePtDate("2026-01-16T10:00:00");
      expect(isPastCutoff(saturday, fridayMorning, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
    });

    it("returns true after Friday 3pm", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const fridayEvening = makePtDate("2026-01-16T16:00:00");
      expect(isPastCutoff(saturday, fridayEvening, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });
  });

  describe("getDeliveryDate", () => {
    it("returns this Saturday before cutoff", () => {
      const wednesday = makePtDate("2026-01-14T10:00:00");
      const result = getDeliveryDate(wednesday, CUTOFF_DAY, CUTOFF_HOUR);
      expect(result.isNextWeek).toBe(false);
      expect(result.dateString).toBe("2026-01-17");
    });

    it("returns next Saturday after cutoff", () => {
      const fridayEvening = makePtDate("2026-01-16T18:00:00");
      const result = getDeliveryDate(fridayEvening, CUTOFF_DAY, CUTOFF_HOUR);
      expect(result.isNextWeek).toBe(true);
      expect(result.dateString).toBe("2026-01-24");
    });
  });

  describe("getTimeUntilCutoff", () => {
    it("returns hours and minutes before cutoff", () => {
      const fridayMorning = makePtDate("2026-01-16T10:15:00");
      const result = getTimeUntilCutoff(fridayMorning, CUTOFF_DAY, CUTOFF_HOUR);
      expect(result.isPastCutoff).toBe(false);
      expect(result.hours).toBeGreaterThan(0);
    });
  });

  describe("getCutoffForSaturday", () => {
    it("returns Friday at 3pm PT with default cutoff", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      const display = new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(cutoff);
      expect(display).toContain("Fri");
      expect(display).toContain("3:00 PM");
    });
  });

  describe("getAvailableDeliveryDates", () => {
    it("returns correct number of dates", () => {
      const wednesday = makePtDate("2026-01-14T10:00:00");
      const dates = getAvailableDeliveryDates(wednesday, CUTOFF_DAY, CUTOFF_HOUR, 3);
      expect(dates).toHaveLength(3);
    });
  });

  describe("BUG-07: cutoff safety buffer", () => {
    // The 10-second safety buffer makes isPastCutoff return true
    // when now > cutoff - 10s (i.e., within 10 seconds of cutoff).
    // This prevents orders submitted at the boundary from failing
    // due to DB insert latency.

    it("returns false 11 seconds before cutoff (outside buffer)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      const elevenSecBefore = new Date(cutoff.getTime() - 11_000);
      expect(isPastCutoff(saturday, elevenSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
    });

    it("returns true 10 seconds before cutoff (at buffer boundary)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      // now.getTime() > cutoff.getTime() - 10000
      // cutoff - 10s + 1ms > cutoff - 10s → true
      const tenSecBefore = new Date(cutoff.getTime() - 10_000 + 1);
      expect(isPastCutoff(saturday, tenSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });

    it("returns true 5 seconds before cutoff (inside buffer)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      const fiveSecBefore = new Date(cutoff.getTime() - 5_000);
      expect(isPastCutoff(saturday, fiveSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });

    it("returns true at exact cutoff time", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      expect(isPastCutoff(saturday, cutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });

    it("returns true 1 second after cutoff", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      const oneSecAfter = new Date(cutoff.getTime() + 1_000);
      expect(isPastCutoff(saturday, oneSecAfter, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });

    it("returns false 1 hour before cutoff (well before buffer)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      const oneHourBefore = new Date(cutoff.getTime() - 60 * 60 * 1000);
      expect(isPastCutoff(saturday, oneHourBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
    });

    it("getTimeUntilCutoff does NOT include buffer (raw time for UI)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
      // 5 seconds before cutoff — isPastCutoff is true (buffer), but
      // getTimeUntilCutoff should show ~0 minutes remaining (not past cutoff in UI)
      const fiveSecBefore = new Date(cutoff.getTime() - 5_000);
      const result = getTimeUntilCutoff(fiveSecBefore, CUTOFF_DAY, CUTOFF_HOUR);
      // UI gate still shows as NOT past cutoff (raw comparison, no buffer)
      expect(result.isPastCutoff).toBe(false);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
    });
  });

  describe("DST boundary tests (TST-04)", () => {
    // 2026 DST transitions for America/Los_Angeles:
    // Spring forward: March 8, 2026 at 2:00 AM (PST -> PDT, UTC-8 -> UTC-7)
    // Fall back: November 1, 2026 at 2:00 AM (PDT -> PST, UTC-7 -> UTC-8)

    describe("spring-forward (March 8, 2026)", () => {
      // Saturday delivery: March 7, 2026
      // Friday cutoff: March 6, 2026 at 3:00 PM PST (UTC-8)
      // DST doesn't change until Sunday March 8 at 2 AM, so Friday is still PST
      const springForwardSaturday = new Date("2026-03-07T08:00:00.000Z"); // March 7 midnight PST

      it("cutoff calculated correctly on Friday before DST spring-forward Saturday", () => {
        const cutoff = getCutoffForSaturday(springForwardSaturday, CUTOFF_DAY, CUTOFF_HOUR);
        const display = new Intl.DateTimeFormat("en-US", {
          timeZone: TIMEZONE,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(cutoff);
        expect(display).toContain("Fri");
        expect(display).toContain("3:00 PM");
        expect(display).toContain("Mar");
        expect(display).toContain("6");
      });

      it("order placed at 2:59 PM PST Friday before spring-forward Saturday is accepted", () => {
        // March 6, 2026 2:59 PM PST = 22:59 UTC
        const beforeCutoff = new Date("2026-03-06T22:59:00.000Z");
        expect(isPastCutoff(springForwardSaturday, beforeCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(
          false
        );
      });

      it("order placed at 3:00:01 PM PST Friday before spring-forward Saturday is rejected", () => {
        // March 6, 2026 3:00:01 PM PST = 23:00:01 UTC
        const afterCutoff = new Date("2026-03-06T23:00:01.000Z");
        expect(isPastCutoff(springForwardSaturday, afterCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(
          true
        );
      });
    });

    describe("fall-back (November 1, 2026)", () => {
      // DST fall-back: November 1, 2026 (Sunday) — clocks go back at 2 AM
      // Saturday delivery: November 7, 2026
      // Friday cutoff: November 6, 2026 at 3:00 PM PST (UTC-8, post fall-back)
      // Wait: Nov 1 is the fall-back. By Nov 6 Friday we are already PST (UTC-8)
      const fallBackSaturday = new Date("2026-11-07T08:00:00.000Z"); // Nov 7 midnight PST

      it("cutoff calculated correctly on Friday after DST fall-back", () => {
        const cutoff = getCutoffForSaturday(fallBackSaturday, CUTOFF_DAY, CUTOFF_HOUR);
        const display = new Intl.DateTimeFormat("en-US", {
          timeZone: TIMEZONE,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(cutoff);
        expect(display).toContain("Fri");
        expect(display).toContain("3:00 PM");
        expect(display).toContain("Nov");
        expect(display).toContain("6");
      });

      it("order placed at 2:59 PM PST Friday after fall-back is accepted", () => {
        // November 6, 2026 2:59 PM PST = 22:59 UTC (post fall-back, UTC-8)
        const beforeCutoff = new Date("2026-11-06T22:59:00.000Z");
        expect(isPastCutoff(fallBackSaturday, beforeCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
      });

      it("order placed at 3:00:01 PM PST Friday after fall-back is rejected", () => {
        // November 6, 2026 3:00:01 PM PST = 23:00:01 UTC (post fall-back, UTC-8)
        const afterCutoff = new Date("2026-11-06T23:00:01.000Z");
        expect(isPastCutoff(fallBackSaturday, afterCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
      });
    });

    describe("safety buffer at DST boundary", () => {
      // Test that the 10-second safety buffer works correctly at DST transitions
      const springForwardSaturday = new Date("2026-03-07T08:00:00.000Z");

      it("safety buffer (10s) rejects order 5 seconds before cutoff at DST boundary", () => {
        const cutoff = getCutoffForSaturday(springForwardSaturday, CUTOFF_DAY, CUTOFF_HOUR);
        // 5 seconds before cutoff — inside the 10s buffer — should be rejected
        const fiveSecBefore = new Date(cutoff.getTime() - 5_000);
        expect(isPastCutoff(springForwardSaturday, fiveSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(
          true
        );
      });

      it("safety buffer (10s) accepts order 11 seconds before cutoff at DST boundary", () => {
        const cutoff = getCutoffForSaturday(springForwardSaturday, CUTOFF_DAY, CUTOFF_HOUR);
        // 11 seconds before cutoff — outside the 10s buffer — should be accepted
        const elevenSecBefore = new Date(cutoff.getTime() - 11_000);
        expect(isPastCutoff(springForwardSaturday, elevenSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(
          false
        );
      });
    });
  });

  describe("parameterization", () => {
    it("getCutoffForSaturday respects custom cutoff day/hour (Thursday 12pm)", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday, 4, 12); // Thursday noon
      const display = new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(cutoff);
      expect(display).toContain("Thu");
      expect(display).toContain("12:00 PM");
    });

    it("isPastCutoff uses custom cutoff params", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      // Thursday 2pm - before Thursday 3pm cutoff
      const thursdayAfternoon = makePtDate("2026-01-15T14:00:00");
      expect(isPastCutoff(saturday, thursdayAfternoon, 4, 15)).toBe(false);
      // Thursday 4pm - after Thursday 3pm cutoff
      const thursdayEvening = makePtDate("2026-01-15T16:00:00");
      expect(isPastCutoff(saturday, thursdayEvening, 4, 15)).toBe(true);
    });

    it("getDeliveryDate uses custom cutoff params", () => {
      // With Thursday noon cutoff: Friday should push to next week
      const friday = makePtDate("2026-01-16T10:00:00");
      const result = getDeliveryDate(friday, 4, 12);
      expect(result.isNextWeek).toBe(true);
      expect(result.dateString).toBe("2026-01-24");
    });
  });

  describe("DST transitions", () => {
    // March 8 2026: clocks spring forward (PST -> PDT)
    // November 1 2026: clocks fall back (PDT -> PST)

    it("handles spring-forward correctly (March 8 2026)", () => {
      // Friday before spring-forward: should be PST (-08:00)
      const fridayBeforeDST = makePtDate("2026-03-06T14:00:00");
      const saturday = getNextSaturday(fridayBeforeDST);
      // March 7 is Saturday
      expect(formatDate(saturday)).toBe("2026-03-07");
    });

    it("handles fall-back correctly (November 1 2026)", () => {
      // Friday before fall-back: should be PDT (-07:00)
      const fridayBeforeFallback = makePtDate("2026-10-30T14:00:00");
      const saturday = getNextSaturday(fridayBeforeFallback);
      // October 31 is Saturday
      expect(formatDate(saturday)).toBe("2026-10-31");
    });

    it("isPastCutoff works across spring-forward boundary", () => {
      // March 8 2026 is Sunday (spring forward)
      // Saturday March 7 delivery, cutoff Friday March 6 3PM PST
      const saturdayMarch7 = makePtDate("2026-03-07T00:00:00");
      const beforeCutoff = makePtDate("2026-03-06T14:00:00");
      const afterCutoff = makePtDate("2026-03-06T16:00:00");
      expect(isPastCutoff(saturdayMarch7, beforeCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
      expect(isPastCutoff(saturdayMarch7, afterCutoff, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
    });
  });
});
