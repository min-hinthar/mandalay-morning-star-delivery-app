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

export const TIME_WINDOWS: TimeWindow[] = [
  { start: "11:00", end: "12:00", label: "11:00 AM - 12:00 PM" },
  { start: "12:00", end: "13:00", label: "12:00 PM - 1:00 PM" },
  { start: "13:00", end: "14:00", label: "1:00 PM - 2:00 PM" },
  { start: "14:00", end: "15:00", label: "2:00 PM - 3:00 PM" },
  { start: "15:00", end: "16:00", label: "3:00 PM - 4:00 PM" },
  { start: "16:00", end: "17:00", label: "4:00 PM - 5:00 PM" },
  { start: "17:00", end: "18:00", label: "5:00 PM - 6:00 PM" },
  { start: "18:00", end: "19:00", label: "6:00 PM - 7:00 PM" },
];

export const CUTOFF_DAY = 5;
export const CUTOFF_HOUR = 15;
export const TIMEZONE = "America/Los_Angeles";
