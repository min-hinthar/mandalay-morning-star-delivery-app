"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Truck, Settings2, Bell, Save, RotateCcw, Loader2, Check } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/button";
import { DiscardChangesModal } from "@/components/ui/DiscardChangesModal";
import { DeliverySettingsForm } from "../DeliverySettingsForm";
import { OperationsSettingsForm } from "../OperationsSettingsForm";
import { NotificationSettingsForm } from "../NotificationSettingsForm";
import { useToast } from "@/lib/hooks/useToast";
import { spring, variants } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";
import { SettingsSkeleton } from "./SettingsSkeleton";
import type {
  DeliverySettings,
  OperationsSettings,
  NotificationSettings,
  AllSettings,
} from "../settings-types";

// Re-export types for backward compatibility
export type { DeliverySettings, OperationsSettings, NotificationSettings, AllSettings } from "../settings-types";

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

const SETTINGS_TABS = [
  { id: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Settings2 className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
];

export function SettingsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("delivery");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const [originalSettings, setOriginalSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Failed to fetch settings");
        const data = await response.json();

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
        toast({ variant: "destructive", description: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

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

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const categories: (keyof AllSettings)[] = ["delivery", "operations", "notifications"];
      for (const category of categories) {
        if (JSON.stringify(settings[category]) !== JSON.stringify(originalSettings[category])) {
          const response = await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, settings: settings[category] }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to save ${category} settings`);
          }
        }
      }
      setOriginalSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast({ variant: "success", description: "Settings saved successfully" });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to save settings",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [hasChanges, settings, originalSettings, toast]);

  const handleDiscard = useCallback(() => {
    setShowDiscardModal(false);
    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  }, [router]);

  const handleSaveAndNavigate = useCallback(async () => {
    const success = await handleSave();
    if (success) {
      setShowDiscardModal(false);
      if (pendingNavigationRef.current) {
        router.push(pendingNavigationRef.current);
        pendingNavigationRef.current = null;
      }
    }
  }, [handleSave, router]);

  const handleCancelNavigation = useCallback(() => {
    setShowDiscardModal(false);
    pendingNavigationRef.current = null;
  }, []);

  const handleRestoreDefaults = useCallback(async () => {
    if (!confirm("Are you sure you want to restore all settings to defaults? This cannot be undone.")) return;
    setRestoring(true);
    try {
      const response = await fetch("/api/admin/settings/restore", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore defaults");
      }
      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
      toast({ variant: "success", description: "Settings restored to defaults" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to restore defaults",
      });
    } finally {
      setRestoring(false);
    }
  }, [toast]);

  const handleDeliveryChange = useCallback((delivery: DeliverySettings) => {
    setSettings((s) => ({ ...s, delivery }));
  }, []);

  const handleOperationsChange = useCallback((operations: OperationsSettings) => {
    setSettings((s) => ({ ...s, operations }));
  }, []);

  const handleNotificationsChange = useCallback((notifications: NotificationSettings) => {
    setSettings((s) => ({ ...s, notifications }));
  }, []);

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRestoreDefaults} disabled={restoring || saving} className="flex-1 sm:flex-none">
            {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="ml-2">Restore Defaults</span>
          </Button>
          <Button
            variant={showSuccess ? "success" : "primary"}
            onClick={handleSave}
            disabled={!hasChanges || saving || restoring || showSuccess}
            className="flex-1 sm:flex-none"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : showSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span className="ml-2">{showSuccess ? "Saved!" : "Save Changes"}</span>
          </Button>
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.default, delay: 0.1 }}>
        <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onTabChange={setActiveTab} layoutId="settingsTab" />
      </m.div>

      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.default, delay: 0.2 }} className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "delivery" && (
            <m.div key="delivery" {...variants.fadeIn} id="tabpanel-delivery" role="tabpanel" aria-labelledby="tab-delivery">
              <DeliverySettingsForm settings={settings.delivery} onChange={handleDeliveryChange} />
            </m.div>
          )}
          {activeTab === "operations" && (
            <m.div key="operations" {...variants.fadeIn} id="tabpanel-operations" role="tabpanel" aria-labelledby="tab-operations">
              <OperationsSettingsForm settings={settings.operations} onChange={handleOperationsChange} />
            </m.div>
          )}
          {activeTab === "notifications" && (
            <m.div key="notifications" {...variants.fadeIn} id="tabpanel-notifications" role="tabpanel" aria-labelledby="tab-notifications">
              <NotificationSettingsForm settings={settings.notifications} onChange={handleNotificationsChange} />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      <AnimatePresence>
        {hasChanges && (
          <m.div
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
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You have unsaved changes</p>
          </m.div>
        )}
      </AnimatePresence>

      <DiscardChangesModal
        open={showDiscardModal}
        onDiscard={handleDiscard}
        onSave={handleSaveAndNavigate}
        onCancel={handleCancelNavigation}
        isSaving={saving}
      />
    </div>
  );
}
