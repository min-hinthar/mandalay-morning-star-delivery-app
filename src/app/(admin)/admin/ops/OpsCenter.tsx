"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { BusinessRules } from "@/lib/settings/business-rules";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { OpsCountdownBar } from "@/components/ui/admin/ops/OpsCountdownBar";
import { OpsKPIGrid } from "@/components/ui/admin/ops/OpsKPIGrid";
import {
  useOpsPolling,
  useCountdown,
  computeStatusCounts,
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
    isRefreshing,
    statusFilter,
    setStatusFilter,
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

  return (
    <div className="space-y-6">
      {/* Header with refresh indicator */}
      <AdminPageHeader
        title="Ops Center"
        count={orders.length}
        actions={
          <m.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
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

      {/* Order list area -- wired in Task 2 */}
      <div id="ops-order-list" />

      {/* Driver panel area -- wired in Plan 03 */}
      <div id="ops-driver-panel" />
    </div>
  );
}
