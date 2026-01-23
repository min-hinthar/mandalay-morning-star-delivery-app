import {
  CUTOFF_HOUR,
  TIMEZONE,
  type DeliveryDate,
} from "@/types/delivery";

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

function zonedTimeToUtc(parts: Partial<ZonedParts> & Pick<ZonedParts, "year" | "month" | "day">): Date {
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

function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return zonedTimeToUtc({ year, month, day });
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
 * Get the cutoff time (Friday 15:00 PT) for a given Saturday.
 */
export function getCutoffForSaturday(saturday: Date): Date {
  const { year, month, day } = getZonedParts(saturday);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  utcDate.setUTCDate(utcDate.getUTCDate() - 1);

  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: CUTOFF_HOUR,
    minute: 0,
    second: 0,
  });
}

/**
 * Check if we're past the cutoff for this Saturday.
 */
export function isPastCutoff(
  saturday: Date,
  now: Date = new Date()
): boolean {
  const cutoff = getCutoffForSaturday(saturday);
  return now.getTime() > cutoff.getTime();
}

/**
 * Get the delivery date info.
 */
export function getDeliveryDate(now: Date = new Date()): DeliveryDate {
  const thisSaturday = getNextSaturday(now);
  const pastCutoff = isPastCutoff(thisSaturday, now);
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
  now: Date = new Date()
): {
  hours: number;
  minutes: number;
  isPastCutoff: boolean;
} {
  const thisSaturday = getNextSaturday(now);
  const cutoff = getCutoffForSaturday(thisSaturday);
  const diffMs = cutoff.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isPastCutoff: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPastCutoff: false };
}

/**
 * Check if an order can still be edited (before cutoff).
 */
export function canEditOrder(scheduledDate: string): boolean {
  const saturday = parseDateString(scheduledDate);
  return !isPastCutoff(saturday);
}

/**
 * Get array of available delivery dates (next 3 Saturdays).
 * Used by TimeStepV8 component for date selection.
 */
export function getAvailableDeliveryDates(
  now: Date = new Date(),
  count: number = 3
): DeliveryDate[] {
  const dates: DeliveryDate[] = [];
  let saturday = getNextSaturday(now);

  for (let i = 0; i < count; i++) {
    const pastCutoff = isPastCutoff(saturday, now);
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
