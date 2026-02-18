"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

/**
 * Hook that attaches to the existing root-scope service worker registration
 * (registered by ServiceWorkerRegistration.tsx) instead of creating a duplicate
 * /driver scope registration.
 *
 * Preserves:
 * - updatefound listener for driver SW update detection
 * - SYNC_REQUESTED message listener for offline sync dispatch
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Track listeners for cleanup
    let updateFoundHandler: (() => void) | null = null;
    let messageHandler: ((event: MessageEvent) => void) | null = null;
    let currentReg: ServiceWorkerRegistration | null = null;

    // Use existing root-scope registration (from ServiceWorkerRegistration.tsx)
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/");
        if (!reg) {
          console.warn("[useServiceWorker] No root registration found");
          return;
        }

        currentReg = reg;
        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        updateFoundHandler = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker available
                console.debug("[SW] New service worker available");
              }
            });
          }
        };
        reg.addEventListener("updatefound", updateFoundHandler);

        // Listen for messages from service worker
        messageHandler = (event: MessageEvent) => {
          if (event.data?.type === "SYNC_REQUESTED") {
            // Trigger sync from IndexedDB
            window.dispatchEvent(new CustomEvent("sw-sync-request"));
          }
        };
        navigator.serviceWorker.addEventListener("message", messageHandler);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to get SW registration"));
      }
    };

    registerSW();

    // Cleanup event listeners on unmount
    return () => {
      if (currentReg && updateFoundHandler) {
        currentReg.removeEventListener("updatefound", updateFoundHandler);
      }
      if (messageHandler) {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      }
    };
  }, []);

  return {
    isSupported,
    isRegistered,
    registration,
    error,
  };
}

/**
 * Invalidate all menu API cache entries.
 * Call after admin menu updates to ensure customers see fresh data.
 */
export async function invalidateMenuCache(): Promise<void> {
  try {
    const cache = await caches.open("menu-api-cache-v1");
    const keys = await cache.keys();
    const menuKeys = keys.filter((r) => r.url.includes("/api/menu"));
    await Promise.all(menuKeys.map((key) => cache.delete(key)));
    console.log("[SW] Menu cache invalidated:", menuKeys.length, "entries");
  } catch (err) {
    console.error("[SW] Failed to invalidate menu cache:", err);
  }
}

/**
 * Report cache metrics as Sentry breadcrumbs for observability.
 * Lightweight: logs entry counts per cache name, no payload inspection.
 */
export async function reportCacheMetrics(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      Sentry.addBreadcrumb({
        category: "cache",
        message: `${name}: ${keys.length} entries`,
        level: "info",
      });
      console.log(`[Cache] ${name}: ${keys.length} entries`);
    }
  } catch (err) {
    console.error("[Cache] Failed to report metrics:", err);
  }
}
