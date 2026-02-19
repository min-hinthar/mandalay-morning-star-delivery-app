/**
 * Driver Availability Helpers
 * Shared constants and utilities for driver availability scheduling.
 */

import type { DayOfWeek, DriverAvailability } from "@/types/driver";

export type { DayOfWeek, DriverAvailability };

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** Map JS Date.getUTCDay() (0=Sunday) to DayOfWeek */
const UTC_DAY_MAP: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Check if a driver is available on a given date.
 *
 * Returns true if:
 * - availability is null (no preferences set = available all days)
 * - available_days is empty (no day restrictions = available all days)
 * - the date's day-of-week is in available_days AND not in blocked_dates
 *
 * @param availability - Driver's availability preferences (null = available all days)
 * @param date - ISO date string "YYYY-MM-DD"
 */
export function isDriverAvailable(
  availability: DriverAvailability | null,
  date: string
): boolean {
  if (!availability || availability.available_days.length === 0) {
    // No preferences set — check blocked dates only
    if (availability?.blocked_dates?.includes(date)) {
      return false;
    }
    return true;
  }

  // Check blocked dates first
  if (availability.blocked_dates.includes(date)) {
    return false;
  }

  // Get day-of-week from date (use noon UTC to avoid timezone shifts)
  const utcDay = new Date(date + "T12:00:00Z").getUTCDay();
  const dayOfWeek = UTC_DAY_MAP[utcDay];

  return availability.available_days.includes(dayOfWeek);
}
