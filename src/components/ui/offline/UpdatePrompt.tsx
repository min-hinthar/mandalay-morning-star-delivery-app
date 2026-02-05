"use client";

/**
 * Update Prompt Component (OFFLINE-11)
 * Fixed banner at bottom with countdown for service worker updates
 *
 * Per CONTEXT.md:
 * - Fixed banner at bottom of viewport
 * - Primary brand color styling (positive update message)
 * - Auto-refresh with 5-second countdown
 * - Dismiss button stops countdown, banner returns on next navigation
 * - Text: "New version available - Refreshing in 5..."
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { zClass } from "@/lib/design-system/tokens/z-index";

const COUNTDOWN_SECONDS = 5;

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isDismissed, setIsDismissed] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Handle service worker update detection
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleStateChange = (worker: ServiceWorker) => {
      if (worker.state === "installed") {
        waitingWorkerRef.current = worker;
        if (!isDismissed) {
          setShowPrompt(true);
          setCountdown(COUNTDOWN_SECONDS);
        }
      }
    };

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Check if there's already a waiting worker
          if (registration.waiting) {
            waitingWorkerRef.current = registration.waiting;
            if (!isDismissed) {
              setShowPrompt(true);
              setCountdown(COUNTDOWN_SECONDS);
            }
          }

          // Listen for new workers
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                handleStateChange(newWorker);
              });
            }
          });
        }
      } catch (error) {
        console.error("[UpdatePrompt] Error checking for updates:", error);
      }
    };

    checkForUpdates();

    // Also listen for controllerchange to detect when new SW takes over
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, [isDismissed]);

  // Countdown timer
  useEffect(() => {
    if (!showPrompt) return;

    if (countdown <= 0) {
      // Countdown complete - trigger update
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showPrompt, countdown]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setIsDismissed(true);
  }, []);

  const handleRefreshNow = useCallback(() => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    }
  }, []);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed bottom-0 left-0 right-0 ${zClass.toast}`}
        >
          <div className="bg-primary px-4 py-3 text-center font-body text-sm font-medium text-text-inverse">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
              <span>
                New version available - Refreshing in {countdown}...
              </span>
              <button
                onClick={handleRefreshNow}
                className="ml-2 rounded-full bg-overlay-light px-3 py-0.5 text-xs font-semibold transition-colors hover:bg-overlay"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="ml-1 rounded-full p-1 transition-colors hover:bg-overlay-light"
                aria-label="Dismiss update prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpdatePrompt;
