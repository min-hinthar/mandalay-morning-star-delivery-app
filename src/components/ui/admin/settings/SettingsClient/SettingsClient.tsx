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
import { SaveConfirmDialog } from "../SaveConfirmDialog";
import { RestoreDefaultsDialog } from "../RestoreDefaultsDialog";
import {
  computeDeliveryChanges,
  formatAttributionLabel,
  type SettingsChange,
} from "../delivery-helpers";
import { toast } from "@/lib/hooks/useToastV8";
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
export type {
  DeliverySettings,
  OperationsSettings,
  NotificationSettings,
  AllSettings,
} from "../settings-types";

const SETTINGS_TABS = [
  { id: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Settings2 className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
];

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState("delivery");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dialog states
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingSaveChanges, setPendingSaveChanges] = useState<SettingsChange[]>([]);
  const [pendingTabId, setPendingTabId] = useState<string | null>(null);

  // Attribution state
  const [deliveryUpdatedAt, setDeliveryUpdatedAt] = useState<string | null>(null);
  const [deliveryUpdatedBy, setDeliveryUpdatedBy] = useState<string | null>(null);

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
        // Attribution metadata
        if (data._meta?.deliveryUpdatedAt) {
          setDeliveryUpdatedAt(data._meta.deliveryUpdatedAt);
          setDeliveryUpdatedBy(data._meta.deliveryUpdatedBy ?? null);
        }
      } catch {
        toast({ message: "Failed to load settings", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

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

  // Execute the actual save (called directly or from SaveConfirmDialog)
  const executeSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setShowSaveConfirm(false);
    try {
      const categories: (keyof AllSettings)[] = ["delivery", "operations", "notifications"];
      for (const category of categories) {
        if (JSON.stringify(settings[category]) !== JSON.stringify(originalSettings[category])) {
          const response = await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, settings: settings[category] }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `Failed to save ${category} settings`);
          }
          // Update attribution from delivery PATCH response
          if (category === "delivery") {
            if (data.updatedAt) setDeliveryUpdatedAt(data.updatedAt);
            if (data.updatedBy) setDeliveryUpdatedBy(data.updatedBy);
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
        const emailData = await response.json();
        if (!response.ok) {
          throw new Error(emailData.error || "Failed to save email settings");
        }
        setOriginalEmailEnabled(emailSendingEnabled);
      }
      setOriginalSettings(settings);
      toast({ message: "Settings saved successfully", type: "success" });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      setSaveError(message);
      toast({ message, type: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [settings, originalSettings, emailSendingEnabled, originalEmailEnabled]);

  // Save handler - triggers confirmation for delivery tab, direct save for others
  const handleSaveRequest = useCallback(async () => {
    if (!hasChanges) {
      toast({ message: "No changes to save", type: "info" });
      return;
    }
    // If delivery settings changed and we're on delivery tab, show confirmation
    const deliveryChanged =
      JSON.stringify(settings.delivery) !== JSON.stringify(originalSettings.delivery);
    if (activeTab === "delivery" && deliveryChanged) {
      const changes = computeDeliveryChanges(settings.delivery, originalSettings.delivery);
      if (changes.length === 0) {
        toast({ message: "No changes to save", type: "info" });
        return;
      }
      setPendingSaveChanges(changes);
      setShowSaveConfirm(true);
      return;
    }
    // Non-delivery tabs or no delivery changes: save directly
    return executeSave();
  }, [hasChanges, settings, originalSettings, activeTab, executeSave]);

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
      toast({ message: "Settings restored to defaults", type: "success" });
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to restore defaults",
        type: "error",
      });
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
    }
  }, []);

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

  const lastChangedLabel = useMemo(
    () => formatAttributionLabel(deliveryUpdatedAt, deliveryUpdatedBy),
    [deliveryUpdatedAt, deliveryUpdatedBy]
  );

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Save error banner */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-card-sm p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{saveError}</p>
          <Button variant="outline" size="sm" onClick={executeSave}>
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
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Restore Defaults</span>
          </Button>
          <SaveButton onClick={handleSaveRequest} hasChanges={hasChanges} disabled={restoring} />
        </div>
      </m.div>

      {/* Tabs */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.default, delay: 0.1 }}
      >
        <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </m.div>

      {/* Tab Content */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.default, delay: 0.2 }}
        className="mt-6"
      >
        <AnimatePresence mode="wait">
          {activeTab === "delivery" && (
            <m.div
              key="delivery"
              {...variants.fadeIn}
              id="tabpanel-delivery"
              role="tabpanel"
              aria-labelledby="tab-delivery"
            >
              <DeliverySettingsForm
                settings={settings.delivery}
                originalSettings={originalSettings.delivery}
                onChange={handleDeliveryChange}
                lastChangedLabel={lastChangedLabel}
              />
            </m.div>
          )}
          {activeTab === "operations" && (
            <m.div
              key="operations"
              {...variants.fadeIn}
              id="tabpanel-operations"
              role="tabpanel"
              aria-labelledby="tab-operations"
            >
              <OperationsSettingsForm
                settings={settings.operations}
                originalSettings={originalSettings.operations}
                onChange={handleOperationsChange}
              />
            </m.div>
          )}
          {activeTab === "notifications" && (
            <m.div
              key="notifications"
              {...variants.fadeIn}
              id="tabpanel-notifications"
              role="tabpanel"
              aria-labelledby="tab-notifications"
            >
              <NotificationSettingsForm
                settings={settings.notifications}
                originalSettings={originalSettings.notifications}
                onChange={handleNotificationsChange}
              />
            </m.div>
          )}
          {activeTab === "email" && (
            <m.div
              key="email"
              {...variants.fadeIn}
              id="tabpanel-email"
              role="tabpanel"
              aria-labelledby="tab-email"
            >
              <EmailSettingsForm
                emailEnabled={emailSendingEnabled}
                onToggle={setEmailSendingEnabled}
              />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* Floating unsaved changes bar */}
      <FloatingUnsavedBar
        show={hasChanges}
        onSave={handleSaveRequest}
        onDiscard={() => setShowDiscardDialog(true)}
        isSaving={saving}
      />

      {/* Save confirmation dialog (delivery tab) */}
      <SaveConfirmDialog
        open={showSaveConfirm}
        changes={pendingSaveChanges}
        onConfirm={executeSave}
        onCancel={() => setShowSaveConfirm(false)}
        isLoading={saving}
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
