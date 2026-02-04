"use client";

/**
 * DeliverySettingsForm Component
 * Form for managing delivery-related settings
 *
 * Fields:
 * - Delivery radius (miles)
 * - Minimum order amount (currency in cents, displayed as dollars)
 * - Free delivery threshold (currency)
 * - Base delivery fee (currency)
 * - Delivery cutoff time (HH:MM)
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeliverySettings } from "./SettingsClient";

interface DeliverySettingsFormProps {
  settings: DeliverySettings;
  onChange: (settings: DeliverySettings) => void;
}

// ===========================================
// VALIDATION
// ===========================================

interface ValidationErrors {
  deliveryRadiusMiles?: string;
  minimumOrderCents?: string;
  freeDeliveryThresholdCents?: string;
  baseDeliveryFeeCents?: string;
  deliveryCutoffTime?: string;
}

function validateField(field: keyof DeliverySettings, value: unknown): string | undefined {
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
// HELPERS
// ===========================================

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

// ===========================================
// COMPONENT
// ===========================================

export function DeliverySettingsForm({ settings, onChange }: DeliverySettingsFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Local display values for currency fields (shown in dollars)
  const [displayValues, setDisplayValues] = useState({
    minimumOrder: centsToDollars(settings.minimumOrderCents),
    freeThreshold: centsToDollars(settings.freeDeliveryThresholdCents),
    deliveryFee: centsToDollars(settings.baseDeliveryFeeCents),
  });

  // Handle number input change
  const handleNumberChange = useCallback(
    (field: keyof DeliverySettings, value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      const error = validateField(field, numValue);
      setErrors((prev) => ({ ...prev, [field]: error }));

      onChange({
        ...settings,
        [field]: numValue,
      });
    },
    [settings, onChange]
  );

  // Handle currency input change (display as dollars, store as cents)
  const handleCurrencyChange = useCallback(
    (
      field: "minimumOrderCents" | "freeDeliveryThresholdCents" | "baseDeliveryFeeCents",
      displayKey: keyof typeof displayValues,
      value: string
    ) => {
      // Update display value
      setDisplayValues((prev) => ({ ...prev, [displayKey]: value }));

      // Convert to cents and update settings
      const cents = dollarsToCents(value);
      const error = validateField(field, cents);
      setErrors((prev) => ({ ...prev, [field]: error }));

      onChange({
        ...settings,
        [field]: cents,
      });
    },
    [settings, onChange]
  );

  // Handle time input change
  const handleTimeChange = useCallback(
    (value: string) => {
      const error = validateField("deliveryCutoffTime", value);
      setErrors((prev) => ({ ...prev, deliveryCutoffTime: error }));

      onChange({
        ...settings,
        deliveryCutoffTime: value,
      });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Delivery Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure delivery radius, fees, and thresholds.
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Delivery Radius */}
        <div className="space-y-2">
          <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
          <Input
            id="deliveryRadius"
            type="number"
            min={1}
            max={100}
            step={1}
            value={settings.deliveryRadiusMiles}
            onChange={(e) => handleNumberChange("deliveryRadiusMiles", e.target.value)}
            error={errors.deliveryRadiusMiles}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Maximum distance for deliveries (1-100 miles)</p>
        </div>

        {/* Minimum Order Amount */}
        <div className="space-y-2">
          <Label htmlFor="minimumOrder">Minimum Order Amount</Label>
          <div className="relative max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <Input
              id="minimumOrder"
              type="number"
              min={0}
              step={0.01}
              value={displayValues.minimumOrder}
              onChange={(e) =>
                handleCurrencyChange("minimumOrderCents", "minimumOrder", e.target.value)
              }
              error={errors.minimumOrderCents}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-text-muted">Minimum order value for delivery</p>
        </div>

        {/* Free Delivery Threshold */}
        <div className="space-y-2">
          <Label htmlFor="freeThreshold">Free Delivery Threshold</Label>
          <div className="relative max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <Input
              id="freeThreshold"
              type="number"
              min={0}
              step={0.01}
              value={displayValues.freeThreshold}
              onChange={(e) =>
                handleCurrencyChange("freeDeliveryThresholdCents", "freeThreshold", e.target.value)
              }
              error={errors.freeDeliveryThresholdCents}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-text-muted">Orders above this amount get free delivery</p>
        </div>

        {/* Base Delivery Fee */}
        <div className="space-y-2">
          <Label htmlFor="deliveryFee">Base Delivery Fee</Label>
          <div className="relative max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <Input
              id="deliveryFee"
              type="number"
              min={0}
              step={0.01}
              value={displayValues.deliveryFee}
              onChange={(e) =>
                handleCurrencyChange("baseDeliveryFeeCents", "deliveryFee", e.target.value)
              }
              error={errors.baseDeliveryFeeCents}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-text-muted">Standard delivery fee charged to customers</p>
        </div>

        {/* Delivery Cutoff Time */}
        <div className="space-y-2">
          <Label htmlFor="cutoffTime">Delivery Cutoff Time</Label>
          <Input
            id="cutoffTime"
            type="time"
            value={settings.deliveryCutoffTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            error={errors.deliveryCutoffTime}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Last time to accept delivery orders</p>
        </div>
      </div>
    </div>
  );
}
