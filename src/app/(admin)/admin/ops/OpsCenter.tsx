"use client";

import { useMemo, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { BusinessRules } from "@/lib/settings/business-rules";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { OpsCountdownBar } from "@/components/ui/admin/ops/OpsCountdownBar";
import { OpsKPIGrid } from "@/components/ui/admin/ops/OpsKPIGrid";
import { OpsOrderList } from "@/components/ui/admin/ops/OpsOrderList";
import { OpsBulkToolbar } from "@/components/ui/admin/ops/OpsBulkToolbar";
import { OpsDriverPanel } from "@/components/ui/admin/ops/OpsDriverPanel";
import {
  useOpsPolling,
  useCountdown,
  computeStatusCounts,
  groupByTimeWindow,
  getNextSaturday,
  getDeliveryStart,
} from "@/components/ui/admin/ops";

// ============================================
// TYPES
// ============================================

export interface OpsCenterProps {
  rules: BusinessRules;
}

// ============================================
// COMPONENT
// ============================================

export function OpsCenter({ rules }: OpsCenterProps) {
  const {
    orders,
    selectedIds,
    setSelectedIds,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    refetch,
    setIsBulkOperating,
  } = useOpsPolling();

  // Countdown targets
  const cutoffTarget = useMemo(
    () => getNextSaturday(rules.cutoffDay, rules.cutoffHour),
    [rules.cutoffDay, rules.cutoffHour]
  );
  const deliveryTarget = useMemo(
    () => getDeliveryStart(rules.deliveryStartHour),
    [rules.deliveryStartHour]
  );

  const cutoffState = useCountdown(cutoffTarget, "Order Cutoff");
  const deliveryState = useCountdown(deliveryTarget, "Delivery Start");

  // Computed values
  const statusCounts = useMemo(() => computeStatusCounts(orders), [orders]);

  const unassignedCount = useMemo(
    () => orders.filter((o) => o.status === "confirmed" && !o.isAssigned).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const groupedOrders = useMemo(() => groupByTimeWindow(filteredOrders), [filteredOrders]);

  // Handlers
  const handleBulkComplete = useCallback(() => {
    setSelectedIds(new Set());
    void refetch();
  }, [setSelectedIds, refetch]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  const handleBulkStart = useCallback(() => {
    setIsBulkOperating(true);
  }, [setIsBulkOperating]);

  const handleBulkEnd = useCallback(() => {
    setIsBulkOperating(false);
  }, [setIsBulkOperating]);

  const handleClearFilter = useCallback(() => {
    setStatusFilter("all");
  }, [setStatusFilter]);

  const handleSelectionChange = useCallback(
    (fn: (prev: Set<string>) => Set<string>) => {
      setSelectedIds(fn(selectedIds));
    },
    [setSelectedIds, selectedIds]
  );

  return (
    <div className="space-y-6">
      {/* Header with refresh indicator */}
      <AdminPageHeader
        title="Ops Center"
        count={orders.length}
        actions={
          <m.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }
            }
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-text-muted transition-opacity",
                isRefreshing ? "opacity-100" : "opacity-40"
              )}
            />
          </m.div>
        }
      />

      {/* Sticky countdown bar */}
      <OpsCountdownBar cutoff={cutoffState} deliveryStart={deliveryState} />

      {/* KPI filter grid */}
      <OpsKPIGrid
        counts={statusCounts}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        unassignedCount={unassignedCount}
      />

      {/* Order list with checkboxes and time window grouping */}
      <OpsOrderList
        groupedOrders={groupedOrders}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        statusFilter={statusFilter === "all" ? null : statusFilter}
        onClearFilter={handleClearFilter}
        allOrders={orders}
        onRefresh={refetch}
      />

      {/* Driver readiness panel */}
      <OpsDriverPanel />

      {/* Bulk toolbar (floating at bottom) */}
      <OpsBulkToolbar
        selectedIds={selectedIds}
        orders={filteredOrders}
        onComplete={handleBulkComplete}
        onBulkStart={handleBulkStart}
        onBulkEnd={handleBulkEnd}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
