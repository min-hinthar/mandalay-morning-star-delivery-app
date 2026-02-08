"use client";

/**
 * SettingsTab Container
 * Sub-tab navigation within the account Settings tab.
 * Sub-tabs: Preferences, Addresses, Notifications, Display
 *
 * Calls useCustomerSettings at this level and passes data down.
 * FloatingUnsavedBar appears when settings have unsaved changes.
 */

import { useState } from "react";
import { Heart, MapPin, Bell, Palette } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { FloatingUnsavedBar } from "@/components/ui/admin/settings/FloatingUnsavedBar";
import { AddressesTab } from "@/components/ui/account/AddressesTab";
import { useCustomerSettings } from "./useCustomerSettings";
import { PreferencesSection } from "./PreferencesSection";
import { NotificationsSection } from "./NotificationsSection";
import { DisplaySection } from "./DisplaySection";

type SettingsSection = "preferences" | "addresses" | "notifications" | "display";

const VALID_SECTIONS: SettingsSection[] = [
  "preferences",
  "addresses",
  "notifications",
  "display",
];

const SETTINGS_TABS = [
  {
    id: "preferences" as const,
    label: "Preferences",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: "addresses" as const,
    label: "Addresses",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    id: "notifications" as const,
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    id: "display" as const,
    label: "Display",
    icon: <Palette className="h-4 w-4" />,
  },
];

interface SettingsTabProps {
  initialSection?: string | null;
}

export function SettingsTab({ initialSection }: SettingsTabProps) {
  const validatedSection =
    initialSection && VALID_SECTIONS.includes(initialSection as SettingsSection)
      ? (initialSection as SettingsSection)
      : "preferences";

  const [activeSection, setActiveSection] =
    useState<SettingsSection>(validatedSection);

  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    error,
    save,
    discard,
    updateField,
  } = useCustomerSettings();

  /** Immediately PATCH theme to DB (fire-and-forget, no loading state) */
  function handleThemeDbSync(theme: string) {
    fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    }).catch(() => {
      // Silently fail — theme is already applied visually via next-themes
    });
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <Tabs
        tabs={SETTINGS_TABS}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id as SettingsSection)}
        layoutId="settingsSubTab"
      />

      {/* Error message */}
      {error && (
        <div className="rounded-card-sm bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Section content */}
      {!isLoading && settings && (
        <div>
          {activeSection === "preferences" && (
            <PreferencesSection
              settings={settings}
              updateField={updateField}
            />
          )}
          {activeSection === "addresses" && <AddressesTab />}
          {activeSection === "notifications" && (
            <NotificationsSection
              notificationPrefs={settings.notificationPrefs}
              onUpdate={(key, val) =>
                updateField("notificationPrefs", {
                  ...settings.notificationPrefs,
                  [key]: val,
                })
              }
            />
          )}
          {activeSection === "display" && (
            <DisplaySection onThemeChange={handleThemeDbSync} />
          )}
        </div>
      )}

      {/* Floating unsaved changes bar */}
      <FloatingUnsavedBar
        show={hasChanges}
        onSave={save}
        onDiscard={discard}
        isSaving={isSaving}
      />
    </div>
  );
}
