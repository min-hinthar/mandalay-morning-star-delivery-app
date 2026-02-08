"use client";

/**
 * OperationsSettingsForm Component
 * Form for managing driver/operations-related settings
 *
 * Fields:
 * - Max stops per route (1-50)
 * - Auto-assign enabled (toggle)
 * - Route optimization enabled (toggle)
 * - Default vehicle type (select)
 * - Store hours (open/close per day, toggle closed days)
 * - Max orders per time slot (capacity)
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { ToggleSwitch } from "./ToggleSwitch";
import type { OperationsSettings, WeeklyStoreHours, DayHours } from "./settings-types";

interface OperationsSettingsFormProps {
  settings: OperationsSettings;
  originalSettings: OperationsSettings;
  onChange: (settings: OperationsSettings) => void;
}

// ===========================================
// CONSTANTS
// ===========================================

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
] as const;

const DAYS_OF_WEEK: (keyof WeeklyStoreHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<keyof WeeklyStoreHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// ===========================================
// VALIDATION
// ===========================================

interface ValidationErrors {
  maxStopsPerRoute?: string;
  maxOrdersPerSlot?: string;
}

function validateMaxStops(value: number): string | undefined {
  if (value < 1) return "Must be at least 1 stop";
  if (value > 50) return "Cannot exceed 50 stops";
  return undefined;
}

function validateMaxOrders(value: number): string | undefined {
  if (value < 1) return "Must be at least 1";
  if (value > 100) return "Cannot exceed 100";
  return undefined;
}

// ===========================================
// HELPERS
// ===========================================

function isFieldChanged(
  settings: OperationsSettings,
  originalSettings: OperationsSettings,
  field: keyof OperationsSettings
): boolean {
  return JSON.stringify(settings[field]) !== JSON.stringify(originalSettings[field]);
}

const changedBorder = "border-l-2 border-l-primary pl-3";

// ===========================================
// COMPONENT
// ===========================================

export function OperationsSettingsForm({ settings, originalSettings, onChange }: OperationsSettingsFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleMaxStopsChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;

      const error = validateMaxStops(numValue);
      setErrors((prev) => ({ ...prev, maxStopsPerRoute: error }));

      onChange({ ...settings, maxStopsPerRoute: numValue });
    },
    [settings, onChange]
  );

  const handleToggleChange = useCallback(
    (field: keyof OperationsSettings, checked: boolean) => {
      onChange({ ...settings, [field]: checked });
    },
    [settings, onChange]
  );

  const handleVehicleTypeChange = useCallback(
    (value: string) => {
      onChange({
        ...settings,
        defaultVehicleType: value as OperationsSettings["defaultVehicleType"],
      });
    },
    [settings, onChange]
  );

  // --- Store Hours ---
  const handleDayHoursChange = useCallback(
    (day: keyof WeeklyStoreHours, updates: Partial<DayHours>) => {
      onChange({
        ...settings,
        storeHours: {
          ...settings.storeHours,
          [day]: { ...settings.storeHours[day], ...updates },
        },
      });
    },
    [settings, onChange]
  );

  // --- Capacity ---
  const handleMaxOrdersChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;

      const error = validateMaxOrders(numValue);
      setErrors((prev) => ({ ...prev, maxOrdersPerSlot: error }));

      onChange({ ...settings, maxOrdersPerSlot: numValue });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Operations Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure driver routes, store hours, and capacity.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Max Stops Per Route */}
        <div className={cn("space-y-2", isFieldChanged(settings, originalSettings, "maxStopsPerRoute") && changedBorder)}>
          <Label htmlFor="maxStops">Maximum Stops Per Route</Label>
          <Input
            id="maxStops"
            type="number"
            min={1}
            max={50}
            step={1}
            value={settings.maxStopsPerRoute}
            onChange={(e) => handleMaxStopsChange(e.target.value)}
            error={errors.maxStopsPerRoute}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">
            Maximum number of delivery stops a driver can have on one route (1-50)
          </p>
        </div>

        {/* Default Vehicle Type */}
        <div className={cn("space-y-2", isFieldChanged(settings, originalSettings, "defaultVehicleType") && changedBorder)}>
          <Label htmlFor="vehicleType">Default Vehicle Type</Label>
          <select
            id="vehicleType"
            value={settings.defaultVehicleType}
            onChange={(e) => handleVehicleTypeChange(e.target.value)}
            className={cn(
              "flex h-11 w-full max-w-[200px] rounded-input border border-border",
              "bg-surface-primary px-4 py-3",
              "font-body text-base text-text-primary",
              "transition-colors duration-normal ease-default",
              "focus-visible:outline-none focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-tertiary"
            )}
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-muted">Default vehicle type for new drivers</p>
        </div>

        {/* Toggle Section */}
        <div className={cn(
          "space-y-1 divide-y divide-border-subtle",
          (isFieldChanged(settings, originalSettings, "autoAssignEnabled") ||
            isFieldChanged(settings, originalSettings, "routeOptimizationEnabled")) && changedBorder
        )}>
          <ToggleSwitch
            id="autoAssign"
            checked={settings.autoAssignEnabled}
            onChange={(checked) => handleToggleChange("autoAssignEnabled", checked)}
            label="Auto-Assign Drivers"
            description="Automatically assign available drivers to new routes"
          />

          <ToggleSwitch
            id="routeOptimization"
            checked={settings.routeOptimizationEnabled}
            onChange={(checked) => handleToggleChange("routeOptimizationEnabled", checked)}
            label="Route Optimization"
            description="Automatically optimize stop order for efficiency"
          />
        </div>
      </div>

      {/* Store Hours Section */}
      <div className={cn("space-y-4", isFieldChanged(settings, originalSettings, "storeHours") && changedBorder)}>
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Store Hours
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Set open and close times per day. Toggle closed for days off.
          </p>
        </div>

        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const hours = settings.storeHours[day];
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-wrap items-center gap-3 py-2 px-3 rounded-card-sm",
                  hours.closed ? "bg-surface-tertiary/50 opacity-60" : "bg-surface-secondary"
                )}
              >
                <span className="w-24 text-sm font-medium text-text-primary">
                  {DAY_LABELS[day]}
                </span>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`hours-open-${day}`} className="text-xs text-text-secondary sr-only">
                    Open
                  </Label>
                  <Input
                    id={`hours-open-${day}`}
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleDayHoursChange(day, { open: e.target.value })}
                    disabled={hours.closed}
                    className="w-[120px]"
                  />
                  <span className="text-xs text-text-muted">to</span>
                  <Label htmlFor={`hours-close-${day}`} className="text-xs text-text-secondary sr-only">
                    Close
                  </Label>
                  <Input
                    id={`hours-close-${day}`}
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleDayHoursChange(day, { close: e.target.value })}
                    disabled={hours.closed}
                    className="w-[120px]"
                  />
                </div>

                <ToggleSwitch
                  id={`closed-${day}`}
                  checked={hours.closed}
                  onChange={(closed) => handleDayHoursChange(day, { closed })}
                  label="Closed"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacity Limits Section */}
      <div className={cn("space-y-4", isFieldChanged(settings, originalSettings, "maxOrdersPerSlot") && changedBorder)}>
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Capacity Limits
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxOrdersPerSlot">Max Orders Per Time Slot</Label>
          <Input
            id="maxOrdersPerSlot"
            type="number"
            min={1}
            max={100}
            step={1}
            value={settings.maxOrdersPerSlot}
            onChange={(e) => handleMaxOrdersChange(e.target.value)}
            error={errors.maxOrdersPerSlot}
            className="max-w-[200px]"
          />
          <p className="text-xs text-text-muted">
            Maximum orders that can be scheduled in each delivery time window
          </p>
        </div>
      </div>
    </div>
  );
}
