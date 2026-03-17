/**
 * Delivery Settings Form Helpers
 * Validation, currency conversion, change detection, and diff formatting for DeliverySettingsForm.
 */

import type { DeliverySettings } from "./settings-types";

// ===========================================
// CONSTANTS
// ===========================================

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// ===========================================
// VALIDATION
// ===========================================

export interface DeliveryValidationErrors {
  deliveryRadiusMiles?: string;
  minimumOrderCents?: string;
  freeDeliveryThresholdCents?: string;
  baseDeliveryFeeCents?: string;
  cutoffDay?: string;
  cutoffHour?: string;
  deliveryStartHour?: string;
  deliveryEndHour?: string;
  maxDeliveryDurationMinutes?: string;
}

export function validateDeliveryField(
  field: keyof DeliverySettings,
  value: unknown
): string | undefined {
  switch (field) {
    case "deliveryRadiusMiles":
      if (typeof value !== "number" || value < 1) return "Must be at least 1 mile";
      if (value > 100) return "Cannot exceed 100 miles";
      return undefined;
    case "minimumOrderCents":
      if (typeof value !== "number" || value < 0) return "Must be 0 or greater";
      if (value > 10000) return "Cannot exceed $100.00";
      return undefined;
    case "freeDeliveryThresholdCents":
    case "baseDeliveryFeeCents":
      if (typeof value !== "number" || value < 0) return "Must be 0 or greater";
      return undefined;
    case "cutoffDay":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 6)
        return "Must be a day of the week (Sunday-Saturday)";
      return undefined;
    case "cutoffHour":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 23)
        return "Must be 0-23";
      return undefined;
    case "deliveryStartHour":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 23)
        return "Must be 0-23";
      return undefined;
    case "deliveryEndHour":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 24)
        return "Must be 1-24";
      return undefined;
    case "maxDeliveryDurationMinutes":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1)
        return "Must be at least 1 minute";
      if (value > 480) return "Cannot exceed 480 minutes";
      return undefined;
    default:
      return undefined;
  }
}

// ===========================================
// CURRENCY HELPERS
// ===========================================

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function dollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

// ===========================================
// FORMATTING
// ===========================================

/** Converts 24h hour number to display string: 0->"12:00 AM", 12->"12:00 PM", 24->"12:00 AM (next day)" */
export function formatHourDisplay(hour: number): string {
  if (hour === 24) return "12:00 AM (next day)";
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/** Formats "Last changed by {name} {relative time}" attribution label */
export function formatAttributionLabel(
  updatedAt: string | null,
  updatedBy: string | null
): string | undefined {
  if (!updatedAt) return undefined;
  const date = new Date(updatedAt);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const by = updatedBy || "Unknown";
  let timeStr: string;
  if (diffMin < 1) timeStr = "just now";
  else if (diffMin < 60) timeStr = `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  else if (diffHr < 24) timeStr = `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  else if (diffDays < 7) timeStr = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  else
    timeStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  return `Last changed by ${by} ${timeStr}`;
}

// ===========================================
// CHANGE DETECTION & DIFF
// ===========================================

export function isDeliveryFieldChanged(
  settings: DeliverySettings,
  originalSettings: DeliverySettings,
  field: keyof DeliverySettings
): boolean {
  return JSON.stringify(settings[field]) !== JSON.stringify(originalSettings[field]);
}

export const CHANGED_BORDER = "border-l-2 border-l-primary pl-3";

export interface SettingsChange {
  field: string;
  oldValue: string;
  newValue: string;
}

const FIELD_LABELS: Record<string, string> = {
  deliveryRadiusMiles: "Delivery Radius",
  minimumOrderCents: "Minimum Order",
  freeDeliveryThresholdCents: "Free Delivery Threshold",
  baseDeliveryFeeCents: "Base Delivery Fee",
  cutoffDay: "Order Cutoff Day",
  cutoffHour: "Order Cutoff Hour",
  deliveryStartHour: "Delivery Start Hour",
  deliveryEndHour: "Delivery End Hour",
  maxDeliveryDurationMinutes: "Max Delivery Duration",
  longDistanceFeeCents: "Extended Delivery Fee",
  longDistanceThresholdMiles: "Distance Threshold",
};

function formatFieldValue(field: string, value: number): string {
  switch (field) {
    case "minimumOrderCents":
    case "freeDeliveryThresholdCents":
    case "baseDeliveryFeeCents":
    case "longDistanceFeeCents":
      return `$${centsToDollars(value)}`;
    case "deliveryRadiusMiles":
      return `${value} miles`;
    case "longDistanceThresholdMiles":
      return `${value} miles`;
    case "cutoffDay":
      return DAY_NAMES[value] ?? String(value);
    case "cutoffHour":
    case "deliveryStartHour":
    case "deliveryEndHour":
      return formatHourDisplay(value);
    case "maxDeliveryDurationMinutes":
      return `${value} minutes`;
    default:
      return String(value);
  }
}

/** Computes human-readable diff of changed delivery settings fields */
export function computeDeliveryChanges(
  current: DeliverySettings,
  original: DeliverySettings
): SettingsChange[] {
  const changes: SettingsChange[] = [];
  const scalarFields: (keyof DeliverySettings)[] = [
    "deliveryRadiusMiles",
    "minimumOrderCents",
    "freeDeliveryThresholdCents",
    "baseDeliveryFeeCents",
    "cutoffDay",
    "cutoffHour",
    "deliveryStartHour",
    "deliveryEndHour",
    "maxDeliveryDurationMinutes",
    "longDistanceFeeCents",
    "longDistanceThresholdMiles",
  ];

  for (const field of scalarFields) {
    const oldVal = original[field] as number;
    const newVal = current[field] as number;
    if (oldVal !== newVal) {
      changes.push({
        field: FIELD_LABELS[field] ?? field,
        oldValue: formatFieldValue(field, oldVal),
        newValue: formatFieldValue(field, newVal),
      });
    }
  }

  return changes;
}
