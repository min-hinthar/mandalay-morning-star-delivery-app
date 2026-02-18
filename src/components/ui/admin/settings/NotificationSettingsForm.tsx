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
 * - Low stock threshold (number + toggle)
 * - Daily summary email (toggle)
 */

import { useCallback } from "react";
import { Package } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { cn } from "@/lib/utils/cn";
import { ToggleSwitch } from "./ToggleSwitch";
import type { NotificationSettings } from "./settings-types";

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  originalSettings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
}

// ===========================================
// HELPERS
// ===========================================

function isFieldChanged(
  settings: NotificationSettings,
  originalSettings: NotificationSettings,
  field: keyof NotificationSettings
): boolean {
  return JSON.stringify(settings[field]) !== JSON.stringify(originalSettings[field]);
}

const changedBorder = "border-l-2 border-l-primary pl-3";

// ===========================================
// COMPONENT
// ===========================================

export function NotificationSettingsForm({
  settings,
  originalSettings,
  onChange,
}: NotificationSettingsFormProps) {
  const handleToggleChange = useCallback(
    (field: keyof NotificationSettings, checked: boolean) => {
      onChange({ ...settings, [field]: checked });
    },
    [settings, onChange]
  );

  const handleThresholdChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;
      onChange({ ...settings, lowStockThreshold: Math.max(0, Math.min(1000, numValue)) });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-8">
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
      <div
        className={cn(
          "space-y-2",
          (isFieldChanged(settings, originalSettings, "emailNotificationsEnabled") ||
            isFieldChanged(settings, originalSettings, "smsNotificationsEnabled") ||
            isFieldChanged(settings, originalSettings, "pushNotificationsEnabled")) &&
            changedBorder
        )}
      >
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
      <div
        className={cn(
          "space-y-2",
          (isFieldChanged(settings, originalSettings, "notifyOnOrderPlaced") ||
            isFieldChanged(settings, originalSettings, "notifyOnOrderStatusChange")) &&
            changedBorder
        )}
      >
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

      {/* Admin Alerts */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Admin Alerts
          </h3>
        </div>

        {/* Low Stock Alerts */}
        <div
          className={cn(
            "space-y-3",
            isFieldChanged(settings, originalSettings, "lowStockThreshold") && changedBorder
          )}
        >
          <ToggleSwitch
            id="lowStockAlerts"
            checked={settings.lowStockThreshold > 0}
            onChange={(enabled) => onChange({ ...settings, lowStockThreshold: enabled ? 10 : 0 })}
            label="Low Stock Alerts"
            description="Get notified when any item's stock falls below threshold"
          />

          {settings.lowStockThreshold > 0 && (
            <div className="ml-4 space-y-2">
              <div className="max-w-[160px]">
                <FloatingLabelInput
                  label="Stock Threshold"
                  icon={Package}
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={settings.lowStockThreshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                />
              </div>
              <p className="text-xs text-text-muted">
                Alert when any item falls below this quantity
              </p>
            </div>
          )}
        </div>

        {/* Daily Summary Email */}
        <div
          className={cn(
            isFieldChanged(settings, originalSettings, "dailySummaryEnabled") && changedBorder
          )}
        >
          <ToggleSwitch
            id="dailySummary"
            checked={settings.dailySummaryEnabled}
            onChange={(checked) => handleToggleChange("dailySummaryEnabled", checked)}
            label="Daily Summary Email"
            description="Receive a daily email summarizing orders and activity"
          />
        </div>
      </div>
    </div>
  );
}
