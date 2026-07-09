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
import type { DeliveryFeeBand } from "@/lib/utils/order";
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
import { DeliveryBandsEditor } from "./DeliveryBandsEditor";
import { ToggleSwitch } from "./ToggleSwitch";

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
    extendedPerMile: centsToDollars(settings.extendedDeliveryPerMileCents ?? 150),
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
        | "extendedDeliveryPerMileCents",
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

  const handleBandsChange = useCallback(
    (bands: DeliveryFeeBand[]) => onChange({ ...settings, deliveryFeeBands: bands }),
    [settings, onChange]
  );

  const handleToggleExtended = useCallback(
    (enabled: boolean) => onChange({ ...settings, extendedDeliveryEnabled: enabled }),
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

          <div className={cn("space-y-2", changed("longDistanceThresholdMiles") && CHANGED_BORDER)}>
            <Label htmlFor="longDistanceThreshold">Local Zone Radius (miles)</Label>
            <div className="max-w-[200px]">
              <Input
                id="longDistanceThreshold"
                type="number"
                min={1}
                max={100}
                step={1}
                value={settings.longDistanceThresholdMiles ?? 25}
                onChange={(e) => handleNumberChange("longDistanceThresholdMiles", e.target.value)}
              />
            </div>
            <p className="text-xs text-text-muted">
              Free-delivery-eligible zone. Beyond this, graduated fees apply.
            </p>
          </div>
        </div>

        {/* Graduated distance bands */}
        <div className="pt-2">
          <DeliveryBandsEditor
            bands={settings.deliveryFeeBands ?? []}
            localRadiusMiles={settings.longDistanceThresholdMiles ?? 25}
            standardRadiusMiles={settings.deliveryRadiusMiles}
            onChange={handleBandsChange}
            changed={changed("deliveryFeeBands")}
          />
        </div>

        {/* Long-distance (50–100 mi) auto-quote */}
        <div className="pt-4 border-t border-border-subtle space-y-4">
          <ToggleSwitch
            id="extendedDeliveryEnabled"
            checked={settings.extendedDeliveryEnabled ?? true}
            onChange={handleToggleExtended}
            label="Long-Distance Delivery"
            description="Auto-quote deliveries beyond the standard radius (up to the max) with a per-mile surcharge."
          />
          {settings.extendedDeliveryEnabled && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                className={cn(
                  "space-y-2",
                  changed("extendedDeliveryPerMileCents") && CHANGED_BORDER
                )}
              >
                <Label htmlFor="extendedPerMile">Per-Mile Surcharge</Label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    $
                  </span>
                  <Input
                    id="extendedPerMile"
                    type="number"
                    min={0}
                    step={0.01}
                    value={displayValues.extendedPerMile}
                    onChange={(e) =>
                      handleCurrencyChange(
                        "extendedDeliveryPerMileCents",
                        "extendedPerMile",
                        e.target.value
                      )
                    }
                    error={errors.extendedDeliveryPerMileCents}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-text-muted">Added per mile beyond the standard radius</p>
              </div>

              <div className={cn("space-y-2", changed("maxDeliveryRadiusMiles") && CHANGED_BORDER)}>
                <Label htmlFor="maxDeliveryRadius">Max Delivery Radius (miles)</Label>
                <div className="max-w-[200px]">
                  <Input
                    id="maxDeliveryRadius"
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={settings.maxDeliveryRadiusMiles ?? 100}
                    onChange={(e) => handleNumberChange("maxDeliveryRadiusMiles", e.target.value)}
                    error={errors.maxDeliveryRadiusMiles}
                  />
                </div>
                <p className="text-xs text-text-muted">Absolute delivery limit (max 100 mi)</p>
              </div>
            </div>
          )}
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
                label="Standard Radius (miles)"
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
            <p className="text-xs text-text-muted">
              Edge of normal coverage. The per-mile surcharge begins here.
            </p>
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
