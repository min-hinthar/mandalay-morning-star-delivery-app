import type { TimeWindow } from "@/types/delivery";

/**
 * Generate 1-hour delivery time windows from startHour to endHour (exclusive).
 * Produces the same format as the existing TIME_WINDOWS constant.
 *
 * @param prepTimeBufferMinutes - If > 0, shifts the effective start hour forward
 *   to account for meal prep time (e.g., 30 min buffer with 11 AM start -> 12 PM first window).
 */
export function generateTimeWindows(
  startHour: number,
  endHour: number,
  prepTimeBufferMinutes: number = 0
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  let effectiveStartHour = startHour;
  if (prepTimeBufferMinutes > 0) {
    const effectiveStartMinutes = startHour * 60 + prepTimeBufferMinutes;
    effectiveStartHour = Math.ceil(effectiveStartMinutes / 60);
    if (effectiveStartHour >= endHour) return windows;
  }

  for (let hour = effectiveStartHour; hour < endHour; hour++) {
    const nextHour = hour + 1;
    windows.push({
      start: formatTime24(hour),
      end: formatTime24(nextHour),
      label: `${formatTime12(hour)} - ${formatTime12(nextHour)}`,
    });
  }

  return windows;
}

/** Format hour as HH:MM (24-hour) */
function formatTime24(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/** Format hour as h:MM AM/PM (12-hour) */
function formatTime12(hour: number): string {
  const h24 = hour % 24;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:00 ${period}`;
}
