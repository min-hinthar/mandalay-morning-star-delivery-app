import type { TimeWindow } from "@/types/delivery";

/**
 * Generate 1-hour delivery time windows from startHour to endHour (exclusive).
 * Produces the same format as the existing TIME_WINDOWS constant.
 */
export function generateTimeWindows(startHour: number, endHour: number): TimeWindow[] {
  const windows: TimeWindow[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
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
