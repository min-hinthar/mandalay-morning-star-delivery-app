"use client";

/**
 * Offline Indicator (OFFLINE-09)
 * Fixed amber banner at top showing offline/reconnection status
 *
 * Per CONTEXT.md:
 * - Fixed banner at top of viewport, pushes content down
 * - Subtle amber warning style with warning icon
 * - Slide down/up animation
 * - On reconnection: shows "Back online" for 3 seconds
 */

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  // Use local state with useEffect to avoid hydration mismatch
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial state after mount
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);
    console.log("[OfflineIndicator] Mounted, navigator.onLine:", initialOnline);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      console.log("[OfflineIndicator] Online event fired");
      setIsOnline(true);
      setWasOffline(true);
      timeoutId = setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      console.log("[OfflineIndicator] Offline event fired");
      setIsOnline(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setWasOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  // Show banner if offline OR in "Back online" transition period
  const showBanner = !isOnline || wasOffline;
  const isReconnected = isOnline && wasOffline;

  console.log("[OfflineIndicator] State:", { isOnline, wasOffline, showBanner, isReconnected });

  // Return null when not showing - prevents any invisible overlay
  if (!showBanner) return null;

  console.log("[OfflineIndicator] Rendering banner");

  return (
    <div
      className="fixed inset-x-0 top-0 z-[9999] pointer-events-auto"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {isReconnected ? (
        // Back online banner - green
        <div className="bg-green px-4 py-3 text-center font-body text-sm font-medium text-text-inverse shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </div>
        </div>
      ) : (
        // Offline banner - amber/orange
        <div className="bg-orange px-4 py-3 text-center font-body text-sm font-medium text-text-inverse shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You&apos;re offline</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineIndicator;
