/**
 * Offline Banner - Amber animated slide-in/out with sync states
 *
 * States:
 * 1. Offline: amber bg, WifiOff icon, "Offline -- N actions pending"
 * 2. Syncing: amber bg, spinning RefreshCw, "Syncing..."
 * 3. Synced: green bg, Check icon, "All synced!" (auto-dismisses)
 */

"use client";

import { m, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Check } from "lucide-react";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

export function OfflineBanner() {
  const { isOnline, syncState, pendingCounts } = useOfflineSync();

  const showBanner = !isOnline || syncState === "syncing" || syncState === "synced";

  // Determine banner content
  let icon: React.ReactNode;
  let text: string;
  let bannerClass: string;

  if (!isOnline) {
    icon = <WifiOff className="h-4 w-4 shrink-0" />;
    text =
      pendingCounts.total > 0
        ? `Offline \u2014 ${pendingCounts.total} action${pendingCounts.total === 1 ? "" : "s"} pending`
        : "You\u2019re offline";
    bannerClass = "bg-status-warning text-text-inverse";
  } else if (syncState === "syncing") {
    icon = <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />;
    text = "Syncing\u2026";
    bannerClass = "bg-status-warning text-text-inverse";
  } else {
    // synced
    icon = <Check className="h-4 w-4 shrink-0" />;
    text = "All synced!";
    bannerClass = "bg-green text-text-inverse";
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <m.div
          key="offline-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed inset-x-0 top-0 z-[80] px-4 py-2.5 text-center font-body text-sm font-medium ${bannerClass}`}
        >
          <div className="flex items-center justify-center gap-2">
            {icon}
            <span>{text}</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
