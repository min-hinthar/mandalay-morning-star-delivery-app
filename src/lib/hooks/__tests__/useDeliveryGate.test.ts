import { describe, expect, it } from "vitest";
import { computeDeliveryGate } from "../useDeliveryGate";
import { getZonedDateString } from "@/lib/utils/delivery-dates";

// All tests use cutoffDay=5 (Friday), cutoffHour=15 (3 PM PT)
// Delivery date is always the next Saturday in LA time

// Wednesday, March 4 2026 10:00 AM PT — well before Friday cutoff
const WEDNESDAY_10AM = new Date("2026-03-04T18:00:00.000Z"); // 10 AM PT (UTC-8 in winter)

// Friday, March 6 2026 1:00 PM PT — 2h before cutoff, in warning zone
const FRIDAY_1PM = new Date("2026-03-06T21:00:00.000Z"); // 1 PM PT

// Friday, March 6 2026 2:45 PM PT — 15m before cutoff, critical
const FRIDAY_2_45PM = new Date("2026-03-06T22:45:00.000Z"); // 2:45 PM PT

// Friday, March 6 2026 4:00 PM PT — 1h past cutoff
const FRIDAY_4PM = new Date("2026-03-07T00:00:00.000Z"); // 4 PM PT

// This Saturday: March 7, 2026
// Next Saturday: March 14, 2026

describe("computeDeliveryGate", () => {
  describe("isOpen state", () => {
    it("returns isOpen: true when well before cutoff (Wednesday 10AM)", () => {
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.isOpen).toBe(true);
    });

    it("returns isOpen: true when in warning zone (Friday 1PM)", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_1PM);
      expect(result.isOpen).toBe(true);
    });

    it("returns isOpen: true when in critical zone (Friday 2:45PM)", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_2_45PM);
      expect(result.isOpen).toBe(true);
    });

    it("returns isOpen: false when past cutoff (Friday 4PM)", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_4PM);
      expect(result.isOpen).toBe(false);
    });
  });

  describe("urgency thresholds", () => {
    it("returns urgency 'normal' when more than 2h before cutoff", () => {
      // Wednesday 10AM: cutoff is Friday 3PM, ~53h away
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.urgency).toBe("normal");
    });

    it("returns urgency 'warning' when <=2h before cutoff (Friday 1PM = exactly 2h)", () => {
      // Friday 1PM: 2h until 3PM cutoff
      const result = computeDeliveryGate(5, 15, FRIDAY_1PM);
      expect(result.urgency).toBe("warning");
    });

    it("returns urgency 'critical' when <=30m before cutoff (Friday 2:45PM = 15m)", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_2_45PM);
      expect(result.urgency).toBe("critical");
    });

    it("returns urgency 'critical' when past cutoff", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_4PM);
      expect(result.urgency).toBe("critical");
    });
  });

  describe("deliveryDate", () => {
    it("points to this Saturday when gate is open", () => {
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.deliveryDate.isNextWeek).toBe(false);
      expect(result.deliveryDate.cutoffPassed).toBe(false);
      // Should be Saturday March 7, 2026
      expect(result.deliveryDate.displayDate).toContain("March 7");
    });

    it("points to next Saturday when gate is closed (past cutoff)", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_4PM);
      expect(result.deliveryDate.isNextWeek).toBe(true);
      expect(result.deliveryDate.cutoffPassed).toBe(true);
      // Should be Saturday March 14, 2026
      expect(result.deliveryDate.displayDate).toContain("March 14");
    });
  });

  describe("timeUntilCutoff", () => {
    it("returns isPastCutoff: false when before cutoff", () => {
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.timeUntilCutoff.isPastCutoff).toBe(false);
    });

    it("returns isPastCutoff: true when past cutoff", () => {
      const result = computeDeliveryGate(5, 15, FRIDAY_4PM);
      expect(result.timeUntilCutoff.isPastCutoff).toBe(true);
    });

    it("returns approximate hours/minutes remaining when open", () => {
      // Friday 1PM: 2h until 3PM
      const result = computeDeliveryGate(5, 15, FRIDAY_1PM);
      expect(result.timeUntilCutoff.hours).toBe(2);
      expect(result.timeUntilCutoff.minutes).toBe(0);
    });
  });

  describe("cutoffDate", () => {
    it("returns a Date object for the cutoff", () => {
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.cutoffDate).toBeInstanceOf(Date);
    });

    it("cutoffDate is before deliveryDate", () => {
      const result = computeDeliveryGate(5, 15, WEDNESDAY_10AM);
      expect(result.cutoffDate.getTime()).toBeLessThan(result.deliveryDate.date.getTime());
    });
  });
});

// ---------------------------------------------------------------------------
// Date-string zoning
// ---------------------------------------------------------------------------

describe("deliveryDate.dateString zoning", () => {
  // The gate used to build this string with browser-local
  // getFullYear/getMonth/getDate. The dates it formats are LA-MIDNIGHT instants
  // (07:00/08:00 UTC), so any browser west of LA — Hawaii (UTC-10), Alaska in
  // winter — read them as the PREVIOUS calendar day. Verified by running this
  // file under TZ=Pacific/Honolulu before the fix: dateString came back
  // "2026-08-07" while displayDate said "Saturday, August 8".
  //
  // That string is NOT display-only: useTimeSlot feeds it straight into the
  // delivery SELECTION (so a Honolulu customer would have submitted a Friday),
  // and the checkout submit gate + the menu banner's headline check compare it
  // against LA-zoned strings.
  //
  // NOTE: CI runs in UTC, where the pre-fix and post-fix values coincide (an
  // LA-midnight instant lands on the same UTC calendar day) — so this test
  // cannot reproduce the failure on its own. It pins the CONTRACT instead: the
  // gate's dateString must be exactly what the shared LA-zoned formatter
  // produces for the same instant. Re-run with TZ=Pacific/Honolulu to see the
  // real failure.
  it("matches the shared LA-zoned formatter for the same instant", () => {
    for (const now of [WEDNESDAY_10AM, FRIDAY_1PM, FRIDAY_4PM]) {
      const { deliveryDate } = computeDeliveryGate(5, 15, now);
      expect(deliveryDate.dateString).toBe(getZonedDateString(deliveryDate.date));
    }
  });

  it("never disagrees with its own displayDate about the day", () => {
    const { deliveryDate } = computeDeliveryGate(5, 15, FRIDAY_4PM);
    const dayFromDisplay = Number(deliveryDate.displayDate.match(/(\d+)$/)![1]);
    expect(Number(deliveryDate.dateString.split("-")[2])).toBe(dayFromDisplay);
  });
});
