/**
 * V6 Offline Banner - Pepper Aesthetic
 *
 * Banner showing offline status, pending sync items, and sync results.
 * V6 colors for status indicators with high visibility.
 */

"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCounts, syncNow, lastSyncResult } =
    useOfflineSync();
  const [showSyncResult, setShowSyncResult] = useState(false);

  // Show sync result notification briefly
  useEffect(() => {
    if (lastSyncResult) {
      setShowSyncResult(true);
      const timer = setTimeout(() => setShowSyncResult(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSyncResult]);

  // Don't render if online and no pending items
  if (isOnline && pendingCounts.total === 0 && !showSyncResult) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-40">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-status-error px-4 py-2 text-center font-body text-sm font-medium text-white">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You&apos;re offline. Changes will sync when reconnected.</span>
          </div>
        </div>
      )}

      {/* Pending items banner */}
      {isOnline && pendingCounts.total > 0 && (
        <div className="bg-secondary px-4 py-2 text-center font-body text-sm font-medium text-text-primary">
          <div className="flex items-center justify-center gap-2">
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing {pendingCounts.total} pending items...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{pendingCounts.total} items pending sync</span>
                <button
                  onClick={syncNow}
                  className="ml-2 rounded-full bg-white/30 px-3 py-0.5 text-xs font-semibold transition-colors hover:bg-white/40"
                >
                  Sync Now
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sync success notification */}
      {showSyncResult &&
        lastSyncResult &&
        lastSyncResult.errors.length === 0 &&
        (lastSyncResult.statusSynced > 0 ||
          lastSyncResult.photosSynced > 0 ||
          lastSyncResult.locationsSynced > 0) && (
          <div className="bg-green px-4 py-2 text-center font-body text-sm font-medium text-white">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>
                Synced {lastSyncResult.statusSynced + lastSyncResult.photosSynced} items
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
