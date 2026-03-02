/**
 * SimpleOfflineOverlay - Full-screen dismissible offline overlay for simple mode
 *
 * Shows a reassuring full-screen message when connectivity drops.
 * Dismissible to continue working offline. Toasts on reconnect and sync.
 * Normal mode uses OfflineBanner instead — this component is simple-mode only.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { toast } from "@/lib/hooks/useToastV8";

export function SimpleOfflineOverlay() {
  const { isOnline, syncState, pendingCounts } = useOfflineSync();
  const [dismissed, setDismissed] = useState(false);
  const prevOnlineRef = useRef(isOnline);
  const prevSyncStateRef = useRef(syncState);

  // Reset dismissed when a new offline event occurs (was online, now offline)
  useEffect(() => {
    if (prevOnlineRef.current && !isOnline) {
      setDismissed(false);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Toast on reconnect: offline -> online
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      toast({ message: "Back online \u2014 syncing deliveries\u2026", type: "success" });
    }
  }, [isOnline]);

  // Toast on sync complete
  useEffect(() => {
    if (prevSyncStateRef.current === "syncing" && syncState === "synced") {
      toast({ message: "All synced!", type: "success" });
    }
    prevSyncStateRef.current = syncState;
  }, [syncState]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const showOverlay = !isOnline && !dismissed;

  return (
    <AnimatePresence>
      {showOverlay && (
        <m.div
          key="simple-offline-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-surface-primary px-6"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss offline overlay"
            className={cn(
              "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full",
              "bg-surface-tertiary transition-colors duration-fast hover:bg-surface-secondary"
            )}
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>

          {/* Content */}
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-status-warning/10">
              <WifiOff className="h-10 w-10 text-status-warning" />
            </div>

            <h1 className="mt-6 font-display text-2xl font-bold text-text-primary">
              No Internet
            </h1>

            <p className="mt-3 max-w-xs font-body text-lg text-text-secondary">
              Don&apos;t worry! Your route is saved. Deliveries will sync when
              you&apos;re back online.
            </p>

            {pendingCounts.total > 0 && (
              <p className="mt-3 font-body text-sm text-text-muted">
                {pendingCounts.total} delivery update{pendingCounts.total === 1 ? "" : "s"} saved locally
              </p>
            )}
          </m.div>

          {/* Continue Offline button */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-10 w-full max-w-xs"
          >
            <button
              onClick={handleDismiss}
              className={cn(
                "flex min-h-[56px] w-full items-center justify-center rounded-card-sm",
                "bg-accent-teal font-body text-lg font-semibold text-text-inverse shadow-md",
                "transition-all duration-fast hover:shadow-lg",
                "active:scale-[0.98]"
              )}
            >
              Continue Offline
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
