"use client";

/**
 * Update Banner Hook (64-02)
 * Interaction-aware countdown with dismissal tracking,
 * page deferral, mobile vibration, and post-update toast.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/lib/hooks/useToastV8";
import { logger } from "@/lib/utils/logger";

// ============================================
// CONSTANTS
// ============================================

const COUNTDOWN_TOTAL = 10;
const IDLE_RESUME_DELAY = 3000;
const MAX_DISMISSALS = 3;
const SESSION_KEY_DISMISS_COUNT = "mms-sw-dismiss-count";
const SESSION_KEY_UPDATED = "mms-sw-updated";
const DEFERRED_PATHS = ["/cart", "/checkout"];
/* Browsers only re-fetch sw.js on hard navigations (or ~daily) — a long-lived
   tab / installed PWA never learns a deploy happened. A heartbeat + visibility/
   online re-checks close that gap. */
const UPDATE_CHECK_INTERVAL_MS = 10 * 60_000;
/* If SKIP_WAITING → controllerchange never lands (stalled activation), reload
   anyway — the document fetch picks up the new build regardless. */
const RELOAD_FAILSAFE_MS = 4000;

// ============================================
// TYPES
// ============================================

export interface UseUpdateBannerReturn {
  showBanner: boolean;
  countdown: number;
  isPaused: boolean;
  isUpdating: boolean;
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
  return DEFERRED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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
  // Latest opener in a ref so the SW effect mounts ONCE. (It used to depend on
  // showUpdateBanner — re-running on every navigation and stacking a fresh
  // `updatefound` listener each time.)
  const showUpdateBannerRef = useRef(showUpdateBanner);
  useEffect(() => {
    showUpdateBannerRef.current = showUpdateBanner;
  }, [showUpdateBanner]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let disposed = false;

    const adoptWaiting = (worker: ServiceWorker | null) => {
      if (!worker || disposed) return;
      waitingWorkerRef.current = worker;
      showUpdateBannerRef.current();
    };

    const handleUpdateFound = () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        // "installed" + an existing controller = a NEW version waiting. With no
        // controller it's the very first install — never prompt for that.
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          adoptWaiting(newWorker);
        }
      });
    };

    /** Adopt the registration WHENEVER it first appears (on a first visit the
        async SW registration often completes after this hook mounts) — attach
        the updatefound listener exactly once + surface any waiting worker. */
    const adoptRegistration = (reg: ServiceWorkerRegistration) => {
      if (registration || disposed) return;
      registration = reg;
      registration.addEventListener("updatefound", handleUpdateFound);
      if (registration.waiting) adoptWaiting(registration.waiting);
    };

    /** Ask the browser to re-check sw.js NOW, then adopt any waiting worker. */
    const checkNow = async () => {
      try {
        if (!registration) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) adoptRegistration(reg);
        }
        if (!registration || disposed) return;
        // update() rejects on a network blip — fine, next heartbeat retries.
        await registration.update().catch(() => {});
        if (registration.waiting) adoptWaiting(registration.waiting);
      } catch (error) {
        logger.error("[useUpdateBanner] Error checking for updates", { error: String(error) });
      }
    };

    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) adoptRegistration(reg);
      } catch (error) {
        logger.error("[useUpdateBanner] Error attaching to registration", {
          error: String(error),
        });
      }
    };

    void init();

    // Re-check when the app becomes relevant again + on a heartbeat.
    const handleWake = () => {
      if (document.visibilityState === "visible") void checkNow();
    };
    const interval = setInterval(() => void checkNow(), UPDATE_CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleWake);
    window.addEventListener("online", handleWake);

    // controllerchange → the new SW took over → reload into the new build.
    // Guard the FIRST install: clientsClaim fires this for brand-new visitors,
    // and reloading them mid-browse races their in-flight chunk loads.
    let hadController = Boolean(navigator.serviceWorker.controller);
    const handleControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("online", handleWake);
      registration?.removeEventListener("updatefound", handleUpdateFound);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  // ------------------------------------------
  // Page deferral: re-show when leaving deferred path
  // ------------------------------------------
  useEffect(() => {
    if (hasDeferredUpdateRef.current && !isDeferredPath(pathname) && waitingWorkerRef.current) {
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
      if (waitingWorkerRef.current && !showBanner && !isDeferredPath(pathname)) {
        showUpdateBanner();
      }
    }
  }, [pathname, showBanner, showUpdateBanner]);

  // ------------------------------------------
  // Apply the update (shared by countdown + button)
  // ------------------------------------------
  const updateFiredRef = useRef(false);
  const requestUpdate = useCallback(() => {
    // One-shot: the countdown effect can re-run at 0 (pause/unpause cycles) —
    // a second SKIP_WAITING is a no-op but don't stack fail-safe reloads.
    if (updateFiredRef.current) return;
    updateFiredRef.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY_UPDATED, "true");
    } catch {
      /* storage blocked — only the post-update toast is lost */
    }
    waitingWorkerRef.current?.postMessage({ type: "SKIP_WAITING" });
    // Fail-safe: if controllerchange never reloads us, reload anyway.
    window.setTimeout(() => window.location.reload(), RELOAD_FAILSAFE_MS);
  }, []);

  // ------------------------------------------
  // Countdown timer
  // ------------------------------------------
  useEffect(() => {
    if (!showBanner || isPaused) return;

    if (countdown <= 0) {
      // Countdown complete - trigger update
      requestUpdate();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showBanner, countdown, isPaused, requestUpdate]);

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

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateNow = useCallback(() => {
    if (!isUpdating) {
      setIsUpdating(true);
      requestUpdate();
    }
  }, [isUpdating, requestUpdate]);

  return {
    showBanner,
    countdown,
    isPaused,
    isUpdating,
    canDismiss,
    version,
    progress,
    handleDismiss,
    handleUpdateNow,
  };
}
