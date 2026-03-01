import { describe, expect, it } from "vitest";
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

const makePtDate = (value: string) => new Date(`${value}-08:00`);

// Default cutoff values matching old constants
const CUTOFF_DAY = 5; // Friday
const CUTOFF_HOUR = 15; // 3 PM

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
});
