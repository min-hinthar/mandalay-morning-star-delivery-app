import {
  TIMEZONE,
  type DeliveryDate,
  type DeliveryDayConfig,
  type DeliveryDirection,
} from "@/types/delivery";

const DEFAULT_CUTOFF_DAY = 5;
const DEFAULT_CUTOFF_HOUR = 15;

export const CUTOFF_SAFETY_BUFFER_MS = 10_000;

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
    if (part.type !== "literal") values[part.type] = part.value;
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
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  return hours * 60 + (hours >= 0 ? 1 : -1) * minutes;
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
  const offset = getTimeZoneOffsetMinutes(utcDate);
  return new Date(utcDate.getTime() - offset * 60 * 1000);
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
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function getZonedDayOfWeek(date: Date): number {
  const { year, month, day } = getZonedParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getNextSaturday(from: Date = new Date()): Date {
  const { year, month, day } = getZonedParts(from);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const daysUntilSaturday = (6 - utcDate.getUTCDay() + 7) % 7 || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + daysUntilSaturday);
  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  });
}

export function getCutoffForSaturday(
  saturday: Date,
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): Date {
  const { year, month, day } = getZonedParts(saturday);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - (6 - cutoffDay));
  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: cutoffHour,
    minute: 0,
    second: 0,
  });
}

export function isPastCutoff(
  saturday: Date,
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): boolean {
  const cutoff = getCutoffForSaturday(saturday, cutoffDay, cutoffHour);
  return now.getTime() > cutoff.getTime() - CUTOFF_SAFETY_BUFFER_MS;
}

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

export function getTimeUntilCutoff(
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): { hours: number; minutes: number; isPastCutoff: boolean } {
  const cutoff = getCutoffForSaturday(getNextSaturday(now), cutoffDay, cutoffHour);
  const diffMs = cutoff.getTime() - now.getTime();
  if (diffMs <= 0) return { hours: 0, minutes: 0, isPastCutoff: true };
  return {
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    isPastCutoff: false,
  };
}

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
    dates.push({
      date: saturday,
      dateString: formatDateString(saturday),
      displayDate: formatDisplayDate(saturday),
      isNextWeek: i > 0 || pastCutoff,
      cutoffPassed: pastCutoff,
    });
    saturday = addZonedDays(saturday, 7);
  }
  return dates;
}

// Multi-day delivery support

export function getCutoffForDeliveryDay(deliveryDate: Date, dayConfig: DeliveryDayConfig): Date {
  const { year, month, day } = getZonedParts(deliveryDate);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const daysBack = (utcDate.getUTCDay() - dayConfig.cutoffDay + 7) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysBack);
  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: dayConfig.cutoffHour,
    minute: 0,
    second: 0,
  });
}

export function isPastCutoffForDay(
  deliveryDate: Date,
  dayConfig: DeliveryDayConfig,
  now: Date = new Date()
): boolean {
  const cutoff = getCutoffForDeliveryDay(deliveryDate, dayConfig);
  return now.getTime() > cutoff.getTime() - CUTOFF_SAFETY_BUFFER_MS;
}

export function getNextDeliveryDate(
  now: Date = new Date(),
  deliveryDays: DeliveryDayConfig[]
): Date | null {
  const activeDays = deliveryDays.filter((d) => d.isActive);
  if (activeDays.length === 0) return null;

  const nowDayOfWeek = getZonedDayOfWeek(now);

  // Build candidates sorted by days until delivery (closest first)
  const candidates: { daysUntil: number; day: DeliveryDayConfig }[] = [];
  for (const day of activeDays) {
    const daysUntil = (day.dayOfWeek - nowDayOfWeek + 7) % 7;
    candidates.push({ daysUntil, day });
  }
  candidates.sort((a, b) => a.daysUntil - b.daysUntil);

  for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
    for (const { daysUntil, day } of candidates) {
      if (daysUntil === 0 && weekOffset === 0) {
        if (!isPastCutoffForDay(now, day, now)) return now;
        continue;
      }
      const actualDays = (daysUntil === 0 ? 7 : daysUntil) + weekOffset * 7;
      const deliveryDate = addZonedDays(now, actualDays);
      if (!isPastCutoffForDay(deliveryDate, day, now)) return deliveryDate;
    }
  }
  return null;
}

export function getAvailableDeliveryDatesMultiDay(
  now: Date = new Date(),
  deliveryDays: DeliveryDayConfig[],
  count: number = 6,
  directions?: Exclude<DeliveryDirection, "all">[]
): DeliveryDate[] {
  let activeDays = deliveryDays.filter((d) => d.isActive);

  // Filter by direction if provided
  if (directions && directions.length > 0) {
    activeDays = activeDays.filter(
      (d) =>
        d.direction === "all" ||
        directions.includes(d.direction as Exclude<DeliveryDirection, "all">)
    );
  }
  if (activeDays.length === 0) return [];

  const nowDayOfWeek = getZonedDayOfWeek(now);
  const candidates: { date: Date; dayConfig: DeliveryDayConfig }[] = [];

  for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
    for (const day of activeDays) {
      const daysUntil = (day.dayOfWeek - nowDayOfWeek + 7) % 7;
      if (daysUntil === 0 && weekOffset === 0) {
        if (!isPastCutoffForDay(now, day, now)) candidates.push({ date: now, dayConfig: day });
      } else {
        const deliveryDate = addZonedDays(now, daysUntil + weekOffset * 7);
        candidates.push({ date: deliveryDate, dayConfig: day });
      }
    }
  }

  const seen = new Set<string>();
  const results: DeliveryDate[] = [];
  candidates
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .forEach(({ date, dayConfig }) => {
      const dateStr = formatDateString(date);
      if (seen.has(dateStr) || results.length >= count) return;
      seen.add(dateStr);
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      results.push({
        date,
        dateString: dateStr,
        displayDate: formatDisplayDate(date),
        isNextWeek: diffDays > 7,
        cutoffPassed: isPastCutoffForDay(date, dayConfig, now),
      });
    });
  return results;
}

export function getTimeUntilNextCutoff(
  now: Date = new Date(),
  deliveryDays: DeliveryDayConfig[]
): { hours: number; minutes: number; isPastCutoff: boolean; deliveryDayOfWeek: number } {
  const activeDays = deliveryDays.filter((d) => d.isActive);
  if (activeDays.length === 0)
    return { hours: 0, minutes: 0, isPastCutoff: true, deliveryDayOfWeek: -1 };

  let nearestCutoff: Date | null = null;
  let nearestDayOfWeek = -1;

  for (const day of activeDays) {
    const nextDeliveryDate = getNextDeliveryDate(now, [day]);
    if (nextDeliveryDate) {
      const cutoff = getCutoffForDeliveryDay(nextDeliveryDate, day);
      if (!nearestCutoff || cutoff.getTime() < nearestCutoff.getTime()) {
        nearestCutoff = cutoff;
        nearestDayOfWeek = day.dayOfWeek;
      }
    }
  }

  if (!nearestCutoff) return { hours: 0, minutes: 0, isPastCutoff: true, deliveryDayOfWeek: -1 };

  const diffMs = nearestCutoff.getTime() - now.getTime();
  if (diffMs <= 0)
    return { hours: 0, minutes: 0, isPastCutoff: true, deliveryDayOfWeek: nearestDayOfWeek };

  return {
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    isPastCutoff: false,
    deliveryDayOfWeek: nearestDayOfWeek,
  };
}
