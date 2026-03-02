import { format } from "date-fns";
import type { OrderStatus, RefundStatus } from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface OpsOrder {
  id: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string;
  isAssigned: boolean;
  emailStatus: "delivered" | "failed" | "pending" | "sent" | "bounced" | "opened" | null;
  needsContact: boolean;
}

export type OpsStatusCounts = Record<OrderStatus, number>;

export interface DriverReadiness {
  id: string;
  fullName: string | null;
  vehicleType: string | null;
  ratingAvg: number;
  isAvailable: boolean;
  unavailableReason: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const BULK_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: null,
  delivered: null,
  cancelled: null,
};

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Count orders by status. Returns zero-initialized counts for all statuses.
 */
export function computeStatusCounts(orders: OpsOrder[]): OpsStatusCounts {
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as OpsStatusCounts;
  for (const order of orders) {
    counts[order.status]++;
  }
  return counts;
}

/**
 * Input shape for driver readiness derivation.
 */
export interface DriverInput {
  id: string;
  fullName: string | null;
  vehicleType: string | null;
  ratingAvg: number;
  isActive: boolean;
  availability: { available_days: string[]; blocked_dates: string[] } | null;
}

/**
 * Derive driver readiness for a given date.
 * Checks: active status -> availability set -> day match -> blocked dates.
 */
export function deriveDriverReadiness(driver: DriverInput, today: Date): DriverReadiness {
  const base: DriverReadiness = {
    id: driver.id,
    fullName: driver.fullName,
    vehicleType: driver.vehicleType,
    ratingAvg: driver.ratingAvg,
    isAvailable: false,
    unavailableReason: null,
  };

  if (!driver.isActive) {
    return { ...base, unavailableReason: "Inactive" };
  }

  if (!driver.availability) {
    return { ...base, unavailableReason: "No availability set" };
  }

  const dayName = format(today, "EEEE").toLowerCase();
  if (!driver.availability.available_days.includes(dayName)) {
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return { ...base, unavailableReason: `Not available on ${capitalizedDay}s` };
  }

  const dateStr = format(today, "yyyy-MM-dd");
  if (driver.availability.blocked_dates.includes(dateStr)) {
    return { ...base, unavailableReason: `Blocked for ${dateStr}` };
  }

  return { ...base, isAvailable: true };
}

/**
 * Group orders by delivery window start. Null windows go under "Unscheduled".
 * Keys are sorted chronologically with "Unscheduled" last.
 */
export function groupByTimeWindow(orders: OpsOrder[]): Map<string, OpsOrder[]> {
  const map = new Map<string, OpsOrder[]>();

  for (const order of orders) {
    const key = order.deliveryWindowStart ?? "Unscheduled";
    const existing = map.get(key);
    if (existing) {
      existing.push(order);
    } else {
      map.set(key, [order]);
    }
  }

  // Sort: chronological keys first, "Unscheduled" last
  const sorted = new Map<string, OpsOrder[]>();
  const keys = [...map.keys()].sort((a, b) => {
    if (a === "Unscheduled") return 1;
    if (b === "Unscheduled") return -1;
    return a.localeCompare(b);
  });

  for (const key of keys) {
    sorted.set(key, map.get(key)!);
  }

  return sorted;
}

/**
 * Compute the next occurrence of cutoffDay at cutoffHour.
 * cutoffDay: 0=Sunday..6=Saturday (matches JS getDay()).
 * If the current time is past that point this week, returns next week.
 */
export function getNextSaturday(cutoffDay: number, cutoffHour: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = cutoffDay - currentDay;

  if (daysUntil < 0) {
    daysUntil += 7;
  }

  const target = new Date(now);
  target.setDate(now.getDate() + daysUntil);
  target.setHours(cutoffHour, 0, 0, 0);

  // If same day but past the hour, push to next week
  if (daysUntil === 0 && now >= target) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}

/**
 * Compute the next Saturday at the given delivery start hour.
 * Used for "delivery starts in" countdown.
 */
export function getDeliveryStart(deliveryStartHour: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntilSaturday = 6 - currentDay; // 6 = Saturday

  if (daysUntilSaturday < 0) {
    daysUntilSaturday += 7;
  }

  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilSaturday);
  target.setHours(deliveryStartHour, 0, 0, 0);

  // If it's already Saturday and past the hour, push to next Saturday
  if (daysUntilSaturday === 0 && now >= target) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}
