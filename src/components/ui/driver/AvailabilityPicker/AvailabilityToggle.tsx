"use client";

/**
 * AvailabilityToggle
 * Global "available this week" toggle using shared ToggleSwitch component.
 */

import { ToggleSwitch } from "@/components/ui/admin/settings/ToggleSwitch";

interface AvailabilityToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AvailabilityToggle({ enabled, onChange }: AvailabilityToggleProps) {
  return (
    <ToggleSwitch
      id="availability-toggle"
      label="Available this week"
      description="Turn off to mark yourself as unavailable for all days"
      checked={enabled}
      onChange={onChange}
    />
  );
}
