"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Search, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { cardContainer, cardItem } from "@/components/ui/admin/CardRow";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "./helpers";
import type { BuilderOrder } from "./helpers";
import type { OrderCluster } from "@/lib/utils/clustering";

// ============================================
// TYPES
// ============================================

interface UnassignedOrdersPanelProps {
  orders: BuilderOrder[];
  clusters: OrderCluster[];
  unclusteredIds: string[];
  selectedIds: Set<string>;
  onToggleOrder: (id: string) => void;
  onSelectCluster: (cluster: OrderCluster) => void;
}

// ============================================
// ORDER CARD
// ============================================

function OrderCard({
  order,
  isSelected,
  clusterColor,
  onToggle,
}: {
  order: BuilderOrder;
  isSelected: boolean;
  clusterColor?: string;
  onToggle: () => void;
}) {
  const address = [order.addressLine1, order.city].filter(Boolean).join(", ") || "Address unknown";

  return (
    <m.div
      variants={cardItem}
      onClick={onToggle}
      className={cn(
        "rounded-xl p-3 bg-surface-primary border border-border cursor-pointer transition-all",
        isSelected && "ring-2 shadow-md bg-surface-secondary"
      )}
      style={
        isSelected && clusterColor
          ? ({
              "--tw-ring-color": clusterColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-text-primary truncate">
              {order.customerName ?? order.customerEmail}
            </p>
            <span className="text-xs font-medium text-text-secondary shrink-0">
              {formatCurrency(order.totalCents)}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">{address}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-muted">{order.itemCount} items</span>
            {order.deliveryWindowStart && (
              <span className="text-xs text-text-muted">
                {new Date(order.deliveryWindowStart).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}

// ============================================
// CLUSTER SECTION
// ============================================

function ClusterSection({
  cluster,
  orders,
  selectedIds,
  onToggleOrder,
  onSelectCluster,
}: {
  cluster: OrderCluster;
  orders: BuilderOrder[];
  selectedIds: Set<string>;
  onToggleOrder: (id: string) => void;
  onSelectCluster: (cluster: OrderCluster) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = cluster.orderIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectedCount === cluster.orderIds.length;

  return (
    <div className="space-y-2">
      {/* Cluster header */}
      <div
        className="flex items-center justify-between cursor-pointer py-1"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: cluster.color }}
          />
          <span className="text-sm font-semibold text-text-primary">{cluster.label}</span>
          {selectedCount > 0 && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full text-text-inverse"
              style={{ backgroundColor: cluster.color }}
            >
              {selectedCount}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCluster(cluster);
          }}
          className={cn(
            "text-xs font-medium px-2 py-1 rounded-lg transition-colors",
            allSelected
              ? "text-text-muted hover:text-text-secondary bg-surface-secondary hover:bg-surface-tertiary"
              : "text-accent-teal hover:text-accent-teal/80 bg-accent-teal/10 hover:bg-accent-teal/20"
          )}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Order cards */}
      {isExpanded && (
        <m.div variants={cardContainer} initial="hidden" animate="show" className="space-y-2 pl-5">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedIds.has(order.id)}
              clusterColor={cluster.color}
              onToggle={() => onToggleOrder(order.id)}
            />
          ))}
        </m.div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UnassignedOrdersPanel({
  orders,
  clusters,
  unclusteredIds,
  selectedIds,
  onToggleOrder,
  onSelectCluster,
}: UnassignedOrdersPanelProps) {
  const [search, setSearch] = useState("");

  const orderMap = new Map(orders.map((o) => [o.id, o]));

  // Filter orders by search
  const filterOrder = (order: BuilderOrder): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (order.customerName?.toLowerCase().includes(q) ?? false) ||
      order.customerEmail.toLowerCase().includes(q) ||
      (order.addressLine1?.toLowerCase().includes(q) ?? false) ||
      (order.city?.toLowerCase().includes(q) ?? false)
    );
  };

  const filteredClusters = clusters
    .map((cluster) => ({
      cluster,
      orders: cluster.orderIds
        .map((id) => orderMap.get(id))
        .filter((o): o is BuilderOrder => o !== undefined && filterOrder(o)),
    }))
    .filter(({ orders: clusterOrders }) => clusterOrders.length > 0);

  const unclusteredOrders = unclusteredIds
    .map((id) => orderMap.get(id))
    .filter((o): o is BuilderOrder => o !== undefined && filterOrder(o));

  const totalUnassigned = orders.length;

  if (totalUnassigned === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No unassigned orders"
        description="All confirmed and preparing orders have been assigned to routes."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or address..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface-primary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal/50"
        />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">
          {totalUnassigned} unassigned order{totalUnassigned !== 1 ? "s" : ""}
        </span>
        {selectedIds.size > 0 && (
          <span className="text-accent-teal font-medium">{selectedIds.size} selected</span>
        )}
      </div>

      {/* Clusters */}
      <div className="space-y-5">
        {filteredClusters.map(({ cluster, orders: clusterOrders }) => (
          <ClusterSection
            key={cluster.label}
            cluster={cluster}
            orders={clusterOrders}
            selectedIds={selectedIds}
            onToggleOrder={onToggleOrder}
            onSelectCluster={onSelectCluster}
          />
        ))}

        {/* Location Unknown section */}
        {unclusteredOrders.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full shrink-0 bg-text-muted" />
              <span className="text-sm font-semibold text-text-primary">
                Location Unknown &mdash; {unclusteredOrders.length} order
                {unclusteredOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
            <m.div
              variants={cardContainer}
              initial="hidden"
              animate="show"
              className="space-y-2 pl-5"
            >
              {unclusteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.has(order.id)}
                  onToggle={() => onToggleOrder(order.id)}
                />
              ))}
            </m.div>
          </div>
        )}

        {/* No results after search */}
        {filteredClusters.length === 0 && unclusteredOrders.length === 0 && search && (
          <EmptyState
            icon={Search}
            title="No matching orders"
            description={`No orders match "${search}"`}
          />
        )}
      </div>
    </div>
  );
}
