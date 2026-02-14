"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Truck, Settings2, Bell, Mail, RotateCcw, Loader2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/button";
import { DeliverySettingsForm } from "../DeliverySettingsForm";
import { OperationsSettingsForm } from "../OperationsSettingsForm";
import { NotificationSettingsForm } from "../NotificationSettingsForm";
import { EmailSettingsForm } from "../EmailSettingsForm";
import { SaveButton } from "../SaveButton";
import { FloatingUnsavedBar } from "../FloatingUnsavedBar";
import { ConfirmDialog } from "../ConfirmDialog";
import { RestoreDefaultsDialog } from "../RestoreDefaultsDialog";
import { useToast } from "@/lib/hooks/useToast";
import { spring, variants } from "@/lib/motion-tokens";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { DEFAULT_SETTINGS, mapApiResponse } from "./settings-defaults";
import type {
  DeliverySettings,
  OperationsSettings,
  NotificationSettings,
  AllSettings,
} from "../settings-types";

// Re-export types for backward compatibility
export type { DeliverySettings, OperationsSettings, NotificationSettings, AllSettings } from "../settings-types";

const SETTINGS_TABS = [
  { id: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Settings2 className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
];

export function SettingsClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("delivery");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dialog states
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingTabId, setPendingTabId] = useState<string | null>(null);

  const [originalSettings, setOriginalSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);

  // Email kill switch state (stored in app_settings as email_sending_enabled under notifications category)
  const [emailSendingEnabled, setEmailSendingEnabled] = useState(true);
  const [originalEmailEnabled, setOriginalEmailEnabled] = useState(true);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(settings) !== JSON.stringify(originalSettings) ||
      emailSendingEnabled !== originalEmailEnabled
    );
  }, [settings, originalSettings, emailSendingEnabled, originalEmailEnabled]);

  // Fetch settings from API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Failed to fetch settings");
        const data = await response.json();
        const mapped = mapApiResponse(data);
        setSettings(mapped);
        setOriginalSettings(mapped);
        // Email kill switch is under notifications category as emailSendingEnabled
        const emailEnabled = data.notifications?.emailSendingEnabled ?? true;
        setEmailSendingEnabled(emailEnabled);
        setOriginalEmailEnabled(emailEnabled);
      } catch {
        toast({ variant: "destructive", description: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  // Warn on page unload
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

  // Save handler
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    setSaveError(null);
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
      // Save email kill switch if changed
      if (emailSendingEnabled !== originalEmailEnabled) {
        const response = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "notifications",
            settings: { emailSendingEnabled },
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save email settings");
        }
        setOriginalEmailEnabled(emailSendingEnabled);
      }
      setOriginalSettings(settings);
      toast({ variant: "success", description: "Settings saved successfully" });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      setSaveError(message);
      toast({ variant: "destructive", description: message });
      return false;
    } finally {
      setSaving(false);
    }
  }, [hasChanges, settings, originalSettings, emailSendingEnabled, originalEmailEnabled, toast]);

  // Tab switch with unsaved changes warning
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (hasChanges) {
        setPendingTabId(tabId);
      } else {
        setActiveTab(tabId);
      }
    },
    [hasChanges]
  );

  const confirmTabSwitch = useCallback(() => {
    if (pendingTabId) {
      setSettings(originalSettings);
      setEmailSendingEnabled(originalEmailEnabled);
      setActiveTab(pendingTabId);
      setPendingTabId(null);
    }
  }, [pendingTabId, originalSettings, originalEmailEnabled]);

  const cancelTabSwitch = useCallback(() => {
    setPendingTabId(null);
  }, []);

  // Discard changes from FloatingUnsavedBar
  const handleDiscardConfirm = useCallback(() => {
    setSettings(originalSettings);
    setEmailSendingEnabled(originalEmailEnabled);
    setShowDiscardDialog(false);
    setSaveError(null);
  }, [originalSettings, originalEmailEnabled]);

  // Restore defaults
  const executeRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const response = await fetch("/api/admin/settings/restore", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore defaults");
      }
      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
      setEmailSendingEnabled(true);
      setOriginalEmailEnabled(true);
      setSaveError(null);
      toast({ variant: "success", description: "Settings restored to defaults" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to restore defaults",
      });
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
    }
  }, [toast]);

  // Form change handlers
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Save error banner */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-card-sm p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{saveError}</p>
          <Button variant="outline" size="sm" onClick={handleSave}>
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowRestoreDialog(true)}
            disabled={restoring || saving}
            className="flex-1 sm:flex-none"
          >
            {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="ml-2">Restore Defaults</span>
          </Button>
          <SaveButton onClick={handleSave} hasChanges={hasChanges} disabled={restoring} />
        </div>
      </m.div>

      {/* Tabs */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.default, delay: 0.1 }}>
        <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </m.div>

      {/* Tab Content */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.default, delay: 0.2 }} className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "delivery" && (
            <m.div key="delivery" {...variants.fadeIn} id="tabpanel-delivery" role="tabpanel" aria-labelledby="tab-delivery">
              <DeliverySettingsForm settings={settings.delivery} originalSettings={originalSettings.delivery} onChange={handleDeliveryChange} />
            </m.div>
          )}
          {activeTab === "operations" && (
            <m.div key="operations" {...variants.fadeIn} id="tabpanel-operations" role="tabpanel" aria-labelledby="tab-operations">
              <OperationsSettingsForm settings={settings.operations} originalSettings={originalSettings.operations} onChange={handleOperationsChange} />
            </m.div>
          )}
          {activeTab === "notifications" && (
            <m.div key="notifications" {...variants.fadeIn} id="tabpanel-notifications" role="tabpanel" aria-labelledby="tab-notifications">
              <NotificationSettingsForm settings={settings.notifications} originalSettings={originalSettings.notifications} onChange={handleNotificationsChange} />
            </m.div>
          )}
          {activeTab === "email" && (
            <m.div key="email" {...variants.fadeIn} id="tabpanel-email" role="tabpanel" aria-labelledby="tab-email">
              <EmailSettingsForm emailEnabled={emailSendingEnabled} onToggle={setEmailSendingEnabled} />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* Floating unsaved changes bar */}
      <FloatingUnsavedBar
        show={hasChanges}
        onSave={handleSave}
        onDiscard={() => setShowDiscardDialog(true)}
        isSaving={saving}
      />

      {/* Tab switch warning dialog */}
      <ConfirmDialog
        open={pendingTabId !== null}
        title="Unsaved Changes"
        description="Discard changes to current tab?"
        confirmLabel="Discard"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={confirmTabSwitch}
        onCancel={cancelTabSwitch}
      />

      {/* Discard changes dialog */}
      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard Changes"
        description="Discard all unsaved changes? This can't be undone."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* Restore defaults dialog */}
      <RestoreDefaultsDialog
        open={showRestoreDialog}
        onConfirm={executeRestore}
        onCancel={() => setShowRestoreDialog(false)}
        isRestoring={restoring}
      />
    </div>
  );
}
