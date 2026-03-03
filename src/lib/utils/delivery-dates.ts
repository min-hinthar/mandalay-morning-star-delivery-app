import { TIMEZONE, type DeliveryDate } from "@/types/delivery";

/** Default cutoff values — match DB seeds and BUSINESS_RULES_DEFAULTS */
const DEFAULT_CUTOFF_DAY = 5; // Friday
const DEFAULT_CUTOFF_HOUR = 15; // 3 PM

/** BUG-07 FIX: Safety buffer in ms — reject orders this close to cutoff
 * to prevent DB-latency edge case where order is accepted but DB insert
 * completes after the real cutoff. Buffer is invisible to customers. */
const CUTOFF_SAFETY_BUFFER_MS = 10_000; // 10 seconds

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  timeZoneName: "shortOffset",
});

function getZonedParts(date: Date): ZonedParts {
  const parts = DATE_PARTS_FORMATTER.formatToParts(date);
  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffsetMinutes(date: Date): number {
  const parts = OFFSET_FORMATTER.formatToParts(date);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const sign = hours >= 0 ? 1 : -1;

  return hours * 60 + sign * minutes;
}

function zonedTimeToUtc(
  parts: Partial<ZonedParts> & Pick<ZonedParts, "year" | "month" | "day">
): Date {
  const utcDate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour ?? 0,
      parts.minute ?? 0,
      parts.second ?? 0
    )
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(utcDate);
  return new Date(utcDate.getTime() - offsetMinutes * 60 * 1000);
}

function addZonedDays(date: Date, days: number): Date {
  const { year, month, day } = getZonedParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);

  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  });
}

function formatDateString(date: Date): string {
  const { year, month, day } = getZonedParts(date);
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

/**
 * Get the next Saturday for delivery.
 */
export function getNextSaturday(from: Date = new Date()): Date {
  const { year, month, day } = getZonedParts(from);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utcDate.getUTCDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + daysUntilSaturday);

  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  });
}

/**
 * Get the cutoff time for a given Saturday.
 * @param cutoffDay day-of-week (0=Sun, 5=Fri, 6=Sat) — defaults to Friday
 * @param cutoffHour hour in TIMEZONE (0-23) — defaults to 15 (3 PM)
 */
export function getCutoffForSaturday(
  saturday: Date,
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): Date {
  const { year, month, day } = getZonedParts(saturday);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  // cutoffDay is day-of-week (5 = Friday). Saturday is 6.
  const daysBeforeSaturday = 6 - cutoffDay;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysBeforeSaturday);

  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: cutoffHour,
    minute: 0,
    second: 0,
  });
}

/**
 * Check if we're past the cutoff for this Saturday.
 */
export function isPastCutoff(
  saturday: Date,
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): boolean {
  const cutoff = getCutoffForSaturday(saturday, cutoffDay, cutoffHour);
  // BUG-07 FIX: 10-second safety buffer prevents DB-latency edge case.
  // Orders submitted within buffer are rejected (same message as normal cutoff).
  return now.getTime() > cutoff.getTime() - CUTOFF_SAFETY_BUFFER_MS;
}

/**
 * Get the delivery date info.
 */
export function getDeliveryDate(
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): DeliveryDate {
  const thisSaturday = getNextSaturday(now);
  const pastCutoff = isPastCutoff(thisSaturday, now, cutoffDay, cutoffHour);
  const deliveryDate = pastCutoff ? addZonedDays(thisSaturday, 7) : thisSaturday;

  return {
    date: deliveryDate,
    dateString: formatDateString(deliveryDate),
    displayDate: formatDisplayDate(deliveryDate),
    isNextWeek: pastCutoff,
    cutoffPassed: pastCutoff,
  };
}

/**
 * Get time remaining until cutoff.
 */
export function getTimeUntilCutoff(
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): {
  hours: number;
  minutes: number;
  isPastCutoff: boolean;
} {
  const thisSaturday = getNextSaturday(now);
  const cutoff = getCutoffForSaturday(thisSaturday, cutoffDay, cutoffHour);
  const diffMs = cutoff.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isPastCutoff: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPastCutoff: false };
}

/**
 * Get array of available delivery dates (next N Saturdays).
 * Used by TimeStepV8 component for date selection.
 */
export function getAvailableDeliveryDates(
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR,
  count: number = 3
): DeliveryDate[] {
  const dates: DeliveryDate[] = [];
  let saturday = getNextSaturday(now);

  for (let i = 0; i < count; i++) {
    const pastCutoff = isPastCutoff(saturday, now, cutoffDay, cutoffHour);
    const isNextWeek = i > 0 || pastCutoff;

    dates.push({
      date: saturday,
      dateString: formatDateString(saturday),
      displayDate: formatDisplayDate(saturday),
      isNextWeek,
      cutoffPassed: pastCutoff,
    });

    // Move to next Saturday
    saturday = addZonedDays(saturday, 7);
  }

  return dates;
}
