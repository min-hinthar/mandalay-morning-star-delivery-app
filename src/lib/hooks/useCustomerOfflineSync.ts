"use client";

/**
 * Customer Offline Sync Hook (OFFLINE-08)
 * Detects online/offline status with reconnection handling
 *
 * Per CONTEXT.md:
 * - On reconnection: shows "Back online" for 3 seconds then auto-dismisses
 */

import { useState, useEffect, useCallback } from "react";

interface UseCustomerOfflineSyncReturn {
  /** Current online status */
  isOnline: boolean;
  /** True for 3 seconds after reconnecting (for "Back online" banner) */
  wasOffline: boolean;
  /** Force re-check online status */
  checkStatus: () => void;
}

export function useCustomerOfflineSync(): UseCustomerOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  const checkStatus = useCallback(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
  }, []);

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      // Per CONTEXT.md: show "Back online" for 3 seconds
      setWasOffline(true);
      timeoutId = setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Clear any pending "Back online" timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setWasOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial status check
    checkStatus();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [checkStatus]);

  return { isOnline, wasOffline, checkStatus };
}
