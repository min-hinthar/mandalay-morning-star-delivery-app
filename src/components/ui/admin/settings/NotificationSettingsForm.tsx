"use client";

/**
 * NotificationSettingsForm Component
 * Form for managing notification preferences
 *
 * Fields:
 * - Email notifications (toggle)
 * - SMS notifications (toggle)
 * - Push notifications (toggle)
 * - Notify on order placed (toggle)
 * - Notify on status change (toggle)
 */

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { NotificationSettings } from "./settings-types";

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
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

export function NotificationSettingsForm({ settings, onChange }: NotificationSettingsFormProps) {
  // Handle toggle changes
  const handleToggleChange = useCallback(
    (field: keyof NotificationSettings, checked: boolean) => {
      onChange({
        ...settings,
        [field]: checked,
      });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Notification Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how and when notifications are sent.
        </p>
      </div>

      {/* Notification Channels */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Notification Channels
        </h3>
        <div className="space-y-1 divide-y divide-border-subtle">
          <ToggleSwitch
            id="emailNotifications"
            checked={settings.emailNotificationsEnabled}
            onChange={(checked) => handleToggleChange("emailNotificationsEnabled", checked)}
            label="Email Notifications"
            description="Send notifications via email"
          />

          <ToggleSwitch
            id="smsNotifications"
            checked={settings.smsNotificationsEnabled}
            onChange={(checked) => handleToggleChange("smsNotificationsEnabled", checked)}
            label="SMS Notifications"
            description="Send notifications via SMS text messages"
          />

          <ToggleSwitch
            id="pushNotifications"
            checked={settings.pushNotificationsEnabled}
            onChange={(checked) => handleToggleChange("pushNotificationsEnabled", checked)}
            label="Push Notifications"
            description="Send browser/app push notifications"
          />
        </div>
      </div>

      {/* Notification Triggers */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Notification Triggers
        </h3>
        <div className="space-y-1 divide-y divide-border-subtle">
          <ToggleSwitch
            id="notifyOrderPlaced"
            checked={settings.notifyOnOrderPlaced}
            onChange={(checked) => handleToggleChange("notifyOnOrderPlaced", checked)}
            label="New Order Notifications"
            description="Notify when a new order is placed"
          />

          <ToggleSwitch
            id="notifyStatusChange"
            checked={settings.notifyOnOrderStatusChange}
            onChange={(checked) => handleToggleChange("notifyOnOrderStatusChange", checked)}
            label="Status Change Notifications"
            description="Notify when order status changes"
          />
        </div>
      </div>
    </div>
  );
}
