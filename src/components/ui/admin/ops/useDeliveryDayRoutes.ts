"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RouteStats, RouteStatus } from "@/types/driver";

export interface DeliveryDayRoute {
  id: string;
  status: RouteStatus;
  driverName: string | null;
  stats: RouteStats | null;
  stopCount: number;
  exceptionCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DeliveryDaySummary {
  totalRoutes: number;
  completedRoutes: number;
  inProgressRoutes: number;
  plannedRoutes: number;
  totalStops: number;
  deliveredStops: number;
  exceptions: number;
}

export interface DeliveryDayRoutesState {
  routes: DeliveryDayRoute[];
  summary: DeliveryDaySummary;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const EMPTY_SUMMARY: DeliveryDaySummary = {
  totalRoutes: 0,
  completedRoutes: 0,
  inProgressRoutes: 0,
  plannedRoutes: 0,
  totalStops: 0,
  deliveredStops: 0,
  exceptions: 0,
};

function summarize(routes: DeliveryDayRoute[]): DeliveryDaySummary {
  return routes.reduce<DeliveryDaySummary>(
    (acc, r) => {
      acc.totalRoutes += 1;
      if (r.status === "completed") acc.completedRoutes += 1;
      else if (r.status === "in_progress") acc.inProgressRoutes += 1;
      else if (r.status === "planned") acc.plannedRoutes += 1;
      acc.totalStops += r.stats?.total_stops ?? r.stopCount ?? 0;
      acc.deliveredStops += r.stats?.delivered_stops ?? 0;
      acc.exceptions += r.exceptionCount ?? 0;
      return acc;
    },
    { ...EMPTY_SUMMARY }
  );
}

/**
 * Polls /api/admin/routes?date= for the full route set of a delivery day
 * (all statuses, including completed) and derives day-level totals. Slower
 * cadence than the live order/location polls.
 */
export function useDeliveryDayRoutes(date: string, intervalMs = 10000): DeliveryDayRoutesState {
  const [routes, setRoutes] = useState<DeliveryDayRoute[]>([]);
  const [summary, setSummary] = useState<DeliveryDaySummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/routes?date=${date}&limit=100`);
      if (!res.ok) return;
      const json = await res.json();
      const list = (json.data ?? json) as DeliveryDayRoute[];
      if (isMountedRef.current) {
        setRoutes(list);
        setSummary(summarize(list));
      }
    } catch {
      // Silent -- next poll retries
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    void fetchRoutes();
    const interval = setInterval(() => void fetchRoutes(), intervalMs);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRoutes, intervalMs]);

  return { routes, summary, isLoading, refetch: fetchRoutes };
}
