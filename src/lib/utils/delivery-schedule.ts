import type { DeliveryDayConfig } from "@/types/delivery";

export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Format active delivery days: "Mon, Wed, Thu & Sat" */
export function formatDeliveryDaysList(days: DeliveryDayConfig[]): string {
  const active = days.filter((d) => d.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  if (active.length === 0) return "No delivery days";

  const names = active.map((d) => DAY_NAMES_SHORT[d.dayOfWeek]);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;

  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Format hour as "3 PM", "12 AM", etc. */
export function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour} ${ampm}`;
}

/**
 * Get next cutoff text for nearest open delivery window.
 * e.g. "Order by Tuesday 3 PM for Wednesday delivery"
 *
 * @param nextDeliveryDayOfWeek - day-of-week of next open delivery (from getNextDeliveryDate or getTimeUntilNextCutoff)
 * @param days - all delivery day configs
 */
export function getNextCutoffText(
  nextDeliveryDayOfWeek: number,
  days: DeliveryDayConfig[]
): string {
  const config = days.find((d) => d.isActive && d.dayOfWeek === nextDeliveryDayOfWeek);
  if (!config) return "No upcoming delivery windows";

  const cutoffDayName = DAY_NAMES_FULL[config.cutoffDay];
  const deliveryDayName = DAY_NAMES_FULL[config.dayOfWeek];
  return `Order by ${cutoffDayName} ${formatHour(config.cutoffHour)} for ${deliveryDayName} delivery`;
}

/**
 * Get delivery schedule summary for display.
 * e.g. "Delivery on Mon, Wed, Thu & Sat"
 */
export function getDeliveryScheduleSummary(days: DeliveryDayConfig[]): string {
  const list = formatDeliveryDaysList(days);
  if (list === "No delivery days") return list;
  return `Delivery on ${list}`;
}
