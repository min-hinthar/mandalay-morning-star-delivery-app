"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { m, LayoutGroup } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cardContainer } from "@/components/ui/admin/CardRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/lib/hooks/useToastV8";
import { OpsOrderRow } from "./OpsOrderRow";
import type { OpsOrder } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OpsOrderListProps {
  groupedOrders: Map<string, OpsOrder[]>;
  selectedIds: Set<string>;
  onSelectionChange: (fn: (prev: Set<string>) => Set<string>) => void;
  statusFilter: string | null;
  onClearFilter: () => void;
  /** All orders (unfiltered by status) for extracting needsContact */
  allOrders?: OpsOrder[];
  /** Called after marking an order as contacted to refresh data */
  onRefresh?: () => void;
}

// ============================================
// HELPERS
// ============================================

function formatWindowLabel(key: string): string {
  if (key === "Unscheduled") return "Unscheduled";
  try {
    return format(parseISO(key), "h:mm a");
  } catch {
    return key;
  }
}

// ============================================
// COMPONENT
// ============================================

export function OpsOrderList({
  groupedOrders,
  selectedIds,
  onSelectionChange,
  statusFilter,
  onClearFilter,
  allOrders,
  onRefresh,
}: OpsOrderListProps) {
  const [contactingId, setContactingId] = useState<string | null>(null);

  const needsContactOrders = useMemo(
    () => (allOrders ?? []).filter((o) => o.needsContact),
    [allOrders]
  );

  async function handleMarkContacted(orderId: string) {
    try {
      setContactingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/contact`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to mark as contacted");
      }
      toast({ message: "Order marked as contacted", type: "success" });
      onRefresh?.();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to mark as contacted",
        type: "error",
      });
    } finally {
      setContactingId(null);
    }
  }
  // Flat list of all visible order IDs
  const allVisibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const orders of groupedOrders.values()) {
      for (const order of orders) {
        ids.push(order.id);
      }
    }
    return ids;
  }, [groupedOrders]);

  const totalVisible = allVisibleIds.length;
  const selectedCount = selectedIds.size;
  const allSelected = totalVisible > 0 && selectedCount === totalVisible;
  const someSelected = selectedCount > 0 && selectedCount < totalVisible;

  // Select All toggle
  function handleSelectAll() {
    if (allSelected) {
      onSelectionChange(() => new Set());
    } else {
      onSelectionChange(() => new Set(allVisibleIds));
    }
  }

  // Toggle single order
  function handleToggle(id: string) {
    onSelectionChange((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Empty state
  if (totalVisible === 0) {
    return (
      <EmptyState
        title="No orders"
        description={
          statusFilter ? "No orders match this filter. Try clearing the filter." : "No orders yet."
        }
        actionLabel={statusFilter ? "Clear filter" : undefined}
        onAction={statusFilter ? onClearFilter : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Needs Contact section */}
      {needsContactOrders.length > 0 && (
        <div className="rounded-xl border-2 border-status-error/30 bg-status-error/[0.03] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-status-error" />
            <h3 className="text-sm font-semibold text-status-error">
              Needs Contact ({needsContactOrders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {needsContactOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-lg border border-status-error/20 bg-surface-primary px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {order.customerName ?? order.customerEmail}
                  </p>
                  <p className="text-xs text-text-muted font-mono">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Badge variant="status-error" size="sm">
                  Email Failed
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkContacted(order.id)}
                  disabled={contactingId === order.id}
                  className="text-xs shrink-0"
                >
                  {contactingId === order.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Mark Contacted"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select All header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 rounded-lg border border-border bg-surface-primary/95 px-4 py-2 backdrop-blur-sm">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={handleSelectAll}
          aria-label="Select all orders"
        />
        <span className="text-sm text-text-secondary">
          {selectedCount > 0
            ? `${selectedCount} of ${totalVisible} selected`
            : `${totalVisible} order${totalVisible !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Grouped order list */}
      <LayoutGroup>
        {[...groupedOrders.entries()].map(([windowKey, orders]) => (
          <div key={windowKey} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-sm font-semibold text-text-secondary">
                {formatWindowLabel(windowKey)}
              </h3>
              <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-muted">
                {orders.length}
              </span>
            </div>

            {/* Order rows */}
            <m.div
              variants={cardContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {orders.map((order) => (
                <OpsOrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.has(order.id)}
                  onToggle={handleToggle}
                />
              ))}
            </m.div>
          </div>
        ))}
      </LayoutGroup>
    </div>
  );
}
