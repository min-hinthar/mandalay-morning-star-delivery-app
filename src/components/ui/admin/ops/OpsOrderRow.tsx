"use client";

import { m } from "framer-motion";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { cardItem } from "@/components/ui/admin/CardRow";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import type { OpsOrder } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OpsOrderRowProps {
  order: OpsOrder;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

// ============================================
// HELPERS
// ============================================

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

// ============================================
// COMPONENT
// ============================================

export function OpsOrderRow({ order, isSelected, onToggle }: OpsOrderRowProps) {
  return (
    <m.div
      variants={cardItem}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        isSelected
          ? "border-accent-teal/40 bg-accent-teal/[0.04]"
          : "border-border bg-surface-primary hover:bg-surface-secondary"
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(order.id)}
        aria-label={`Select order from ${order.customerName ?? order.customerEmail}`}
      />

      {/* Customer name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {order.customerName ?? order.customerEmail}
        </p>
        <p className="text-xs text-text-muted">
          {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} &middot;{" "}
          {formatRelativeTime(order.placedAt)}
        </p>
      </div>

      {/* Status badge */}
      <StatusBadge status={order.status} />

      {/* Total */}
      <span className="hidden text-sm font-semibold tabular-nums text-text-primary sm:block">
        {formatCents(order.totalCents)}
      </span>

      {/* Assigned indicator */}
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          order.isAssigned ? "bg-green-500" : "bg-red-500"
        )}
        title={order.isAssigned ? "Assigned to route" : "Not assigned"}
        aria-label={order.isAssigned ? "Assigned" : "Unassigned"}
      />
    </m.div>
  );
}
