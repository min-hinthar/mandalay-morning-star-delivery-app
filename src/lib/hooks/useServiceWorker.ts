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

    // Track listeners for cleanup
    let updateFoundHandler: (() => void) | null = null;
    let messageHandler: ((event: MessageEvent) => void) | null = null;
    let currentReg: ServiceWorkerRegistration | null = null;

    // Register service worker
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/driver",
        });

        currentReg = reg;
        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        updateFoundHandler = () => {
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
        setError(err instanceof Error ? err : new Error("Failed to register SW"));
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
