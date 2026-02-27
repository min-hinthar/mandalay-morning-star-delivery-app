"use client";

/**
 * NotificationPrefsCard
 * Email notification toggles with independent save.
 * Fetches from GET /api/admin/profile/notifications, saves via PUT.
 */

import { useState, useEffect, useCallback } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { toast } from "@/lib/hooks/useToastV8";
import { ToggleSwitch } from "@/components/ui/admin/settings/ToggleSwitch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton/base";
import type { NotificationPrefs } from "./types";

const NOTIFICATION_LABELS: {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}[] = [
  {
    key: "newOrderAlert",
    label: "New Order Alerts",
    description: "Get notified when a new order is placed",
  },
  {
    key: "orderConfirmation",
    label: "Order Confirmed",
    description: "Notification when an order is confirmed",
  },
  {
    key: "orderCancellation",
    label: "Order Cancelled",
    description: "Notification when an order is cancelled",
  },
  {
    key: "orderDelivered",
    label: "Order Delivered",
    description: "Notification when an order is delivered",
  },
];

export function NotificationPrefsCard() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Store original for dirty detection
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPrefs | null>(null);

  const fetchPrefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/profile/notifications");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const json = await res.json();
      const data = json.data as NotificationPrefs;
      setPrefs(data);
      setOriginalPrefs(data);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    // Check dirty
    if (originalPrefs) {
      const dirty = Object.keys(updated).some(
        (k) => updated[k as keyof NotificationPrefs] !== originalPrefs[k as keyof NotificationPrefs]
      );
      setHasChanges(dirty);
    }
  };

  const handleSave = async () => {
    if (!prefs) return;
    try {
      setSaving(true);
      const res = await fetch("/api/admin/profile/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      const json = await res.json();
      const data = json.data as NotificationPrefs;
      setPrefs(data);
      setOriginalPrefs(data);
      setHasChanges(false);
      toast({
        message: "Notification preferences updated.",
        type: "success",
      });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to save preferences",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-surface-primary p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-text-muted" />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Notification Preferences
          </h2>
        </div>
        {hasChanges && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Saving..."
          >
            Save Preferences
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-text-muted mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchPrefs}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      ) : prefs ? (
        <div className="divide-y divide-border">
          {NOTIFICATION_LABELS.map(({ key, label, description }) => (
            <ToggleSwitch
              key={key}
              id={`notif-${key}`}
              checked={prefs[key]}
              onChange={(value) => handleToggle(key, value)}
              label={label}
              description={description}
            />
          ))}
        </div>
      ) : null}

      <p className="text-xs text-text-muted">
        Email notifications only. Push notifications coming soon.
      </p>
    </div>
  );
}
