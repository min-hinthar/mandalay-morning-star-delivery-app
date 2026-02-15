"use client";

/**
 * Update Banner Hook (64-02)
 * Interaction-aware countdown with dismissal tracking,
 * page deferral, mobile vibration, and post-update toast.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/lib/hooks/useToastV8";

// ============================================
// CONSTANTS
// ============================================

const COUNTDOWN_TOTAL = 10;
const IDLE_RESUME_DELAY = 3000;
const MAX_DISMISSALS = 3;
const SESSION_KEY_DISMISS_COUNT = "mms-sw-dismiss-count";
const SESSION_KEY_UPDATED = "mms-sw-updated";
const DEFERRED_PATHS = ["/cart", "/checkout"];

// ============================================
// TYPES
// ============================================

export interface UseUpdateBannerReturn {
  showBanner: boolean;
  countdown: number;
  isPaused: boolean;
  canDismiss: boolean;
  version: string;
  /** 0-1 fraction for progress bar (countdown / TOTAL) */
  progress: number;
  handleDismiss: () => void;
  handleUpdateNow: () => void;
}

// ============================================
// HELPERS
// ============================================

function getDismissCount(): number {
  if (typeof sessionStorage === "undefined") return 0;
  const val = sessionStorage.getItem(SESSION_KEY_DISMISS_COUNT);
  return val ? parseInt(val, 10) : 0;
}

function setDismissCount(count: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SESSION_KEY_DISMISS_COUNT, String(count));
}

function isDeferredPath(pathname: string): boolean {
  return DEFERRED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

// ============================================
// HOOK
// ============================================

export function useUpdateBanner(): UseUpdateBannerReturn {
  const pathname = usePathname();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "";

  // Core state
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissCount, setDismissCountState] = useState(0);

  // Refs
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasVibratedRef = useRef(false);
  const hasDeferredUpdateRef = useRef(false);

  const canDismiss = dismissCount < MAX_DISMISSALS;
  const progress = countdown / COUNTDOWN_TOTAL;

  // ------------------------------------------
  // Post-update toast (check on mount)
  // ------------------------------------------
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const wasUpdated = sessionStorage.getItem(SESSION_KEY_UPDATED);
    if (wasUpdated) {
      sessionStorage.removeItem(SESSION_KEY_UPDATED);
      toast({ message: "Updated to latest version!", type: "success" });
    }
  }, []);

  // ------------------------------------------
  // Load persisted dismiss count
  // ------------------------------------------
  useEffect(() => {
    setDismissCountState(getDismissCount());
  }, []);

  // ------------------------------------------
  // Show banner helper
  // ------------------------------------------
  const showUpdateBanner = useCallback(() => {
    if (isDeferredPath(pathname)) {
      hasDeferredUpdateRef.current = true;
      return;
    }
    setShowBanner(true);
    setCountdown(COUNTDOWN_TOTAL);
    // Vibrate on first show (mobile)
    if (!hasVibratedRef.current) {
      hasVibratedRef.current = true;
      navigator.vibrate?.(100);
    }
  }, [pathname]);

  // ------------------------------------------
  // Detect waiting service worker
  // ------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleStateChange = (worker: ServiceWorker) => {
      if (worker.state === "installed") {
        waitingWorkerRef.current = worker;
        showUpdateBanner();
      }
    };

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Already waiting
        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          showUpdateBanner();
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
      } catch (error) {
        console.error("[useUpdateBanner] Error checking for updates:", error);
      }
    };

    checkForUpdates();

    // Listen for controllerchange -> reload
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [showUpdateBanner]);

  // ------------------------------------------
  // Page deferral: re-show when leaving deferred path
  // ------------------------------------------
  useEffect(() => {
    if (
      hasDeferredUpdateRef.current &&
      !isDeferredPath(pathname) &&
      waitingWorkerRef.current
    ) {
      hasDeferredUpdateRef.current = false;
      showUpdateBanner();
    }
  }, [pathname, showUpdateBanner]);

  // ------------------------------------------
  // Re-show banner on navigation after dismiss
  // ------------------------------------------
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      // If we have a waiting worker and banner was dismissed, re-show
      if (
        waitingWorkerRef.current &&
        !showBanner &&
        !isDeferredPath(pathname)
      ) {
        showUpdateBanner();
      }
    }
  }, [pathname, showBanner, showUpdateBanner]);

  // ------------------------------------------
  // Countdown timer
  // ------------------------------------------
  useEffect(() => {
    if (!showBanner || isPaused) return;

    if (countdown <= 0) {
      // Countdown complete - trigger update
      if (waitingWorkerRef.current) {
        sessionStorage.setItem(SESSION_KEY_UPDATED, "true");
        waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showBanner, countdown, isPaused]);

  // ------------------------------------------
  // Interaction pause (scroll, keydown, touchstart, mousedown)
  // ------------------------------------------
  useEffect(() => {
    if (!showBanner) return;

    const handleInteraction = () => {
      setIsPaused(true);

      // Clear existing idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Resume after 3s of no interaction
      idleTimerRef.current = setTimeout(() => {
        setIsPaused(false);
        idleTimerRef.current = null;
      }, IDLE_RESUME_DELAY);
    };

    const options: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", handleInteraction, options);
    window.addEventListener("keydown", handleInteraction, options);
    window.addEventListener("touchstart", handleInteraction, options);
    window.addEventListener("mousedown", handleInteraction, options);

    return () => {
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("mousedown", handleInteraction);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [showBanner]);

  // ------------------------------------------
  // Handlers
  // ------------------------------------------
  const handleDismiss = useCallback(() => {
    const newCount = dismissCount + 1;
    setDismissCountState(newCount);
    setDismissCount(newCount);
    setShowBanner(false);
    setIsPaused(false);
  }, [dismissCount]);

  const handleUpdateNow = useCallback(() => {
    if (waitingWorkerRef.current) {
      sessionStorage.setItem(SESSION_KEY_UPDATED, "true");
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    }
  }, []);

  return {
    showBanner,
    countdown,
    isPaused,
    canDismiss,
    version,
    progress,
    handleDismiss,
    handleUpdateNow,
  };
}
