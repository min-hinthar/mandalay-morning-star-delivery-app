"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrdersTable, type AdminOrder } from "@/components/ui/admin/OrdersTable";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { InlineErrorCard } from "@/components/ui/admin/InlineErrorCard";
import { OrdersPageSkeleton } from "@/components/ui/admin/orders/OrdersPageSkeleton";
import { toast } from "@/lib/hooks/useToastV8";
import type { OrderStatus, RefundStatus } from "@/types/database";

// ============================================
// CONSTANTS
// ============================================

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// ============================================
// TYPES
// ============================================

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  payment_method: string | null;
  order_items: Array<{ quantity: number }>;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

// ============================================
// COMPONENT
// ============================================

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [refundFilter, setRefundFilter] = useState<"all" | "partial" | "full">("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const json = await response.json();
      const data: OrderRow[] = json.data ?? json;

      const transformedOrders: AdminOrder[] = data.map((order) => ({
        id: order.id,
        status: order.status,
        refundStatus: order.refund_status,
        totalCents: order.total_cents,
        deliveryWindowStart: order.delivery_window_start,
        placedAt: order.placed_at,
        itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
        customerName: order.profiles?.full_name || null,
        customerEmail: order.profiles?.email || "Unknown",
        paymentMethod: (order.payment_method as "stripe" | "cod") ?? "stripe",
      }));

      setOrders(transformedOrders);
    } catch {
      setError("Failed to load orders. Please try again.");
      toast({
        message: "Failed to fetch orders",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(extractErrorMessage(err, "Failed to update status"));
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );

      router.refresh();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to update status",
        type: "error",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (refundFilter !== "all" && order.refundStatus !== refundFilter) return false;
    return true;
  });

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  const refundCounts = orders.reduce(
    (acc, order) => {
      if (order.refundStatus === "partial") acc.partial++;
      if (order.refundStatus === "full") acc.full++;
      return acc;
    },
    { partial: 0, full: 0 }
  );

  const isFiltered = statusFilter !== "all" || refundFilter !== "all";

  return (
    <div className="p-8">
      <SkeletonCrossfade isLoading={loading} skeleton={<OrdersPageSkeleton />}>
        {/* Header */}
        <AdminPageHeader
          title="Orders"
          count={filteredOrders.length}
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Orders" }]}
          actions={
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          }
        />

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-2 text-text-muted mr-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filter:</span>
          </div>
          {STATUS_FILTERS.map((filter) => {
            const count = filter.value === "all" ? orders.length : statusCounts[filter.value] || 0;
            const isActive = statusFilter === filter.value;

            return (
              <Badge
                key={filter.value}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  isActive ? "bg-accent-teal hover:bg-accent-teal/90" : "hover:bg-muted"
                )}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
                {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
              </Badge>
            );
          })}
        </div>

        {/* Refund Status Filters */}
        {(refundCounts.partial > 0 || refundCounts.full > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-2 text-text-muted mr-2">
              <span className="text-sm">Refund:</span>
            </div>
            {(
              [
                { value: "all" as const, label: "All" },
                { value: "partial" as const, label: "Partial Refund", count: refundCounts.partial },
                { value: "full" as const, label: "Full Refund", count: refundCounts.full },
              ] as const
            ).map((filter) => (
              <Badge
                key={filter.value}
                variant={refundFilter === filter.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  refundFilter === filter.value
                    ? filter.value === "partial"
                      ? "bg-amber-500 hover:bg-amber-500/90 text-text-inverse"
                      : filter.value === "full"
                        ? "bg-red-500 hover:bg-red-500/90 text-text-inverse"
                        : "bg-accent-teal hover:bg-accent-teal/90"
                    : "hover:bg-muted"
                )}
                onClick={() => setRefundFilter(filter.value)}
              >
                {filter.label}
                {"count" in filter && filter.count > 0 && (
                  <span className="ml-1 text-xs opacity-70">({filter.count})</span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {/* Error state */}
        {error ? (
          <InlineErrorCard message={error} onRetry={handleRefresh} />
        ) : (
          /* Orders card rows */
          <OrdersTable
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onRefresh={handleRefresh}
            isFiltered={isFiltered}
            onClearFilters={() => {
              setStatusFilter("all");
              setRefundFilter("all");
            }}
          />
        )}
      </SkeletonCrossfade>
    </div>
  );
}
