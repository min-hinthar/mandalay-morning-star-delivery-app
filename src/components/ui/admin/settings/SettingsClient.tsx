"use client";

/**
 * SettingsClient Component
 * Main settings UI with tabbed interface for delivery, operations, and notifications
 *
 * Features:
 * - Fetches settings from /api/admin/settings
 * - Tabbed interface with animated transitions
 * - Save button with loading state
 * - Restore defaults functionality
 * - Unsaved changes warning (UI + beforeunload)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Settings2, Bell, Save, RotateCcw, Loader2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/button";
import { DeliverySettingsForm } from "./DeliverySettingsForm";
import { OperationsSettingsForm } from "./OperationsSettingsForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { useToast } from "@/lib/hooks/useToast";
import { spring, variants } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

// ===========================================
// TYPES
// ===========================================

export interface DeliverySettings {
  deliveryRadiusMiles: number;
  minimumOrderCents: number;
  freeDeliveryThresholdCents: number;
  baseDeliveryFeeCents: number;
  deliveryCutoffTime: string;
}

export interface OperationsSettings {
  maxStopsPerRoute: number;
  autoAssignEnabled: boolean;
  routeOptimizationEnabled: boolean;
  defaultVehicleType: "car" | "motorcycle" | "bicycle" | "van" | "truck";
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  notifyOnOrderPlaced: boolean;
  notifyOnOrderStatusChange: boolean;
}

export interface AllSettings {
  delivery: DeliverySettings;
  operations: OperationsSettings;
  notifications: NotificationSettings;
}

// Default settings (same as API)
const DEFAULT_SETTINGS: AllSettings = {
  delivery: {
    deliveryRadiusMiles: 40,
    minimumOrderCents: 2500,
    freeDeliveryThresholdCents: 5000,
    baseDeliveryFeeCents: 599,
    deliveryCutoffTime: "18:00",
  },
  operations: {
    maxStopsPerRoute: 15,
    autoAssignEnabled: false,
    routeOptimizationEnabled: true,
    defaultVehicleType: "car",
  },
  notifications: {
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    pushNotificationsEnabled: false,
    notifyOnOrderPlaced: true,
    notifyOnOrderStatusChange: true,
  },
};

// ===========================================
// TABS CONFIGURATION
// ===========================================

const SETTINGS_TABS = [
  { id: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Settings2 className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
];

// ===========================================
// COMPONENT
// ===========================================

export function SettingsClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("delivery");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Settings state
  const [originalSettings, setOriginalSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);

  // Deep compare to detect changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Failed to fetch settings");

        const data = await response.json();

        // Map API response to state (convert snake_case keys to camelCase)
        const mapped: AllSettings = {
          delivery: {
            deliveryRadiusMiles: data.delivery?.deliveryRadiusMiles ?? DEFAULT_SETTINGS.delivery.deliveryRadiusMiles,
            minimumOrderCents: data.delivery?.minimumOrderCents ?? DEFAULT_SETTINGS.delivery.minimumOrderCents,
            freeDeliveryThresholdCents: data.delivery?.freeDeliveryThresholdCents ?? DEFAULT_SETTINGS.delivery.freeDeliveryThresholdCents,
            baseDeliveryFeeCents: data.delivery?.baseDeliveryFeeCents ?? DEFAULT_SETTINGS.delivery.baseDeliveryFeeCents,
            deliveryCutoffTime: data.delivery?.deliveryCutoffTime ?? DEFAULT_SETTINGS.delivery.deliveryCutoffTime,
          },
          operations: {
            maxStopsPerRoute: data.operations?.maxStopsPerRoute ?? DEFAULT_SETTINGS.operations.maxStopsPerRoute,
            autoAssignEnabled: data.operations?.autoAssignEnabled ?? DEFAULT_SETTINGS.operations.autoAssignEnabled,
            routeOptimizationEnabled: data.operations?.routeOptimizationEnabled ?? DEFAULT_SETTINGS.operations.routeOptimizationEnabled,
            defaultVehicleType: data.operations?.defaultVehicleType ?? DEFAULT_SETTINGS.operations.defaultVehicleType,
          },
          notifications: {
            emailNotificationsEnabled: data.notifications?.emailNotificationsEnabled ?? DEFAULT_SETTINGS.notifications.emailNotificationsEnabled,
            smsNotificationsEnabled: data.notifications?.smsNotificationsEnabled ?? DEFAULT_SETTINGS.notifications.smsNotificationsEnabled,
            pushNotificationsEnabled: data.notifications?.pushNotificationsEnabled ?? DEFAULT_SETTINGS.notifications.pushNotificationsEnabled,
            notifyOnOrderPlaced: data.notifications?.notifyOnOrderPlaced ?? DEFAULT_SETTINGS.notifications.notifyOnOrderPlaced,
            notifyOnOrderStatusChange: data.notifications?.notifyOnOrderStatusChange ?? DEFAULT_SETTINGS.notifications.notifyOnOrderStatusChange,
          },
        };

        setSettings(mapped);
        setOriginalSettings(mapped);
      } catch (_error) {
        toast({
          variant: "destructive",
          description: "Failed to load settings",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  // Warn about unsaved changes on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Save handler - saves all changed categories
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const categories: (keyof AllSettings)[] = ["delivery", "operations", "notifications"];

      for (const category of categories) {
        // Only update if this category changed
        if (JSON.stringify(settings[category]) !== JSON.stringify(originalSettings[category])) {
          const response = await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              settings: settings[category],
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to save ${category} settings`);
          }
        }
      }

      setOriginalSettings(settings);
      toast({
        variant: "success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  }, [hasChanges, settings, originalSettings, toast]);

  // Restore defaults handler
  const handleRestoreDefaults = useCallback(async () => {
    if (!confirm("Are you sure you want to restore all settings to defaults? This cannot be undone.")) {
      return;
    }

    setRestoring(true);
    try {
      const response = await fetch("/api/admin/settings/restore", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore defaults");
      }

      // Reset to default settings
      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);

      toast({
        variant: "success",
        description: "Settings restored to defaults",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to restore defaults",
      });
    } finally {
      setRestoring(false);
    }
  }, [toast]);

  // Update handlers for each settings category
  const handleDeliveryChange = useCallback((delivery: DeliverySettings) => {
    setSettings((s) => ({ ...s, delivery }));
  }, []);

  const handleOperationsChange = useCallback((operations: OperationsSettings) => {
    setSettings((s) => ({ ...s, operations }));
  }, []);

  const handleNotificationsChange = useCallback((notifications: NotificationSettings) => {
    setSettings((s) => ({ ...s, notifications }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRestoreDefaults}
            disabled={restoring || saving}
            className="flex-1 sm:flex-none"
          >
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Restore Defaults</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving || restoring}
            className="flex-1 sm:flex-none"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-2">Save Changes</span>
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.default, delay: 0.1 }}
      >
        <Tabs
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          layoutId="settingsTab"
        />
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.default, delay: 0.2 }}
        className="mt-6"
      >
        <AnimatePresence mode="wait">
          {activeTab === "delivery" && (
            <motion.div
              key="delivery"
              {...variants.fadeIn}
              id="tabpanel-delivery"
              role="tabpanel"
              aria-labelledby="tab-delivery"
            >
              <DeliverySettingsForm
                settings={settings.delivery}
                onChange={handleDeliveryChange}
              />
            </motion.div>
          )}
          {activeTab === "operations" && (
            <motion.div
              key="operations"
              {...variants.fadeIn}
              id="tabpanel-operations"
              role="tabpanel"
              aria-labelledby="tab-operations"
            >
              <OperationsSettingsForm
                settings={settings.operations}
                onChange={handleOperationsChange}
              />
            </motion.div>
          )}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              {...variants.fadeIn}
              id="tabpanel-notifications"
              role="tabpanel"
              aria-labelledby="tab-notifications"
            >
              <NotificationSettingsForm
                settings={settings.notifications}
                onChange={handleNotificationsChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Unsaved Changes Warning */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={spring.default}
            className={cn(
              "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
              "bg-amber-500/10 border border-amber-500/30",
              "px-4 py-2 rounded-card-sm shadow-lg backdrop-blur-sm"
            )}
          >
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              You have unsaved changes
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
