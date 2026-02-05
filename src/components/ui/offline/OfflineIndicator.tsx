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
import { motion, AnimatePresence } from "framer-motion";
import { zClass } from "@/lib/design-system/tokens/z-index";

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

  return (
    <AnimatePresence mode="wait">
      {showBanner && (
        <motion.div
          key="offline-banner"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed left-0 right-0 top-0 ${zClass.toast}`}
        >
          {isReconnected ? (
            // Back online banner - green
            <div className="bg-green px-4 py-2 text-center font-body text-sm font-medium text-text-inverse">
              <div className="flex items-center justify-center gap-2">
                <Wifi className="h-4 w-4" />
                <span>Back online</span>
              </div>
            </div>
          ) : (
            // Offline banner - amber
            <div className="bg-orange px-4 py-2 text-center font-body text-sm font-medium text-text-inverse">
              <div className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>You&apos;re offline</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineIndicator;
