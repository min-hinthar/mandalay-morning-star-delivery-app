/**
 * Delivery Settings Form Helpers
 * Validation, currency conversion, and change detection for DeliverySettingsForm.
 */

import type { DeliverySettings } from "./settings-types";

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
      if (typeof value !== "number" || value < 0 || value > 6) return "Must be 0-6 (Sun-Sat)";
      return undefined;
    case "cutoffHour":
    case "deliveryStartHour":
      if (typeof value !== "number" || value < 0 || value > 23) return "Must be 0-23";
      return undefined;
    case "deliveryEndHour":
      if (typeof value !== "number" || value < 1 || value > 24) return "Must be 1-24";
      return undefined;
    case "maxDeliveryDurationMinutes":
      if (typeof value !== "number" || value < 1) return "Must be at least 1 minute";
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
// CHANGE DETECTION
// ===========================================

export function isDeliveryFieldChanged(
  settings: DeliverySettings,
  originalSettings: DeliverySettings,
  field: keyof DeliverySettings
): boolean {
  return JSON.stringify(settings[field]) !== JSON.stringify(originalSettings[field]);
}

export const CHANGED_BORDER = "border-l-2 border-l-primary pl-3";
