"use client";

/**
 * Service Worker Registration Component
 * Registers the service worker globally for offline support
 *
 * Must be included in root layout to enable:
 * - Image caching (CacheFirst)
 * - Menu API caching (NetworkFirst)
 * - Static asset caching (StaleWhileRevalidate)
 */

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production and if SW is supported
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[SW] Registered with scope:", registration.scope);

        // Check for updates periodically (every hour)
        setInterval(
          () => {
            registration.update().catch(console.error);
          },
          60 * 60 * 1000
        );
      } catch (error) {
        console.error("[SW] Registration failed:", error);
      }
    };

    registerSW();
  }, []);

  // This component renders nothing
  return null;
}
