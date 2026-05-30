"use client";

import { ToggleSwitch } from "@/components/ui/admin/settings/ToggleSwitch";
import { useWebPush } from "@/lib/hooks/useWebPush";

/**
 * Per-device push toggle for order-status notifications. Renders nothing when
 * the browser can't do push or no VAPID key is configured, so it stays out of
 * the way until web push is set up.
 */
export function PushNotificationToggle() {
  const { supported, configured, subscribed, permission, busy, subscribe, unsubscribe } =
    useWebPush();

  if (!supported || !configured) return null;

  const blocked = permission === "denied";

  return (
    <section className="rounded-card bg-surface-primary p-5">
      <ToggleSwitch
        id="push-on-device"
        checked={subscribed}
        onChange={(val) => {
          if (busy || blocked) return;
          if (val) void subscribe();
          else void unsubscribe();
        }}
        label="Push on this device"
        description={
          blocked
            ? "Notifications are blocked in your browser settings — re-enable them to get live order updates here."
            : "Get “Out for delivery” and “Arriving” alerts on this device, even when the app is closed."
        }
      />
    </section>
  );
}
