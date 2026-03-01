"use client";

/**
 * DeliverySettingsForm Component
 * Form for managing delivery-related settings including zones and business rules.
 */

import { useState, useCallback } from "react";
import { Plus, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { cn } from "@/lib/utils/cn";
import type { DeliverySettings, DeliveryZone } from "./settings-types";
import {
  type DeliveryValidationErrors,
  validateDeliveryField,
  centsToDollars,
  dollarsToCents,
  isDeliveryFieldChanged,
  CHANGED_BORDER,
} from "./delivery-helpers";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DeliverySettingsFormProps {
  settings: DeliverySettings;
  originalSettings: DeliverySettings;
  onChange: (settings: DeliverySettings) => void;
}

export function DeliverySettingsForm({
  settings,
  originalSettings,
  onChange,
}: DeliverySettingsFormProps) {
  const [errors, setErrors] = useState<DeliveryValidationErrors>({});

  const [displayValues, setDisplayValues] = useState({
    minimumOrder: centsToDollars(settings.minimumOrderCents),
    freeThreshold: centsToDollars(settings.freeDeliveryThresholdCents),
    deliveryFee: centsToDollars(settings.baseDeliveryFeeCents),
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
      field: "minimumOrderCents" | "freeDeliveryThresholdCents" | "baseDeliveryFeeCents",
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

  // --- Delivery Zones ---
  const addZone = useCallback(() => {
    onChange({
      ...settings,
      deliveryZones: [...settings.deliveryZones, { name: "", feeCents: 0, description: "" }],
    });
  }, [settings, onChange]);

  const updateZone = useCallback(
    (index: number, updates: Partial<DeliveryZone>) => {
      const zones = settings.deliveryZones.map((z, i) => (i === index ? { ...z, ...updates } : z));
      onChange({ ...settings, deliveryZones: zones });
    },
    [settings, onChange]
  );

  const removeZone = useCallback(
    (index: number) => {
      onChange({
        ...settings,
        deliveryZones: settings.deliveryZones.filter((_, i) => i !== index),
      });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">Delivery Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure delivery radius, fees, and thresholds.
        </p>
      </div>

      {/* Core Fields */}
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

        <div className={cn("space-y-2", changed("minimumOrderCents") && CHANGED_BORDER)}>
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

        <div className={cn("space-y-2", changed("freeDeliveryThresholdCents") && CHANGED_BORDER)}>
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

        <div className={cn("space-y-2", changed("baseDeliveryFeeCents") && CHANGED_BORDER)}>
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
      </div>

      {/* Order Cutoff */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className={cn("space-y-2", changed("cutoffDay") && CHANGED_BORDER)}>
          <Label htmlFor="cutoffDay">Order Cutoff Day</Label>
          <select
            id="cutoffDay"
            value={settings.cutoffDay}
            onChange={(e) => handleNumberChange("cutoffDay", e.target.value)}
            className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {DAY_LABELS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-muted">Day of week when order cutoff applies</p>
        </div>

        <div className={cn("space-y-2", changed("cutoffHour") && CHANGED_BORDER)}>
          <Label htmlFor="cutoffHour">Order Cutoff Hour</Label>
          <Input
            id="cutoffHour"
            type="number"
            min={0}
            max={23}
            step={1}
            value={settings.cutoffHour}
            onChange={(e) => handleNumberChange("cutoffHour", e.target.value)}
            error={errors.cutoffHour}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Hour (0-23) when orders cut off on cutoff day</p>
        </div>
      </div>

      {/* Delivery Time Configuration */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className={cn("space-y-2", changed("deliveryStartHour") && CHANGED_BORDER)}>
          <Label htmlFor="deliveryStartHour">Delivery Start Hour</Label>
          <Input
            id="deliveryStartHour"
            type="number"
            min={0}
            max={23}
            step={1}
            value={settings.deliveryStartHour}
            onChange={(e) => handleNumberChange("deliveryStartHour", e.target.value)}
            error={errors.deliveryStartHour}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Earliest delivery hour (0-23)</p>
        </div>

        <div className={cn("space-y-2", changed("deliveryEndHour") && CHANGED_BORDER)}>
          <Label htmlFor="deliveryEndHour">Delivery End Hour</Label>
          <Input
            id="deliveryEndHour"
            type="number"
            min={1}
            max={24}
            step={1}
            value={settings.deliveryEndHour}
            onChange={(e) => handleNumberChange("deliveryEndHour", e.target.value)}
            error={errors.deliveryEndHour}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Latest delivery hour (1-24, must be after start)</p>
        </div>

        <div className={cn("space-y-2", changed("maxDeliveryDurationMinutes") && CHANGED_BORDER)}>
          <Label htmlFor="maxDuration">Max Duration (min)</Label>
          <Input
            id="maxDuration"
            type="number"
            min={1}
            max={480}
            step={1}
            value={settings.maxDeliveryDurationMinutes}
            onChange={(e) => handleNumberChange("maxDeliveryDurationMinutes", e.target.value)}
            error={errors.maxDeliveryDurationMinutes}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">Max delivery duration in minutes (1-480)</p>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className={cn("space-y-4", changed("deliveryZones") && CHANGED_BORDER)}>
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Delivery Zones
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Define zones with per-zone delivery fees.
          </p>
        </div>

        {settings.deliveryZones.length === 0 && (
          <p className="text-sm text-text-muted py-2">No delivery zones configured.</p>
        )}

        <div className="space-y-3">
          {settings.deliveryZones.map((zone, index) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-3 p-3 bg-surface-secondary rounded-card-sm border border-border-subtle"
            >
              <div className="space-y-1 flex-1 min-w-[120px]">
                <Label htmlFor={`zone-name-${index}`} className="text-xs">
                  Zone Name
                </Label>
                <Input
                  id={`zone-name-${index}`}
                  type="text"
                  value={zone.name}
                  onChange={(e) => updateZone(index, { name: e.target.value })}
                  placeholder="e.g. Downtown"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`zone-fee-${index}`} className="text-xs">
                  Fee
                </Label>
                <div className="relative w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                    $
                  </span>
                  <Input
                    id={`zone-fee-${index}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={centsToDollars(zone.feeCents)}
                    onChange={(e) =>
                      updateZone(index, { feeCents: dollarsToCents(e.target.value) })
                    }
                    className="pl-6"
                  />
                </div>
              </div>
              <div className="space-y-1 flex-1 min-w-[120px]">
                <Label htmlFor={`zone-desc-${index}`} className="text-xs">
                  Description
                </Label>
                <Input
                  id={`zone-desc-${index}`}
                  type="text"
                  value={zone.description}
                  onChange={(e) => updateZone(index, { description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeZone(index)}
                className="text-text-muted hover:text-red-600 shrink-0"
                aria-label={`Remove zone ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addZone}>
          <Plus className="h-4 w-4 mr-1" />
          Add Zone
        </Button>
      </div>
    </div>
  );
}
