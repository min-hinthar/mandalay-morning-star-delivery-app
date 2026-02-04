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
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { OperationsSettings } from "./settings-types";

interface OperationsSettingsFormProps {
  settings: OperationsSettings;
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

// ===========================================
// VALIDATION
// ===========================================

interface ValidationErrors {
  maxStopsPerRoute?: string;
}

function validateMaxStops(value: number): string | undefined {
  if (value < 1) return "Must be at least 1 stop";
  if (value > 50) return "Cannot exceed 50 stops";
  return undefined;
}

// ===========================================
// TOGGLE SWITCH
// ===========================================

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ id, checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <Label htmlFor={id} className="text-base font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-green" : "bg-surface-tertiary"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-surface-primary shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// ===========================================
// COMPONENT
// ===========================================

export function OperationsSettingsForm({ settings, onChange }: OperationsSettingsFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Handle max stops change
  const handleMaxStopsChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;

      const error = validateMaxStops(numValue);
      setErrors((prev) => ({ ...prev, maxStopsPerRoute: error }));

      onChange({
        ...settings,
        maxStopsPerRoute: numValue,
      });
    },
    [settings, onChange]
  );

  // Handle toggle changes
  const handleToggleChange = useCallback(
    (field: keyof OperationsSettings, checked: boolean) => {
      onChange({
        ...settings,
        [field]: checked,
      });
    },
    [settings, onChange]
  );

  // Handle vehicle type change
  const handleVehicleTypeChange = useCallback(
    (value: string) => {
      onChange({
        ...settings,
        defaultVehicleType: value as OperationsSettings["defaultVehicleType"],
      });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Operations Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure driver routes and assignment preferences.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Max Stops Per Route */}
        <div className="space-y-2">
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
        <div className="space-y-2">
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
          <p className="text-xs text-text-muted">
            Default vehicle type for new drivers
          </p>
        </div>

        {/* Toggle Section */}
        <div className="space-y-1 divide-y divide-border-subtle">
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
    </div>
  );
}
