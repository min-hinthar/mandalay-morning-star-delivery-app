"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RouteProgressItem } from "@/app/api/admin/ops/routes-progress/route";

// ============================================
// TYPES
// ============================================

export interface RouteProgressState {
  routes: RouteProgressItem[];
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Polls /api/admin/ops/routes-progress at the given interval.
 * Returns active routes with driver info and stats for the given delivery date
 * (defaults to today when `date` is omitted).
 */
export function useRouteProgressPolling(intervalMs = 5000, date?: string): RouteProgressState {
  const [routes, setRoutes] = useState<RouteProgressItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref to prevent stale closure in interval callback
  const isMountedRef = useRef(true);

  const fetchRoutes = useCallback(async () => {
    if (isMountedRef.current) {
      setIsRefreshing(true);
    }
    try {
      const url = date
        ? `/api/admin/ops/routes-progress?date=${date}`
        : "/api/admin/ops/routes-progress";
      const res = await fetch(url);
      if (!res.ok) return;
      const data: RouteProgressItem[] = await res.json();
      if (isMountedRef.current) {
        setRoutes(data);
      }
    } catch {
      // Silent -- next poll retries
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [date]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchRoutes();
    const interval = setInterval(() => void fetchRoutes(), intervalMs);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRoutes, intervalMs]);

  return { routes, isRefreshing, refetch: fetchRoutes };
}
