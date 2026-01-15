"use client";

import { useEffect, useState } from "react";

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Register service worker
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/driver",
        });

        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                console.log("New service worker available");
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SYNC_REQUESTED") {
            // Trigger sync from IndexedDB
            window.dispatchEvent(new CustomEvent("sw-sync-request"));
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to register SW"));
      }
    };

    registerSW();

    // Cleanup
    return () => {
      // Service worker persists, no cleanup needed
    };
  }, []);

  return {
    isSupported,
    isRegistered,
    registration,
    error,
  };
}
