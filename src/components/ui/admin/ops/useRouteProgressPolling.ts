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
 * Returns today's active routes with driver info and stats.
 */
export function useRouteProgressPolling(intervalMs = 5000): RouteProgressState {
  const [routes, setRoutes] = useState<RouteProgressItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref to prevent stale closure in interval callback
  const isMountedRef = useRef(true);

  const fetchRoutes = useCallback(async () => {
    if (isMountedRef.current) {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch("/api/admin/ops/routes-progress");
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
  }, []);

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
