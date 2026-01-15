"use client";

import { useState, useEffect, useCallback } from "react";
import {
  syncPendingItems,
  getPendingCounts,
  pendingStatus,
  pendingPhotos,
  pendingLocations,
} from "@/lib/services/offline-store";

interface PendingCounts {
  status: number;
  photos: number;
  locations: number;
  total: number;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCounts: PendingCounts;
  lastSyncResult: {
    statusSynced: number;
    photosSynced: number;
    locationsSynced: number;
    errors: string[];
  } | null;
  syncNow: () => Promise<void>;
  // Queue methods for offline use
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

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    status: 0,
    photos: 0,
    locations: 0,
    total: 0,
  });
  const [lastSyncResult, setLastSyncResult] = useState<{
    statusSynced: number;
    photosSynced: number;
    locationsSynced: number;
    errors: string[];
  } | null>(null);

  // Update pending counts
  const updatePendingCounts = useCallback(async () => {
    try {
      const counts = await getPendingCounts();
      setPendingCounts({
        ...counts,
        total: counts.status + counts.photos + counts.locations,
      });
    } catch {
      // IndexedDB might not be available
    }
  }, []);

  // Sync pending items
  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncPendingItems();
      setLastSyncResult(result);
      await updatePendingCounts();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, updatePendingCounts]);

  // Queue methods
  const queueStatusUpdate = useCallback(
    async (
      routeId: string,
      stopId: string,
      status: string,
      deliveryNotes?: string
    ) => {
      await pendingStatus.add(routeId, stopId, status, deliveryNotes);
      await updatePendingCounts();
    },
    [updatePendingCounts]
  );

  const queuePhoto = useCallback(
    async (routeId: string, stopId: string, blob: Blob) => {
      await pendingPhotos.add(routeId, stopId, blob);
      await updatePendingCounts();
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
      await updatePendingCounts();
    },
    [updatePendingCounts]
  );

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial pending counts
    updatePendingCounts();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow, updatePendingCounts]);

  return {
    isOnline,
    isSyncing,
    pendingCounts,
    lastSyncResult,
    syncNow,
    queueStatusUpdate,
    queuePhoto,
    queueLocation,
  };
}
