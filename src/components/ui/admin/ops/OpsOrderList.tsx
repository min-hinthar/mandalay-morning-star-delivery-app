"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { m, LayoutGroup } from "framer-motion";
import { cardContainer } from "@/components/ui/admin/CardRow";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
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
}: OpsOrderListProps) {
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
          statusFilter
            ? "No orders match this filter. Try clearing the filter."
            : "No orders yet."
        }
        actionLabel={statusFilter ? "Clear filter" : undefined}
        onAction={statusFilter ? onClearFilter : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
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
