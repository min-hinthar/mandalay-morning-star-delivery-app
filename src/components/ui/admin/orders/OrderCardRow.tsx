"use client";

import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { CardRow } from "@/components/ui/admin/CardRow";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import type { AdminOrder } from "@/components/ui/admin/OrdersTable";

// ============================================
// STATUS TINT MAP
// ============================================

const STATUS_TINTS: Record<string, string> = {
  pending: "bg-amber-50/50 dark:bg-amber-950/20",
  confirmed: "bg-teal-50/50 dark:bg-teal-950/20",
  preparing: "bg-purple-50/50 dark:bg-purple-950/20",
  out_for_delivery: "bg-blue-50/50 dark:bg-blue-950/20",
  delivered: "bg-green-50/50 dark:bg-green-950/20",
  cancelled: "bg-gray-50/50 dark:bg-gray-950/20",
};

// ============================================
// HELPERS
// ============================================

function formatRelativeDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

// ============================================
// TYPES
// ============================================

export interface OrderCardRowProps {
  order: AdminOrder;
  selected?: boolean;
  onClick?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function OrderCardRow({ order, selected = false, onClick }: OrderCardRowProps) {
  const tint = STATUS_TINTS[order.status] ?? "";

  return (
    <CardRow statusTint={tint} selected={selected} onClick={onClick} className="gap-3">
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4 w-full">
        {/* Order ID */}
        <span className="font-mono text-sm text-text-secondary w-[100px] flex-shrink-0">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>

        {/* Customer */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-text-primary truncate">
            {order.customerName || "Guest"}
          </p>
          <p className="text-xs text-text-muted truncate">{order.customerEmail}</p>
        </div>

        {/* Items count */}
        <span className="text-sm text-text-secondary w-[60px] text-center flex-shrink-0">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>

        {/* Total */}
        <span className="font-medium text-sm text-text-primary w-[80px] text-right flex-shrink-0">
          {formatPrice(order.totalCents)}
        </span>

        {/* Status badge */}
        <div className="w-[130px] flex-shrink-0">
          <StatusBadge status={order.status} />
        </div>

        {/* Date */}
        <span className="text-xs text-text-muted w-[140px] text-right flex-shrink-0">
          {formatRelativeDate(order.placedAt)}
        </span>

        {/* View button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-accent-teal hover:text-accent-teal hover:bg-accent-teal/10"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>

      {/* Mobile layout */}
      <div className="flex sm:hidden flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="text-xs text-text-muted">{formatRelativeDate(order.placedAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm text-text-primary truncate">
            {order.customerName || "Guest"}
          </p>
          <span className="font-medium text-sm text-text-primary">
            {formatPrice(order.totalCents)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
          <span>
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
    </CardRow>
  );
}
