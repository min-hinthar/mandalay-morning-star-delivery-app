"use client";

/**
 * OfflineBanner Component
 * Amber fixed-top banner when user is offline, with dismiss and auto-reconnect handling.
 *
 * Features:
 * - Shows when offline with WifiOff icon and descriptive message
 * - Dismissible via X button (resets when going offline again)
 * - Auto-hides on reconnect with "Back online!" success toast
 * - Slide-down entry / slide-up exit animation
 * - Respects reduced motion preferences
 */

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { WifiOff, X } from "lucide-react";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { toast } from "@/lib/hooks/useToastV8";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useCustomerOfflineSync();
  const { shouldAnimate } = useAnimationPreference();
  const [dismissed, setDismissed] = useState(false);
  const prevOnlineRef = useRef(isOnline);

  // Reset dismissed state when going offline again
  useEffect(() => {
    if (!isOnline && prevOnlineRef.current) {
      // Transitioned from online to offline
      setDismissed(false);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Show "Back online!" toast on reconnection
  useEffect(() => {
    if (wasOffline) {
      toast({ message: "Back online!", type: "success" });
    }
  }, [wasOffline]);

  const showBanner = !isOnline && !dismissed;

  return (
    <AnimatePresence>
      {showBanner && (
        <m.div
          initial={shouldAnimate ? { y: -60, opacity: 0 } : undefined}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
          exit={shouldAnimate ? { y: -60, opacity: 0 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[70] bg-amber-500"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <WifiOff className="h-4 w-4 text-text-inverse flex-shrink-0" />
              <p className="text-sm font-medium text-text-inverse">
                You&apos;re offline -- browsing cached menu. Some items may be unavailable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 rounded-full p-1 text-text-inverse hover:bg-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500"
              aria-label="Dismiss offline banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
