"use client";

/**
 * NotificationsSection
 * Renders 3 expandable notification cards from NOTIFICATION_GROUPS.
 * Each card has a toggle, sub-category list, and disable warning.
 */

import { Package, Megaphone, Bell } from "lucide-react";
import { NotificationCard } from "./NotificationCard";
import { NOTIFICATION_GROUPS } from "./settings-types";
import type { NotificationPrefs } from "./settings-types";

const ICON_MAP: Record<string, React.ReactNode> = {
  Package: <Package className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
};

interface NotificationsSectionProps {
  notificationPrefs: NotificationPrefs;
  onUpdate: (key: keyof NotificationPrefs, value: boolean) => void;
}

export function NotificationsSection({ notificationPrefs, onUpdate }: NotificationsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-text-primary">Email Notifications</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Choose which emails you&apos;d like to receive
        </p>
      </div>

      <div className="space-y-3">
        {NOTIFICATION_GROUPS.map((group) => (
          <NotificationCard
            key={group.key}
            title={group.title}
            description={group.description}
            icon={ICON_MAP[group.iconName]}
            subCategories={group.subCategories}
            warningText={group.warningText}
            enabled={notificationPrefs[group.key]}
            onToggle={(val) => onUpdate(group.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
