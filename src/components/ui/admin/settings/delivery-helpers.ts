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
  deliveryCutoffTime?: string;
}

export function validateDeliveryField(field: keyof DeliverySettings, value: unknown): string | undefined {
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
    case "deliveryCutoffTime":
      if (typeof value !== "string" || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
        return "Must be valid time (HH:MM)";
      }
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
