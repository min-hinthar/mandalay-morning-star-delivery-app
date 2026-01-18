"use client";

import { useState } from "react";
import { Check, AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RouteStopStatus } from "@/types/driver";

interface DeliveryActionsProps {
  routeId: string;
  stopId: string;
  currentStatus: RouteStopStatus;
  onStatusChange?: (newStatus: RouteStopStatus) => void;
  onException?: () => void;
  disabled?: boolean;
}

export function DeliveryActions({
  routeId,
  stopId,
  currentStatus,
  onStatusChange,
  onException,
  disabled = false,
}: DeliveryActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (newStatus: RouteStopStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/driver/routes/${routeId}/stops/${stopId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      onStatusChange?.(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which action to show based on current status
  const renderPrimaryAction = () => {
    switch (currentStatus) {
      case "pending":
      case "enroute":
        return (
          <button
            onClick={() => updateStatus("arrived")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-xl font-semibold",
              "bg-accent-secondary text-white shadow-warm-sm",
              "transition-all hover:bg-accent-secondary/90 hover:shadow-warm-md",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            data-testid="mark-arrived-button"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <MapPin className="h-6 w-6" />
                <span>Mark Arrived</span>
              </>
            )}
          </button>
        );

      case "arrived":
        return (
          <button
            onClick={() => updateStatus("delivered")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-xl font-semibold",
              "bg-accent-secondary text-white shadow-warm-sm",
              "transition-all hover:bg-accent-secondary/90 hover:shadow-warm-md",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            data-testid="mark-delivered-button"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Check className="h-6 w-6" />
                <span>Mark Delivered</span>
              </>
            )}
          </button>
        );

      case "delivered":
        return (
          <div className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-status-success-bg font-semibold text-accent-secondary">
            <Check className="h-5 w-5" />
            <span>Delivered</span>
          </div>
        );

      case "skipped":
        return (
          <div className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-100 font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Skipped</span>
          </div>
        );

      default:
        return null;
    }
  };

  const canReportException =
    currentStatus !== "delivered" && currentStatus !== "skipped";

  return (
    <div className="space-y-3">
      {/* Primary Action */}
      {renderPrimaryAction()}

      {/* Exception Button */}
      {canReportException && (
        <button
          onClick={onException}
          disabled={disabled || isLoading}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium",
            "border-2 border-red-200 bg-white text-red-600",
            "transition-all hover:border-red-300 hover:bg-red-50",
            "active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          data-testid="exception-button"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Can&apos;t Deliver</span>
        </button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
