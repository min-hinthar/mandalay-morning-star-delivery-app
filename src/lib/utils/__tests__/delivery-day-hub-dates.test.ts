import { describe, expect, it } from "vitest";
import { TIMEZONE } from "@/types/delivery";
import {
  getZonedDateString,
  parseDeliveryDateToUtc,
  getZonedDayRangeUtc,
  getZonedDateTimeUtc,
  getCutoffForDate,
  formatDeliveryDateString,
} from "../delivery-dates";

const laParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hour12: false,
});

function la(date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of laParts.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

describe("Delivery Day hub date helpers", () => {
  it("parseDeliveryDateToUtc maps to LA-local midnight", () => {
    const p = la(parseDeliveryDateToUtc("2026-03-21"));
    expect(`${p.year}-${p.month}-${p.day}`).toBe("2026-03-21");
    expect(p.hour).toBe("00");
    expect(p.minute).toBe("00");
  });

  it("getZonedDayRangeUtc spans one LA calendar day", () => {
    const { startUtc, endUtc } = getZonedDayRangeUtc("2026-03-21");
    // Non-DST-transition day → exactly 24h
    expect(new Date(endUtc).getTime() - new Date(startUtc).getTime()).toBe(24 * 60 * 60 * 1000);
    expect(la(new Date(startUtc)).day).toBe("21");
    expect(la(new Date(endUtc)).day).toBe("22");
  });

  it("getZonedDateTimeUtc sets the LA-local hour", () => {
    const p = la(getZonedDateTimeUtc("2026-03-21", 9));
    expect(p.day).toBe("21");
    expect(p.hour).toBe("09");
  });

  it("getCutoffForDate resolves the prior cutoff weekday at the cutoff hour", () => {
    // Delivery Sat 2026-03-21, cutoff Friday (5) at 15:00 → Fri 2026-03-20 15:00 LA
    const p = la(getCutoffForDate("2026-03-21", 5, 15));
    expect(p.weekday).toBe("Fri");
    expect(p.day).toBe("20");
    expect(p.hour).toBe("15");
  });

  it("getZonedDateString round-trips a known LA instant", () => {
    // 2026-03-21 12:00 LA → date string 2026-03-21
    expect(getZonedDateString(getZonedDateTimeUtc("2026-03-21", 12))).toBe("2026-03-21");
  });

  it("formatDeliveryDateString includes the weekday", () => {
    expect(formatDeliveryDateString("2026-03-21")).toContain("Saturday");
  });
});
