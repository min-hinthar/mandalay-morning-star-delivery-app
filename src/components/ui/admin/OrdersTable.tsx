"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreHorizontal,
  Package,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { spring } from "@/lib/motion-tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetailExpanded } from "@/components/ui/admin/orders/OrderDetailExpanded";
import type { OrderStatus } from "@/types/database";

/**
 * V6 Status Colors - Pepper Aesthetic
 * Using V6 color palette for consistent branding
 */
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-secondary-light text-secondary-hover hover:bg-secondary/20",
  confirmed: "bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20",
  preparing: "bg-accent-magenta/10 text-accent-magenta hover:bg-accent-magenta/20",
  out_for_delivery: "bg-primary/10 text-primary hover:bg-primary/20",
  delivered: "bg-green/10 text-green hover:bg-green/20",
  cancelled: "bg-status-error/10 text-status-error hover:bg-status-error/20",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Status transition rules
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

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
}

type SortField = "placedAt" | "status" | "totalCents" | "deliveryWindowStart";
type SortDirection = "asc" | "desc";

export function OrdersTable({ orders, onStatusChange, onRefresh }: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>("placedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // ESC key handler to collapse expanded row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedOrderId) {
        setExpandedOrderId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedOrderId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "placedAt":
        comparison = new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
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
        else comparison = new Date(a.deliveryWindowStart).getTime() - new Date(b.deliveryWindowStart).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await onStatusChange(orderId, newStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRowClick = useCallback(
    (orderId: string, e: React.MouseEvent) => {
      // Don't expand if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("button") ||
        target.closest("a") ||
        target.closest('[role="menuitem"]') ||
        target.closest('[data-radix-collection-item]') ||
        target.closest('[data-state]');

      if (isInteractive) return;

      // Toggle: click same row to collapse, different row to expand that one
      setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
    },
    []
  );

  const handleExpandedUpdate = useCallback(() => {
    // Refresh the orders list when expanded view makes changes
    onRefresh?.();
  }, [onRefresh]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="rounded-full bg-surface-tertiary w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-text-muted" />
        </div>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-2">
          No orders found
        </h2>
        <p className="text-text-muted font-body">
          Orders will appear here once customers place them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card-sm border border-border bg-surface-primary shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("placedAt")}
            >
              Placed
              <SortIcon field="placedAt" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("deliveryWindowStart")}
            >
              Delivery
              <SortIcon field="deliveryWindowStart" />
            </TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort("totalCents")}
            >
              Total
              <SortIcon field="totalCents" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("status")}
            >
              Status
              <SortIcon field="status" />
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const nextStatuses = NEXT_STATUSES[order.status];
            const isExpanded = expandedOrderId === order.id;

            return (
              <Fragment key={order.id}>
                {/* Main Row */}
                <TableRow
                  onClick={(e) => handleRowClick(order.id, e)}
                  className={cn(
                    "cursor-pointer transition-colors duration-fast group",
                    "hover:bg-surface-secondary/50",
                    isExpanded && "bg-surface-secondary border-b-0"
                  )}
                >
                  <TableCell className="font-mono text-sm">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {order.customerName || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(order.placedAt), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.deliveryWindowStart ? (
                      <span>{format(parseISO(order.deliveryWindowStart), "EEE, MMM d")}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.totalCents)}
                  </TableCell>
                  <TableCell>
                    {nextStatuses.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge
                            className={cn(
                              STATUS_COLORS[order.status],
                              "cursor-pointer",
                              isUpdating && "opacity-50"
                            )}
                          >
                            {isUpdating ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {nextStatuses.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(order.id, status)}
                            >
                              <Badge className={cn(STATUS_COLORS[status], "mr-2")}>
                                {STATUS_LABELS[status]}
                              </Badge>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge className={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Full Page
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="w-8 pr-4">
                    <motion.div
                      initial={false}
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={spring.default}
                      className="text-text-muted group-hover:text-primary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </TableCell>
                </TableRow>

                {/* Expanded Detail Row */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="p-0 border-b border-border">
                        <motion.div
                          key={`expanded-${order.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.2, delay: 0.1 },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="relative">
                            {/* Left accent border */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent" />

                            {/* Content container */}
                            <div className="pl-6 pr-4 py-6 bg-gradient-to-r from-surface-secondary to-surface-primary">
                              <OrderDetailExpanded
                                orderId={order.id}
                                onUpdate={handleExpandedUpdate}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
