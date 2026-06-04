"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DriverLocation } from "@/app/api/admin/ops/driver-locations/route";

export interface DriverLocationsState {
  locations: DriverLocation[];
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

/**
 * Polls /api/admin/ops/driver-locations for the given delivery date.
 * Locations change less frequently than order/route state, so this defaults to a
 * slower 15s interval than the 5s ops polls.
 */
export function useDriverLocationsPolling(date: string, intervalMs = 15000): DriverLocationsState {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const fetchLocations = useCallback(async () => {
    if (isMountedRef.current) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/ops/driver-locations?date=${date}`);
      if (!res.ok) return;
      const data: DriverLocation[] = await res.json();
      if (isMountedRef.current) setLocations(data);
    } catch {
      // Silent -- next poll retries
    } finally {
      if (isMountedRef.current) setIsRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchLocations();
    const interval = setInterval(() => void fetchLocations(), intervalMs);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLocations, intervalMs]);

  return { locations, isRefreshing, refetch: fetchLocations };
}
