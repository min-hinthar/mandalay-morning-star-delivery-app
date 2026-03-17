"use client";

/**
 * DeliverySettingsForm Component
 * Form for managing delivery-related settings organized into Pricing, Schedule, and Coverage subsections.
 */

import { useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { cn } from "@/lib/utils/cn";
import type { DeliverySettings } from "./settings-types";
import {
  type DeliveryValidationErrors,
  validateDeliveryField,
  centsToDollars,
  dollarsToCents,
  isDeliveryFieldChanged,
  formatHourDisplay,
  CHANGED_BORDER,
} from "./delivery-helpers";
import { DeliveryDaysManager } from "./DeliveryDaysManager";

interface DeliverySettingsFormProps {
  settings: DeliverySettings;
  originalSettings: DeliverySettings;
  onChange: (settings: DeliverySettings) => void;
  /** Persistent attribution line: "Last changed by X on Y" */
  lastChangedLabel?: string;
}

export function DeliverySettingsForm({
  settings,
  originalSettings,
  onChange,
  lastChangedLabel,
}: DeliverySettingsFormProps) {
  const [errors, setErrors] = useState<DeliveryValidationErrors>({});

  const [displayValues, setDisplayValues] = useState({
    minimumOrder: centsToDollars(settings.minimumOrderCents),
    freeThreshold: centsToDollars(settings.freeDeliveryThresholdCents),
    deliveryFee: centsToDollars(settings.baseDeliveryFeeCents),
    longDistanceFee: centsToDollars(settings.longDistanceFeeCents ?? 2000),
  });

  const changed = (field: keyof DeliverySettings) =>
    isDeliveryFieldChanged(settings, originalSettings, field);

  const handleNumberChange = useCallback(
    (field: keyof DeliverySettings, value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      const error = validateDeliveryField(field, numValue);
      setErrors((prev) => ({ ...prev, [field]: error }));
      onChange({ ...settings, [field]: numValue });
    },
    [settings, onChange]
  );

  const handleCurrencyChange = useCallback(
    (
      field:
        | "minimumOrderCents"
        | "freeDeliveryThresholdCents"
        | "baseDeliveryFeeCents"
        | "longDistanceFeeCents",
      displayKey: keyof typeof displayValues,
      value: string
    ) => {
      setDisplayValues((prev) => ({ ...prev, [displayKey]: value }));
      const cents = dollarsToCents(value);
      const error = validateDeliveryField(field, cents);
      setErrors((prev) => ({ ...prev, [field]: error }));
      onChange({ ...settings, [field]: cents });
    },
    [settings, onChange]
  );

  const endBeforeStart =
    settings.deliveryEndHour > 0 && settings.deliveryEndHour <= settings.deliveryStartHour;

  return (
    <div className="space-y-8">
      {/* Section Header + Attribution */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">Delivery Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure delivery pricing, schedule, and coverage area.
        </p>
        {lastChangedLabel && <p className="mt-2 text-sm text-text-secondary">{lastChangedLabel}</p>}
      </div>

      {/* ========== PRICING SUBSECTION ========== */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Pricing</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className={cn("space-y-2", changed("baseDeliveryFeeCents") && CHANGED_BORDER)}>
            <Label htmlFor="deliveryFee">Base Delivery Fee</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                $
              </span>
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

          <div className={cn("space-y-2", changed("freeDeliveryThresholdCents") && CHANGED_BORDER)}>
            <Label htmlFor="freeThreshold">Free Delivery Threshold</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                $
              </span>
              <Input
                id="freeThreshold"
                type="number"
                min={0}
                step={0.01}
                value={displayValues.freeThreshold}
                onChange={(e) =>
                  handleCurrencyChange(
                    "freeDeliveryThresholdCents",
                    "freeThreshold",
                    e.target.value
                  )
                }
                error={errors.freeDeliveryThresholdCents}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-text-muted">Orders above this amount get free delivery</p>
          </div>

          <div className={cn("space-y-2", changed("minimumOrderCents") && CHANGED_BORDER)}>
            <Label htmlFor="minimumOrder">Minimum Order Amount</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                $
              </span>
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

          <div className={cn("space-y-2", changed("longDistanceFeeCents") && CHANGED_BORDER)}>
            <Label htmlFor="longDistanceFee">Extended Delivery Fee (&gt;25 mi)</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                $
              </span>
              <Input
                id="longDistanceFee"
                type="number"
                min={0}
                step={0.01}
                value={displayValues.longDistanceFee}
                onChange={(e) =>
                  handleCurrencyChange("longDistanceFeeCents", "longDistanceFee", e.target.value)
                }
                className="pl-7"
              />
            </div>
            <p className="text-xs text-text-muted">
              Flat fee for addresses beyond distance threshold
            </p>
          </div>

          <div className={cn("space-y-2", changed("longDistanceThresholdMiles") && CHANGED_BORDER)}>
            <Label htmlFor="longDistanceThreshold">Distance Threshold (miles)</Label>
            <div className="max-w-[200px]">
              <Input
                id="longDistanceThreshold"
                type="number"
                min={1}
                max={50}
                step={1}
                value={settings.longDistanceThresholdMiles ?? 25}
                onChange={(e) => handleNumberChange("longDistanceThresholdMiles", e.target.value)}
              />
            </div>
            <p className="text-xs text-text-muted">
              Addresses beyond this get the extended delivery fee
            </p>
          </div>
        </div>
      </div>

      {/* ========== SCHEDULE SUBSECTION ========== */}
      <div className="space-y-6 pt-6 border-t border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Schedule
        </h3>

        {/* Per-day delivery schedule manager (self-contained) */}
        <DeliveryDaysManager />

        {/* Delivery window hours (still global) */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-border-subtle">
          <div className={cn("space-y-2", changed("deliveryStartHour") && CHANGED_BORDER)}>
            <Label htmlFor="deliveryStartHour">Delivery Start Hour</Label>
            <div className="flex items-center gap-2">
              <Input
                id="deliveryStartHour"
                type="number"
                min={0}
                max={23}
                step={1}
                value={settings.deliveryStartHour}
                onChange={(e) => handleNumberChange("deliveryStartHour", e.target.value)}
                error={errors.deliveryStartHour}
                className="max-w-[100px]"
              />
              <span className="text-sm text-text-secondary">
                {formatHourDisplay(settings.deliveryStartHour)}
              </span>
            </div>
            <p className="text-xs text-text-muted">Earliest delivery hour (0-23)</p>
          </div>

          <div className={cn("space-y-2", changed("deliveryEndHour") && CHANGED_BORDER)}>
            <Label htmlFor="deliveryEndHour">Delivery End Hour</Label>
            <div className="flex items-center gap-2">
              <Input
                id="deliveryEndHour"
                type="number"
                min={1}
                max={24}
                step={1}
                value={settings.deliveryEndHour}
                onChange={(e) => handleNumberChange("deliveryEndHour", e.target.value)}
                error={errors.deliveryEndHour}
                className="max-w-[100px]"
              />
              <span className="text-sm text-text-secondary">
                {formatHourDisplay(settings.deliveryEndHour)}
              </span>
            </div>
            {endBeforeStart && (
              <p className="text-xs text-red-600">End hour must be after start hour</p>
            )}
            <p className="text-xs text-text-muted">Latest delivery hour (1-24)</p>
          </div>
        </div>
      </div>

      {/* ========== COVERAGE SUBSECTION ========== */}
      <div className="space-y-6 pt-6 border-t border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Coverage
        </h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className={cn("space-y-2", changed("deliveryRadiusMiles") && CHANGED_BORDER)}>
            <div className="max-w-[200px]">
              <FloatingLabelInput
                label="Delivery Radius (miles)"
                icon={MapPin}
                type="number"
                min={1}
                max={100}
                step={1}
                value={settings.deliveryRadiusMiles}
                onChange={(e) => handleNumberChange("deliveryRadiusMiles", e.target.value)}
                error={errors.deliveryRadiusMiles}
              />
            </div>
            <p className="text-xs text-text-muted">Maximum distance for deliveries (1-100 miles)</p>
          </div>

          <div className={cn("space-y-2", changed("maxDeliveryDurationMinutes") && CHANGED_BORDER)}>
            <Label htmlFor="maxDuration">Max Delivery Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxDuration"
                type="number"
                min={1}
                max={480}
                step={1}
                value={settings.maxDeliveryDurationMinutes}
                onChange={(e) => handleNumberChange("maxDeliveryDurationMinutes", e.target.value)}
                error={errors.maxDeliveryDurationMinutes}
                className="max-w-[100px]"
              />
              <span className="text-sm text-text-secondary">minutes</span>
            </div>
            <p className="text-xs text-text-muted">Max delivery duration (1-480 minutes)</p>
          </div>
        </div>

        {/* Direction-based delivery zones are configured via the delivery_days table above
            (each day has a direction: east/west/south/all). Zone bearings are managed in the
            delivery_zones database table and are not intended for casual admin editing. */}
      </div>
    </div>
  );
}
