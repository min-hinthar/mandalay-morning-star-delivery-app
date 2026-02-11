"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  syncPendingItems,
  getPendingCounts,
  pendingStatus,
  pendingPhotos,
  pendingLocations,
  purgeExpiredEntries,
} from "@/lib/services/offline-store";

type SyncState = "idle" | "syncing" | "synced" | "error";

interface PendingCounts {
  status: number;
  photos: number;
  locations: number;
  total: number;
}

interface SyncResult {
  statusSynced: number;
  photosSynced: number;
  locationsSynced: number;
  permanentFailures: number;
  errors: string[];
}

interface UseOfflineSyncOptions {
  onDrain?: () => void;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  /** @deprecated Use syncState instead */
  isSyncing: boolean;
  syncState: SyncState;
  pendingCounts: PendingCounts;
  lastSyncResult: SyncResult | null;
  syncNow: () => Promise<void>;
  queueStatusUpdate: (
    routeId: string,
    stopId: string,
    status: string,
    deliveryNotes?: string
  ) => Promise<void>;
  queuePhoto: (routeId: string, stopId: string, blob: Blob) => Promise<void>;
  queueLocation: (
    latitude: number,
    longitude: number,
    accuracy: number,
    heading: number | null,
    speed: number | null,
    routeId?: string
  ) => Promise<void>;
}

export function useOfflineSync(
  options?: UseOfflineSyncOptions
): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    status: 0,
    photos: 0,
    locations: 0,
    total: 0,
  });
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(
    null
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTotalRef = useRef<number>(0);
  const onDrainRef = useRef(options?.onDrain);

  // Keep onDrain ref current without triggering effects
  onDrainRef.current = options?.onDrain;

  // Update pending counts
  const updatePendingCounts = useCallback(async () => {
    try {
      const counts = await getPendingCounts();
      const total = counts.status + counts.photos + counts.locations;
      setPendingCounts({ ...counts, total });
      return total;
    } catch {
      // IndexedDB might not be available
      return pendingCounts.total;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pending items with state machine
  const syncNow = useCallback(async () => {
    // Use navigator.onLine for freshness (not React state)
    if (syncState === "syncing" || !navigator.onLine) return;

    setSyncState("syncing");
    try {
      const result = await syncPendingItems();
      setLastSyncResult(result);

      const newTotal = await updatePendingCounts();

      // Drain detection: queue went from non-empty to empty
      if (prevTotalRef.current > 0 && newTotal === 0) {
        onDrainRef.current?.();
      }
      prevTotalRef.current = newTotal;

      if (newTotal === 0) {
        setSyncState("synced");
        setTimeout(() => setSyncState("idle"), 3000);
      } else if (result.errors.length > 0) {
        setSyncState("error");
        setTimeout(() => setSyncState("idle"), 5000);
      } else {
        setSyncState("idle");
      }
    } catch {
      setSyncState("error");
      setTimeout(() => setSyncState("idle"), 5000);
    }
  }, [syncState, updatePendingCounts]);

  // Queue methods
  const queueStatusUpdate = useCallback(
    async (
      routeId: string,
      stopId: string,
      status: string,
      deliveryNotes?: string
    ) => {
      await pendingStatus.add(routeId, stopId, status, deliveryNotes);
      const total = await updatePendingCounts();
      prevTotalRef.current = total;
    },
    [updatePendingCounts]
  );

  const queuePhoto = useCallback(
    async (routeId: string, stopId: string, blob: Blob) => {
      await pendingPhotos.add(routeId, stopId, blob);
      const total = await updatePendingCounts();
      prevTotalRef.current = total;
    },
    [updatePendingCounts]
  );

  const queueLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      accuracy: number,
      heading: number | null,
      speed: number | null,
      routeId?: string
    ) => {
      await pendingLocations.add(
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        routeId
      );
      const total = await updatePendingCounts();
      prevTotalRef.current = total;
    },
    [updatePendingCounts]
  );

  // Online/offline events + expiry purge on mount
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Purge expired entries on mount
    purgeExpiredEntries().then((purged) => {
      if (purged > 0) {
        console.info(`[useOfflineSync] Purged ${purged} expired entries`);
      }
    });

    // Initial pending counts
    updatePendingCounts().then((total) => {
      prevTotalRef.current = total;
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow, updatePendingCounts]);

  // Background timer: 60s interval when queue non-empty and online
  useEffect(() => {
    if (pendingCounts.total > 0 && isOnline) {
      timerRef.current = setInterval(() => {
        syncNow();
      }, 60_000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pendingCounts.total, isOnline, syncNow]);

  return {
    isOnline,
    isSyncing: syncState === "syncing",
    syncState,
    pendingCounts,
    lastSyncResult,
    syncNow,
    queueStatusUpdate,
    queuePhoto,
    queueLocation,
  };
}
