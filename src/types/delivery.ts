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
