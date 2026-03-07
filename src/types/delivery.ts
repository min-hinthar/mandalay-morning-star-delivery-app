export interface TimeWindow {
  start: string;
  end: string;
  label: string;
}

export interface DeliveryDate {
  date: Date;
  dateString: string;
  displayDate: string;
  isNextWeek: boolean;
  cutoffPassed: boolean;
}

export interface DeliverySelection {
  date: string;
  windowStart: string;
  windowEnd: string;
}

export const TIMEZONE = process.env.DELIVERY_TIMEZONE || "America/Los_Angeles";

/**
 * Per-day delivery configuration from the `delivery_days` table.
 * Each active day has its own cutoff timing and delivery fee.
 */
export interface DeliveryDayConfig {
  id: string;
  dayOfWeek: number; // 0=Sunday..6=Saturday
  isActive: boolean;
  cutoffDay: number; // 0=Sunday..6=Saturday
  cutoffHour: number; // 0-23
  deliveryFeeCents: number;
  displayOrder: number;
}
