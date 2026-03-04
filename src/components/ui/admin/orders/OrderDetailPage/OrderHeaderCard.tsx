"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import {
  STATUS_LABELS,
  NEXT_STATUSES,
} from "@/components/ui/admin/orders/OrderDetailExpanded/config";
import type { OrderStatus } from "@/types/database";
import type { OrderDetail } from "./types";

interface OrderHeaderCardProps {
  order: OrderDetail;
  onStatusAction: (newStatus: OrderStatus) => void;
  onPriorityChanged: (isPriority: boolean) => void;
  onContactResolved?: () => void;
}

export function OrderHeaderCard({
  order,
  onStatusAction,
  onPriorityChanged,
  onContactResolved,
}: OrderHeaderCardProps) {
  const [togglingPriority, setTogglingPriority] = useState(false);
  const [markingContacted, setMarkingContacted] = useState(false);
  const nextStatuses = NEXT_STATUSES[order.status];

  const handleMarkContacted = async () => {
    try {
      setMarkingContacted(true);
      const res = await fetch(`/api/admin/orders/${order.id}/contact`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(extractErrorMessage(data, "Failed to mark as contacted"));
      }
      toast({ message: "Order marked as contacted", type: "success" });
      onContactResolved?.();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to mark as contacted",
        type: "error",
      });
    } finally {
      setMarkingContacted(false);
    }
  };

  function getEmailBadgeLabel(status: string): string {
    if (status === "opened") return "Delivered";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getEmailBadgeVariant(status: string) {
    if (status === "delivered" || status === "opened") return "status-success" as const;
    if (status === "failed" || status === "bounced") return "status-error" as const;
    return "status-warning" as const;
  }

  const handleTogglePriority = async () => {
    try {
      setTogglingPriority(true);
      const newPriority = !order.isPriority;
      const res = await fetch(`/api/admin/orders/${order.id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPriority: newPriority }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractErrorMessage(data, "Failed to update priority"));
      }
      onPriorityChanged(newPriority);
      toast({
        message: newPriority ? "Marked as priority" : "Priority removed",
        type: "info",
      });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to toggle priority",
        type: "error",
      });
    } finally {
      setTogglingPriority(false);
    }
  };

  // Format delivery window
  let deliveryWindowText: string | null = null;
  if (order.deliveryWindowStart && order.deliveryWindowEnd) {
    const start = format(parseISO(order.deliveryWindowStart), "MMM d, h:mm a");
    const end = format(parseISO(order.deliveryWindowEnd), "h:mm a");
    deliveryWindowText = `${start} - ${end}`;
  } else if (order.deliveryWindowStart) {
    deliveryWindowText = format(parseISO(order.deliveryWindowStart), "MMM d, h:mm a");
  }

  return (
    <div className="rounded-xl border border-border bg-surface-primary p-4 space-y-4">
      {/* Top row: ID + Status + Priority */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-lg font-semibold text-text-primary">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        <StatusBadge status={order.status} size="md" />
        {/* Email status badge */}
        {order.emailStatus && (
          <Badge variant={getEmailBadgeVariant(order.emailStatus)} size="sm">
            Email: {getEmailBadgeLabel(order.emailStatus)}
          </Badge>
        )}
        {/* Needs Contact badge */}
        {order.needsContact && (
          <Badge variant="status-error" size="sm" className="animate-pulse">
            Needs Contact
          </Badge>
        )}
        <button
          type="button"
          onClick={handleTogglePriority}
          disabled={togglingPriority}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            order.isPriority
              ? "bg-secondary-light text-secondary-hover"
              : "bg-surface-tertiary text-text-muted hover:text-secondary-hover hover:bg-secondary-light/50"
          )}
          aria-label={order.isPriority ? "Remove priority" : "Mark as priority"}
        >
          {togglingPriority ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className={cn("h-3.5 w-3.5", order.isPriority && "fill-current")} />
          )}
          {order.isPriority ? "Priority" : "Set Priority"}
        </button>
        {/* Mark Contacted button */}
        {order.needsContact && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkContacted}
            disabled={markingContacted}
            className="text-xs"
          >
            {markingContacted ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Contacted"}
          </Button>
        )}
      </div>

      {/* Delivery window */}
      {deliveryWindowText && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Delivery:</span>
          <span className="font-medium text-accent-teal">{deliveryWindowText}</span>
        </div>
      )}

      {/* Placed at + Driver */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span>Placed {format(parseISO(order.placedAt), "MMM d, yyyy 'at' h:mm a")}</span>
        {order.assignedDriverName && (
          <span>
            Driver:{" "}
            <span className="font-medium text-text-secondary">{order.assignedDriverName}</span>
          </span>
        )}
      </div>

      {/* Status action buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {nextStatuses.map(({ status, label }) => (
            <Button
              key={status}
              size="sm"
              variant={status === "cancelled" ? "outline" : "default"}
              onClick={() => onStatusAction(status)}
              className={cn(
                status === "cancelled" &&
                  "border-status-error text-status-error hover:bg-status-error/10"
              )}
            >
              {STATUS_LABELS[status] ? label : label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
