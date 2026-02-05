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

import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import { zClass } from "@/lib/design-system/tokens/z-index";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useCustomerOfflineSync();

  // Show banner if offline OR in "Back online" transition period
  const showBanner = !isOnline || wasOffline;
  const isReconnected = isOnline && wasOffline;

  return (
    <AnimatePresence mode="wait">
      {showBanner && (
        <motion.div
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
