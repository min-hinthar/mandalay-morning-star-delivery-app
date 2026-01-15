import { describe, expect, it } from "vitest";
import { TIMEZONE } from "@/types/delivery";
import {
  getCutoffForSaturday,
  getDeliveryDate,
  getNextSaturday,
  getTimeUntilCutoff,
  isPastCutoff,
} from "../delivery-dates";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const makePtDate = (value: string) => new Date(`${value}-08:00`);

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
      expect(isPastCutoff(saturday, fridayMorning)).toBe(false);
    });

    it("returns true after Friday 3pm", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const fridayEvening = makePtDate("2026-01-16T16:00:00");
      expect(isPastCutoff(saturday, fridayEvening)).toBe(true);
    });
  });

  describe("getDeliveryDate", () => {
    it("returns this Saturday before cutoff", () => {
      const wednesday = makePtDate("2026-01-14T10:00:00");
      const result = getDeliveryDate(wednesday);
      expect(result.isNextWeek).toBe(false);
      expect(result.dateString).toBe("2026-01-17");
    });

    it("returns next Saturday after cutoff", () => {
      const fridayEvening = makePtDate("2026-01-16T18:00:00");
      const result = getDeliveryDate(fridayEvening);
      expect(result.isNextWeek).toBe(true);
      expect(result.dateString).toBe("2026-01-24");
    });
  });

  describe("getTimeUntilCutoff", () => {
    it("returns hours and minutes before cutoff", () => {
      const fridayMorning = makePtDate("2026-01-16T10:15:00");
      const result = getTimeUntilCutoff(fridayMorning);
      expect(result.isPastCutoff).toBe(false);
      expect(result.hours).toBeGreaterThan(0);
    });
  });

  describe("getCutoffForSaturday", () => {
    it("returns Friday at 3pm PT", () => {
      const saturday = makePtDate("2026-01-17T00:00:00");
      const cutoff = getCutoffForSaturday(saturday);
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
});
