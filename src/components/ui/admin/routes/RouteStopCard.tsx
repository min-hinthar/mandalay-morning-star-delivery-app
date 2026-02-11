"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import {
  Phone,
  MessageSquare,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { RouteStopStatus, StopDetail, RouteStatus } from "@/types/driver";

interface RouteStopCardProps {
  stop: StopDetail;
  index: number;
  routeStatus: RouteStatus;
  onStatusChange: (stopId: string, status: RouteStopStatus) => void;
  onRemoveStop: (stopId: string) => void;
}

const STOP_STATUS_CONFIG: Record<RouteStopStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-status-info-bg text-status-info border-status-info/30",
  },
  enroute: {
    label: "En Route",
    className: "bg-orange-light text-orange border-orange/30",
  },
  arrived: {
    label: "Arrived",
    className: "bg-interactive-primary-light text-interactive-primary border-interactive-primary/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-status-success-bg text-status-success border-status-success/30",
  },
  skipped: {
    label: "Skipped",
    className: "bg-surface-tertiary text-text-muted border-border",
  },
};

const STOP_STATUSES: RouteStopStatus[] = ["pending", "enroute", "arrived", "delivered", "skipped"];

function formatTime(dateString: string | null): string {
  if (!dateString) return "—";
  try {
    return format(parseISO(dateString), "h:mm a");
  } catch {
    return "—";
  }
}

export function RouteStopCard({
  stop,
  index,
  routeStatus,
  onStatusChange,
  onRemoveStop,
}: RouteStopCardProps) {
  const statusConfig = STOP_STATUS_CONFIG[stop.status];
  const order = stop.order;
  const customer = order.customer;
  const address = order.address;

  const canRemove = routeStatus === "planned";
  const hasException = stop.exception && !stop.exception.resolved;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-surface-primary rounded-xl border border-border p-4 shadow-sm border-l-4",
        hasException && "border-status-error/30",
        stop.status === "delivered" && "border-l-status-success",
        stop.status === "enroute" && "border-l-status-in-transit",
        stop.status === "arrived" && "border-l-status-in-transit",
        stop.status === "pending" && "border-l-border",
        stop.status === "skipped" && "border-l-secondary"
      )}
    >
      {/* Header: Stop number, Status badge, ETA */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10 font-bold text-lg text-interactive-primary">
            {index + 1}
          </span>
          <Badge className={cn(statusConfig.className, "border")}>
            {statusConfig.label}
          </Badge>
        </div>
        {stop.eta && (
          <div className="flex items-center gap-1 text-sm text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            ETA: {formatTime(stop.eta)}
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="mt-4">
        <p className="font-medium text-text-primary">
          {customer?.fullName || "Unknown Customer"}
        </p>
        {address && (
          <>
            <p className="text-sm text-text-secondary">{address.line1}</p>
            {address.line2 && (
              <p className="text-sm text-text-secondary">{address.line2}</p>
            )}
            <p className="text-sm text-text-muted">
              {address.city}, {address.state} {address.postalCode}
            </p>
          </>
        )}
      </div>

      {/* Contact Buttons */}
      {customer?.phone && (
        <div className="flex gap-2 mt-3">
          <a href={`tel:${customer.phone}`}>
            <Button size="sm" variant="outline" leftIcon={<Phone className="h-3.5 w-3.5" />}>
              Call
            </Button>
          </a>
          <a href={`sms:${customer.phone}`}>
            <Button size="sm" variant="outline" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
              SMS
            </Button>
          </a>
        </div>
      )}

      {/* Order Summary */}
      <div className="mt-3 p-3 bg-surface-tertiary rounded-input">
        <p className="text-sm font-medium text-text-primary">
          {order.itemCount} items • ${(order.totalCents / 100).toFixed(2)}
        </p>
        {order.specialInstructions && (
          <p className="text-xs text-text-muted mt-1">
            Note: {order.specialInstructions}
          </p>
        )}
      </div>

      {/* Delivery Window */}
      {order.deliveryWindowStart && (
        <p className="text-xs text-text-muted mt-2">
          Window: {formatTime(order.deliveryWindowStart)}
          {order.deliveryWindowEnd && ` - ${formatTime(order.deliveryWindowEnd)}`}
        </p>
      )}

      {/* Proof Photo (if delivered) */}
      {stop.deliveryPhotoUrl && (
        <button
          type="button"
          className="mt-3 rounded-input overflow-hidden"
          onClick={() => window.open(stop.deliveryPhotoUrl ?? undefined, "_blank")}
        >
          <Image
            src={stop.deliveryPhotoUrl}
            alt="Delivery proof"
            width={80}
            height={80}
            className="w-20 h-20 object-cover hover:opacity-80 transition-opacity"
          />
        </button>
      )}

      {/* Delivery Notes */}
      {stop.deliveryNotes && (
        <p className="text-xs text-text-secondary mt-2 italic">
          {stop.deliveryNotes}
        </p>
      )}

      {/* Exception Badge */}
      {hasException && stop.exception && (
        <div className="mt-3 p-2 bg-status-error/10 border border-status-error/20 rounded-input">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-error" />
            <Badge variant="status-error" size="sm">
              {stop.exception.type.replace(/_/g, " ")}
            </Badge>
          </div>
          {stop.exception.description && (
            <p className="text-xs text-status-error mt-1">
              {stop.exception.description}
            </p>
          )}
        </div>
      )}

      {/* Actions: Status Change + Remove */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" rightIcon={<ChevronDown className="h-3.5 w-3.5" />}>
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STOP_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onStatusChange(stop.id, status)}
                className={cn(
                  "cursor-pointer",
                  status === stop.status && "bg-surface-tertiary"
                )}
              >
                <Badge className={cn(STOP_STATUS_CONFIG[status].className, "border")} size="sm">
                  {STOP_STATUS_CONFIG[status].label}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {canRemove && (
          <>
            <DropdownMenuSeparator className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveStop(stop.id)}
              className="text-status-error hover:text-status-error hover:bg-status-error/10"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Remove
            </Button>
          </>
        )}
      </div>
    </m.div>
  );
}
