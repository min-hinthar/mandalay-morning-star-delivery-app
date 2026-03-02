"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OrderStatus } from "@/types/database";
import type { OpsOrder } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OpsPollingState {
  orders: OpsOrder[];
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  isRefreshing: boolean;
  statusFilter: OrderStatus | "all";
  setStatusFilter: (filter: OrderStatus | "all") => void;
  refetch: () => Promise<void>;
  isBulkOperating: boolean;
  setIsBulkOperating: (v: boolean) => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Polls /api/admin/ops/orders at the given interval.
 * Preserves selection across refreshes, prunes stale IDs.
 * Pauses polling during bulk operations.
 */
export function useOpsPolling(intervalMs = 5000): OpsPollingState {
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Use ref to avoid stale closures in interval
  const isBulkRef = useRef(isBulkOperating);
  isBulkRef.current = isBulkOperating;

  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const fetchOrders = useCallback(async () => {
    if (isBulkRef.current) return;

    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/ops/orders");
      if (!res.ok) return;
      const data: OpsOrder[] = await res.json();
      setOrders(data);

      // Prune selected IDs: only keep IDs present in filtered view
      const currentFilter = statusFilterRef.current;
      const filteredIds = new Set(
        data.filter((o) => currentFilter === "all" || o.status === currentFilter).map((o) => o.id)
      );
      const currentSelected = selectedIdsRef.current;
      const pruned = new Set([...currentSelected].filter((id) => filteredIds.has(id)));
      if (pruned.size !== currentSelected.size) {
        setSelectedIds(pruned);
      }
    } catch {
      // Silently fail — next poll will retry
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    void fetchOrders();

    const interval = setInterval(() => {
      void fetchOrders();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchOrders, intervalMs]);

  return {
    orders,
    selectedIds,
    setSelectedIds,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    refetch: fetchOrders,
    isBulkOperating,
    setIsBulkOperating,
  };
}
