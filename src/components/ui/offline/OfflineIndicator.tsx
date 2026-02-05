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
    setIsOnline(navigator.onLine);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      timeoutId = setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
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

  // Return null when not showing - prevents any invisible overlay
  if (!showBanner) return null;

  return (
    <div
      className="relative w-full z-[9999]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {isReconnected ? (
        // Back online banner - green with explicit colors
        <div
          className="px-4 py-3 text-center font-body text-sm font-medium shadow-lg"
          style={{ backgroundColor: "#52A52E", color: "#FFFFFF" }}
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </div>
        </div>
      ) : (
        // Offline banner - amber/orange with explicit colors
        <div
          className="px-4 py-3 text-center font-body text-sm font-medium shadow-lg"
          style={{ backgroundColor: "#E87D1E", color: "#FFFFFF" }}
        >
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
