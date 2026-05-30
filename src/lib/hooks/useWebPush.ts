"use client";

import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export interface WebPushState {
  /** Browser supports the Push API + service workers. */
  supported: boolean;
  /** A VAPID public key is configured (push can be set up at all). */
  configured: boolean;
  subscribed: boolean;
  permission: NotificationPermission;
  busy: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Manage this device's Web Push subscription for order-status notifications.
 * Everything degrades gracefully: when unsupported or no VAPID key is set, the
 * hook reports `supported`/`configured` false and the actions are no-ops.
 */
export function useWebPush(): WebPushState {
  const configured = Boolean(VAPID_PUBLIC_KEY);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    const key = VAPID_PUBLIC_KEY;
    if (!supported || !key || busy) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) setSubscribed(true);
    } catch {
      // Permission denied / push service error — leave state as-is.
    } finally {
      setBusy(false);
    }
  }, [supported, busy]);

  const unsubscribe = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      // Best-effort.
    } finally {
      setBusy(false);
    }
  }, [supported, busy]);

  return { supported, configured, subscribed, permission, busy, subscribe, unsubscribe };
}
