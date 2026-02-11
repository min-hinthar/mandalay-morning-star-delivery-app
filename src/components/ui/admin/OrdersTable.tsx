"use client";

import { useState, useMemo, useCallback } from "react";
import { parseISO, isToday, isYesterday, format } from "date-fns";
import { m, LayoutGroup } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cardContainer, cardItem } from "@/components/ui/admin/CardRow";
import { OrderCardRow } from "@/components/ui/admin/orders/OrderCardRow";
import { OrderDetailDrawer } from "@/components/ui/admin/orders/OrderDetailDrawer";
import type { OrderStatus } from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string;
}

interface OrdersTableProps {
  orders: AdminOrder[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onRefresh?: () => void;
  /** True if showing filtered subset (affects empty state variant) */
  isFiltered?: boolean;
  /** Callback to clear filters (for filtered empty state) */
  onClearFilters?: () => void;
}

type SortField = "placedAt" | "status" | "totalCents" | "deliveryWindowStart";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 20;

// ============================================
// HELPERS
// ============================================

interface DateGroup {
  label: string;
  orders: AdminOrder[];
}

function groupOrdersByDate(orders: AdminOrder[]): DateGroup[] {
  const groups = new Map<string, AdminOrder[]>();

  for (const order of orders) {
    const date = parseISO(order.placedAt);
    let label: string;
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else label = format(date, "EEEE, MMM d, yyyy");

    const existing = groups.get(label);
    if (existing) existing.push(order);
    else groups.set(label, [order]);
  }

  return Array.from(groups.entries()).map(([label, groupOrders]) => ({
    label,
    orders: groupOrders,
  }));
}

// ============================================
// SORT HEADER
// ============================================

function SortButton({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider",
        "text-text-muted hover:text-text-primary transition-colors",
        isActive && "text-accent-teal",
        className
      )}
    >
      {label}
      {isActive &&
        (sortDirection === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        ))}
    </button>
  );
}

// ============================================
// COMPONENT
// ============================================

export function OrdersTable({
  orders,
  onStatusChange,
  isFiltered = false,
  onClearFilters,
}: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>("placedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "placedAt":
          comparison =
            new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "totalCents":
          comparison = a.totalCents - b.totalCents;
          break;
        case "deliveryWindowStart":
          if (!a.deliveryWindowStart && !b.deliveryWindowStart) comparison = 0;
          else if (!a.deliveryWindowStart) comparison = 1;
          else if (!b.deliveryWindowStart) comparison = -1;
          else
            comparison =
              new Date(a.deliveryWindowStart).getTime() -
              new Date(b.deliveryWindowStart).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [orders, sortField, sortDirection]);

  const paginatedOrders = useMemo(
    () => sortedOrders.slice(0, visibleCount),
    [sortedOrders, visibleCount]
  );

  const dateGroups = useMemo(
    () => groupOrdersByDate(paginatedOrders),
    [paginatedOrders]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const hasMore = sortedOrders.length > visibleCount;

  // Empty states
  if (orders.length === 0) {
    if (isFiltered) {
      return (
        <EmptyState
          variant="admin-orders-filtered"
          onAction={onClearFilters}
        />
      );
    }
    return <EmptyState variant="admin-orders" />;
  }

  return (
    <>
      {/* Sticky column header (desktop) */}
      <div className="hidden sm:flex items-center gap-4 sticky top-0 z-10 bg-surface-primary/95 shadow-sm rounded-xl px-4 py-2 mb-3">
        <span className="w-[100px] text-xs font-semibold uppercase tracking-wider text-text-muted">
          Order
        </span>
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Customer
        </span>
        <span className="w-[60px] text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
          Items
        </span>
        <SortButton
          label="Total"
          field="totalCents"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="w-[80px] justify-end"
        />
        <SortButton
          label="Status"
          field="status"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="w-[130px]"
        />
        <SortButton
          label="Date"
          field="placedAt"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="w-[140px] justify-end"
        />
        <span className="w-[70px]" />
      </div>

      {/* Card rows grouped by date */}
      <LayoutGroup>
        {dateGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {/* Date section header */}
            <div className="sticky top-10 sm:top-12 z-[5] bg-surface-primary/90 px-2 py-1.5 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {group.label}
              </span>
            </div>

            <m.div
              variants={cardContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {group.orders.map((order) => (
                <m.div
                  key={order.id}
                  variants={cardItem}
                  layout
                  transition={spring.gentle}
                >
                  <OrderCardRow
                    order={order}
                    selected={selectedOrderId === order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                  />
                </m.div>
              ))}
            </m.div>
          </div>
        ))}
      </LayoutGroup>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4 pb-2">
          <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="text-accent-teal border-accent-teal/30 hover:bg-accent-teal/10"
            >
              Load More ({sortedOrders.length - visibleCount} remaining)
            </Button>
          </m.div>
        </div>
      )}

      {/* Order detail drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        onStatusChange={onStatusChange}
      />
    </>
  );
}
