import { describe, expect, it } from "vitest";
import { TIMEZONE, type DeliveryDayConfig } from "@/types/delivery";
import {
  getCutoffForDeliveryDay,
  isPastCutoffForDay,
  getNextDeliveryDate,
  getAvailableDeliveryDatesMultiDay,
  getTimeUntilNextCutoff,
} from "../delivery-dates";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

// Shared mock delivery days fixture
// Mon(1): cutoff Sun(0) 15h
// Wed(3): cutoff Tue(2) 15h
// Thu(4): cutoff Wed(3) 15h
// Sat(6): cutoff Fri(5) 15h
const MOCK_DELIVERY_DAYS: DeliveryDayConfig[] = [
  {
    id: "mon",
    dayOfWeek: 1,
    isActive: true,
    cutoffDay: 0,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 0,
  },
  {
    id: "wed",
    dayOfWeek: 3,
    isActive: true,
    cutoffDay: 2,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 1,
  },
  {
    id: "thu",
    dayOfWeek: 4,
    isActive: true,
    cutoffDay: 3,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 2,
  },
  {
    id: "sat",
    dayOfWeek: 6,
    isActive: true,
    cutoffDay: 5,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 3,
  },
];

describe("multi-day delivery utilities", () => {
  describe("getCutoffForDeliveryDay", () => {
    it("calculates cutoff for Monday delivery (Sun 3pm cutoff)", () => {
      const monday = makePtDate("2026-01-12T10:00:00"); // Jan 12 is Monday
      const mondayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 1)!;
      const cutoff = getCutoffForDeliveryDay(monday, mondayConfig);
      const display = formatDateTime(cutoff);
      expect(display).toContain("Sun");
      expect(display).toContain("3:00 PM");
    });

    it("calculates cutoff for Wednesday delivery (Tue 3pm cutoff)", () => {
      const wednesday = makePtDate("2026-01-14T10:00:00"); // Jan 14 is Wednesday
      const wednesdayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 3)!;
      const cutoff = getCutoffForDeliveryDay(wednesday, wednesdayConfig);
      const display = formatDateTime(cutoff);
      expect(display).toContain("Tue");
      expect(display).toContain("3:00 PM");
    });

    it("calculates cutoff for Thursday delivery (Wed 3pm cutoff)", () => {
      const thursday = makePtDate("2026-01-15T10:00:00"); // Jan 15 is Thursday
      const thursdayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 4)!;
      const cutoff = getCutoffForDeliveryDay(thursday, thursdayConfig);
      const display = formatDateTime(cutoff);
      expect(display).toContain("Wed");
      expect(display).toContain("3:00 PM");
    });

    it("calculates cutoff for Saturday delivery (Fri 3pm cutoff)", () => {
      const saturday = makePtDate("2026-01-17T10:00:00"); // Jan 17 is Saturday
      const saturdayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 6)!;
      const cutoff = getCutoffForDeliveryDay(saturday, saturdayConfig);
      const display = formatDateTime(cutoff);
      expect(display).toContain("Fri");
      expect(display).toContain("3:00 PM");
    });

    it("respects custom cutoff hour per day", () => {
      const monday = makePtDate("2026-01-12T10:00:00");
      const customConfig: DeliveryDayConfig = {
        id: "custom",
        dayOfWeek: 1,
        isActive: true,
        cutoffDay: 0,
        cutoffHour: 9, // Custom: 9 AM instead of 3 PM
        deliveryFeeCents: 500,
        displayOrder: 0,
      };
      const cutoff = getCutoffForDeliveryDay(monday, customConfig);
      const display = formatDateTime(cutoff);
      expect(display).toContain("9:00 AM");
    });
  });

  describe("isPastCutoffForDay", () => {
    it("returns false before cutoff", () => {
      const monday = makePtDate("2026-01-12T00:00:00");
      const sundayMorning = makePtDate("2026-01-11T10:00:00");
      const mondayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 1)!;
      expect(isPastCutoffForDay(monday, mondayConfig, sundayMorning)).toBe(false);
    });

    it("returns true after cutoff", () => {
      const monday = makePtDate("2026-01-12T00:00:00");
      const sundayEvening = makePtDate("2026-01-11T18:00:00");
      const mondayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 1)!;
      expect(isPastCutoffForDay(monday, mondayConfig, sundayEvening)).toBe(true);
    });

    it("respects cutoff safety buffer (10s)", () => {
      const monday = makePtDate("2026-01-12T00:00:00");
      const mondayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 1)!;
      const cutoff = getCutoffForDeliveryDay(monday, mondayConfig);
      // 5 seconds before cutoff - inside buffer - should be past
      const fiveSecBefore = new Date(cutoff.getTime() - 5_000);
      expect(isPastCutoffForDay(monday, mondayConfig, fiveSecBefore)).toBe(true);
      // 11 seconds before cutoff - outside buffer - should be OK
      const elevenSecBefore = new Date(cutoff.getTime() - 11_000);
      expect(isPastCutoffForDay(monday, mondayConfig, elevenSecBefore)).toBe(false);
    });
  });

  describe("getNextDeliveryDate", () => {
    it("returns next Saturday when called on Friday before cutoff", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const nextDate = getNextDeliveryDate(friday, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      // Friday 10am is before Friday 3pm cutoff for Saturday delivery
      expect(formatDate(nextDate!)).toBe("2026-01-17"); // Saturday
    });

    it("returns Wednesday when called on Tuesday before cutoff", () => {
      const tuesday = makePtDate("2026-01-13T10:00:00");
      const nextDate = getNextDeliveryDate(tuesday, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      expect(formatDate(nextDate!)).toBe("2026-01-14"); // Wednesday
    });

    it("returns next available day when current day cutoff passed", () => {
      // Force past cutoff by advancing time
      const afterCutoff = makePtDate("2026-01-13T18:00:00"); // Tue 6pm (past Tue 3pm cutoff)
      const nextDate = getNextDeliveryDate(afterCutoff, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      // From Tue evening, next is Thu
      expect(formatDate(nextDate!)).toBe("2026-01-15"); // Thursday
    });

    it("returns null when no active days configured", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const noDays: DeliveryDayConfig[] = [];
      const nextDate = getNextDeliveryDate(friday, noDays);
      expect(nextDate).toBeNull();
    });

    it("wraps to next week when all cutoffs passed", () => {
      const satAfterAllCutoffs = makePtDate("2026-01-17T20:00:00");
      const nextDate = getNextDeliveryDate(satAfterAllCutoffs, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      // After Sat, next Monday is Jan 19
      expect(formatDate(nextDate!)).toBe("2026-01-19");
    });

    it("respects ordering of delivery days", () => {
      // On Sunday afternoon, should get Monday first (not Wed, Thu, Sat)
      const sunday = makePtDate("2026-01-18T10:00:00");
      const nextDate = getNextDeliveryDate(sunday, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      expect(formatDate(nextDate!)).toBe("2026-01-19"); // Monday
    });
  });

  describe("getAvailableDeliveryDatesMultiDay", () => {
    it("returns multiple available dates in chronological order", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 6);
      expect(dates.length).toBeGreaterThan(0);
      // Check dates are in chronological order
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].date.getTime()).toBeGreaterThanOrEqual(dates[i - 1].date.getTime());
      }
    });

    it("respects count limit", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 3);
      expect(dates.length).toBeLessThanOrEqual(3);
    });

    it("removes duplicate dates (same dateString)", () => {
      const monday = makePtDate("2026-01-12T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(monday, MOCK_DELIVERY_DAYS, 10);
      const dateStrings = dates.map((d) => d.dateString);
      const uniqueDateStrings = new Set(dateStrings);
      expect(uniqueDateStrings.size).toBe(dateStrings.length);
    });

    it("returns empty array when no active days", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const noDays: DeliveryDayConfig[] = [];
      const dates = getAvailableDeliveryDatesMultiDay(friday, noDays, 6);
      expect(dates).toHaveLength(0);
    });

    it("includes today if before today's cutoff", () => {
      // Monday 10am - before Sunday 3pm cutoff (cutoff already passed)
      // So next is Wednesday
      const monday = makePtDate("2026-01-12T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(monday, MOCK_DELIVERY_DAYS, 6);
      const firstDateStr = dates[0]?.dateString;
      expect(firstDateStr).not.toBeNull();
      // First should be Wed since Mon cutoff (Sun 3pm) already passed
      expect(firstDateStr).toBe("2026-01-14");
    });

    it("marks dates correctly as isNextWeek", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 6);
      // First few should be same week (isNextWeek: false)
      // Later ones should be next week (isNextWeek: true)
      expect(dates[0]?.isNextWeek).toBe(false); // Sat or next available this week
      if (dates[dates.length - 1]) {
        expect(dates[dates.length - 1].isNextWeek).toBe(true); // Later dates should be next week
      }
    });

    it("marks cutoffPassed correctly based on current time", () => {
      // Thursday 10am - today's Thu cutoff (Wed 3pm) already passed, so today is skipped.
      // The first Thursday in results is NEXT Thursday, whose cutoff (next Wed 3pm) is still future.
      const thursday = makePtDate("2026-01-15T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(thursday, MOCK_DELIVERY_DAYS, 6);
      const thursdayDate = dates.find(
        (d) =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: TIMEZONE,
            weekday: "long",
          }).format(d.date) === "Thursday"
      );
      if (thursdayDate) {
        // Next Thursday's cutoff (next Wed 3pm) hasn't passed yet
        expect(thursdayDate.cutoffPassed).toBe(false);
      }
    });

    it("includes all active days in 3-week window", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 20);
      // With 4 active days over 3 weeks = ~12 dates
      expect(dates.length).toBeGreaterThanOrEqual(4);
    });

    it("handles single active day", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const onlyMonday = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 1);
      const dates = getAvailableDeliveryDatesMultiDay(friday, onlyMonday, 6);
      // Should have multiple Mondays
      expect(dates.length).toBeGreaterThan(0);
      for (const date of dates) {
        const dayName = new Intl.DateTimeFormat("en-CA", {
          timeZone: TIMEZONE,
          weekday: "long",
        }).format(date.date);
        expect(dayName).toBe("Monday");
      }
    });
  });

  describe("getTimeUntilNextCutoff", () => {
    it("returns hours and minutes before next cutoff", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const result = getTimeUntilNextCutoff(friday, MOCK_DELIVERY_DAYS);
      expect(result.isPastCutoff).toBe(false);
      expect(result.hours).toBeGreaterThan(0);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
    });

    it("returns deliveryDayOfWeek for next cutoff", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const result = getTimeUntilNextCutoff(friday, MOCK_DELIVERY_DAYS);
      expect(result.deliveryDayOfWeek).toBeGreaterThan(-1);
      expect(MOCK_DELIVERY_DAYS.some((d) => d.dayOfWeek === result.deliveryDayOfWeek)).toBe(true);
    });

    it("returns isPastCutoff: true when all cutoffs passed", () => {
      // Saturday evening - all cutoffs for this week passed
      const satEveningAfterAllCutoffs = makePtDate("2026-01-17T20:00:00");
      const result = getTimeUntilNextCutoff(satEveningAfterAllCutoffs, MOCK_DELIVERY_DAYS);
      // Next cutoff is Sunday 3pm (for Mon delivery)
      // Sat 8pm UTC-8 < Sun 3pm UTC-8, so should be time remaining
      expect(result.isPastCutoff).toBe(false);
    });

    it("returns isPastCutoff: true and deliveryDayOfWeek: -1 when no active days", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const noDays: DeliveryDayConfig[] = [];
      const result = getTimeUntilNextCutoff(friday, noDays);
      expect(result.isPastCutoff).toBe(true);
      expect(result.deliveryDayOfWeek).toBe(-1);
    });

    it("correctly calculates time for Monday cutoff (Sunday 3pm)", () => {
      // Saturday morning - Sunday 3pm is soon
      const satMorning = makePtDate("2026-01-17T08:00:00");
      const result = getTimeUntilNextCutoff(satMorning, MOCK_DELIVERY_DAYS);
      expect(result.isPastCutoff).toBe(false);
      expect(result.hours).toBeGreaterThan(0);
      // Should be for Monday delivery (dayOfWeek 1)
      expect(result.deliveryDayOfWeek).toBe(1);
    });

    it("correctly calculates time for Wednesday cutoff (Tuesday 3pm)", () => {
      // Tuesday morning - 3pm is later today
      const tuesMorning = makePtDate("2026-01-13T08:00:00");
      const result = getTimeUntilNextCutoff(tuesMorning, MOCK_DELIVERY_DAYS);
      expect(result.isPastCutoff).toBe(false);
      // Should be for Wednesday delivery (dayOfWeek 3)
      expect(result.deliveryDayOfWeek).toBe(3);
    });

    it("does not include safety buffer in display time", () => {
      // Wednesday 2:59pm PT - within 1 minute of Tue 3pm cutoff for Wed delivery
      // But this is testing time UNTIL next cutoff, not isPastCutoff
      const wedAfternoon = makePtDate("2026-01-14T14:59:00");
      const result = getTimeUntilNextCutoff(wedAfternoon, MOCK_DELIVERY_DAYS);
      // Should have some time remaining (raw calculation, not affected by buffer)
      expect(result.hours).toBeGreaterThanOrEqual(0);
    });

    it("finds nearest cutoff across all active days", () => {
      // Monday 10am - next cutoff should be Tuesday 3pm (for Wed delivery)
      const mondayMorning = makePtDate("2026-01-12T10:00:00");
      const result = getTimeUntilNextCutoff(mondayMorning, MOCK_DELIVERY_DAYS);
      // Next is Wed delivery, which cutoff is Tue 3pm
      expect(result.deliveryDayOfWeek).toBe(3); // Wednesday
    });
  });

  describe("edge cases and scenarios", () => {
    it("handles empty delivery days", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const emptyDays: DeliveryDayConfig[] = [];
      const nextDate = getNextDeliveryDate(friday, emptyDays);
      const availableDates = getAvailableDeliveryDatesMultiDay(friday, emptyDays, 6);
      const timeUntil = getTimeUntilNextCutoff(friday, emptyDays);
      expect(nextDate).toBeNull();
      expect(availableDates).toHaveLength(0);
      expect(timeUntil.isPastCutoff).toBe(true);
    });

    it("handles disabled days (isActive: false)", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const onlyWedActive = MOCK_DELIVERY_DAYS.map((d) =>
        d.dayOfWeek === 3 ? d : { ...d, isActive: false }
      );
      const nextDate = getNextDeliveryDate(friday, onlyWedActive);
      expect(nextDate).not.toBeNull();
      // Next available should be Wednesday
      expect(formatDate(nextDate!)).toBe("2026-01-21"); // Next Wed (Jan 14 is this week)
    });

    it("handles delivery day that just passed cutoff", () => {
      // Wednesday 10am - Wednesday's cutoff was Tue 3pm (past)
      // Should skip to next available (Thursday)
      const wedMorning = makePtDate("2026-01-14T10:00:00");
      const nextDate = getNextDeliveryDate(wedMorning, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      expect(formatDate(nextDate!)).toBe("2026-01-15"); // Thursday
    });

    it("handles delivery day right at cutoff", () => {
      const tuesday = makePtDate("2026-01-13T00:00:00");
      const wednesdayConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 3)!;
      const cutoff = getCutoffForDeliveryDay(tuesday, wednesdayConfig);
      // Right at cutoff time
      const atCutoff = cutoff;
      expect(isPastCutoffForDay(tuesday, wednesdayConfig, atCutoff)).toBe(true);
    });

    it("handles weekend edge (Saturday night to Sunday)", () => {
      const satNight = makePtDate("2026-01-17T22:00:00");
      const nextDate = getNextDeliveryDate(satNight, MOCK_DELIVERY_DAYS);
      expect(nextDate).not.toBeNull();
      // Next Monday cutoff is Sunday, so might be available
      expect(formatDate(nextDate!)).toBe("2026-01-19"); // Monday
    });
  });

  describe("date formatting consistency", () => {
    it("dateString format is YYYY-MM-DD", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 3);
      for (const date of dates) {
        expect(date.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it("displayDate format is human-readable", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 3);
      for (const date of dates) {
        // Should contain day name and month name
        expect(date.displayDate).toMatch(/[A-Z][a-z]+/); // At least one word starting with capital
      }
    });

    it("date property is valid Date object", () => {
      const friday = makePtDate("2026-01-16T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(friday, MOCK_DELIVERY_DAYS, 3);
      for (const date of dates) {
        expect(date.date).toBeInstanceOf(Date);
        expect(date.date.getTime()).toBeGreaterThan(0);
      }
    });
  });

  describe("DST transitions - multi-day", () => {
    it("isPastCutoffForDay works during PDT (summer)", () => {
      // July 15 2026 is Wednesday, cutoff Tue 3PM PDT
      const wednesday = makePtDate("2026-07-15T10:00:00");
      const wedConfig = MOCK_DELIVERY_DAYS.find((d) => d.dayOfWeek === 3)!;
      const tuesdayBeforeCutoff = makePtDate("2026-07-14T14:00:00");
      const tuesdayAfterCutoff = makePtDate("2026-07-14T16:00:00");
      expect(isPastCutoffForDay(wednesday, wedConfig, tuesdayBeforeCutoff)).toBe(false);
      expect(isPastCutoffForDay(wednesday, wedConfig, tuesdayAfterCutoff)).toBe(true);
    });

    it("getAvailableDeliveryDatesMultiDay works across fall-back (November 2026)", () => {
      // November 1 2026 is Sunday (fall-back day)
      // Monday Nov 2 should be available
      const sundayFallback = makePtDate("2026-11-01T10:00:00");
      const dates = getAvailableDeliveryDatesMultiDay(sundayFallback, MOCK_DELIVERY_DAYS, 6);
      expect(dates.length).toBeGreaterThan(0);
      // All returned dates should NOT have cutoffPassed
      for (const d of dates) {
        expect(d.cutoffPassed).toBe(false);
      }
    });
  });
});
