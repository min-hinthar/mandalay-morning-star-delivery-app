"use client";

/**
 * Offline Indicator (OFFLINE-09)
 * Fixed amber banner at top showing offline/reconnection status
 *
 * Per CONTEXT.md:
 * - Fixed banner at top of viewport, pushes content down
 * - Subtle amber warning style with warning icon
 * - Slide down/up animation
 * - On reconnection: shows "Back online!" for 3 seconds with manual Refresh button
 *
 * Banner priority: offline banner wins over update banner.
 * Dispatches "offline-state-change" custom event for coordination with useUpdateBanner.
 * Sets document.documentElement.dataset.offline for disabling non-queueable actions.
 */

import { useState, useEffect, useCallback } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

// Banner height for header offset calculation
const BANNER_HEIGHT = 44; // py-3 (12px * 2) + text height (~20px)

/**
 * Dispatch offline state change event for banner priority coordination.
 * The useUpdateBanner hook listens for this to suppress the update banner when offline.
 */
function dispatchOfflineStateChange(isOffline: boolean) {
  window.dispatchEvent(
    new CustomEvent("offline-state-change", {
      detail: { isOffline },
    })
  );
}

/**
 * Set document data attribute for offline action disabling.
 * Consumers (e.g., checkout button) can use:
 *   [data-offline="true"] .checkout-action { pointer-events: none; opacity: 0.5; }
 * Or check navigator.onLine directly.
 */
function setOfflineDataAttribute(isOffline: boolean) {
  if (isOffline) {
    document.documentElement.dataset.offline = "true";
  } else {
    delete document.documentElement.dataset.offline;
  }
}

export function OfflineIndicator() {
  // Use local state with useEffect to avoid hydration mismatch
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    setMounted(true);
    // Set initial state after mount
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);

    // Set initial offline signals
    dispatchOfflineStateChange(!initialOnline);
    setOfflineDataAttribute(!initialOnline);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      dispatchOfflineStateChange(false);
      setOfflineDataAttribute(false);
      timeoutId = setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setWasOffline(false);
      dispatchOfflineStateChange(true);
      setOfflineDataAttribute(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timeoutId) clearTimeout(timeoutId);
      // Clean up data attribute on unmount
      delete document.documentElement.dataset.offline;
    };
  }, []);

  // Show banner if offline OR in "Back online" transition period
  const showBanner = !isOnline || wasOffline;
  const isReconnected = isOnline && wasOffline;

  // Set CSS custom property for header offset
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty(
        "--offline-banner-height",
        showBanner ? `${BANNER_HEIGHT}px` : "0px"
      );
    }
    return () => {
      document.documentElement.style.setProperty("--offline-banner-height", "0px");
    };
  }, [mounted, showBanner]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  // Return null when not showing - prevents any invisible overlay
  if (!showBanner) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 w-full z-[9999]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {isReconnected ? (
        // Back online banner - green with explicit colors and manual refresh button
        <div
          className="px-4 py-3 text-center font-body text-sm font-medium shadow-lg"
          style={{ backgroundColor: "#52A52E", color: "#FFFFFF" }}
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>Back online!</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-surface-primary/20 hover:bg-surface-primary/30 transition-colors text-xs font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
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
            <span>You&apos;re offline &mdash; showing cached content</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineIndicator;
