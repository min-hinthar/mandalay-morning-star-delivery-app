"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Package,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
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
import {
  ExpandableTableRow,
  QuickPreviewPanel,
  useExpandedRows,
} from "@/components/admin/ExpandableTableRow";
import type { OrderStatus } from "@/types/database";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  preparing: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  delivered: "bg-green-100 text-green-800 hover:bg-green-200",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
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
}

type SortField = "placedAt" | "status" | "totalCents" | "deliveryWindowStart";
type SortDirection = "asc" | "desc";

export function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>("placedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { isExpanded, handleExpandChange } = useExpandedRows();

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
        <div className="rounded-full bg-muted/50 w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-2">No orders found</h2>
        <p className="text-muted-foreground">
          Orders will appear here once customers place them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
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

            return (
              <ExpandableTableRow
                key={order.id}
                id={order.id}
                isExpanded={isExpanded(order.id)}
                onExpandChange={handleExpandChange}
                colSpan={8}
                previewContent={
                  <OrderQuickPreview order={order} />
                }
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
                    <span className="text-muted-foreground">—</span>
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
                          View Details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </ExpandableTableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// ORDER QUICK PREVIEW
// ============================================

function OrderQuickPreview({ order }: { order: AdminOrder }) {
  return (
    <QuickPreviewPanel
      items={[
        { name: `${order.itemCount} item(s)`, quantity: 1 },
      ]}
      detailsLink={`/admin/orders/${order.id}`}
    >
      {/* Order Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-text-secondary">
          <User className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Customer
          </span>
        </div>
        <div className="text-sm">
          <p className="text-text-primary font-medium">
            {order.customerName || "Guest"}
          </p>
          <p className="text-text-secondary">{order.customerEmail}</p>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Delivery Window
          </span>
        </div>
        <p className="text-sm text-text-primary">
          {order.deliveryWindowStart
            ? format(parseISO(order.deliveryWindowStart), "EEEE, MMMM d, yyyy")
            : "Not scheduled"}
        </p>
      </div>

      {/* Order Total */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-text-secondary">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Order Total
          </span>
        </div>
        <p className="text-lg font-bold text-interactive-primary">
          {formatPrice(order.totalCents)}
        </p>
      </div>
    </QuickPreviewPanel>
  );
}
