/**
 * V6 Delivery Actions Component - Pepper Aesthetic
 *
 * Primary action buttons for drivers: Mark Arrived, Mark Delivered, Can't Deliver.
 * V6 colors, typography, and 56px touch targets for high-contrast mode.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateStatus("arrived")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-v6-card-sm",
              "font-v6-body font-semibold",
              "bg-v6-primary text-white shadow-v6-md",
              "transition-all duration-v6-fast",
              "hover:bg-v6-primary-hover hover:shadow-v6-lg",
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
          </motion.button>
        );

      case "arrived":
        return (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateStatus("delivered")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-v6-card-sm",
              "font-v6-body font-semibold",
              "bg-v6-green text-white shadow-v6-md",
              "transition-all duration-v6-fast",
              "hover:bg-v6-green/90 hover:shadow-v6-lg",
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
          </motion.button>
        );

      case "delivered":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-v6-card-sm",
              "bg-v6-green/10 font-v6-body font-semibold text-v6-green"
            )}
          >
            <Check className="h-5 w-5" />
            <span>Delivered</span>
          </motion.div>
        );

      case "skipped":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-v6-card-sm",
              "bg-v6-status-error/10 font-v6-body font-semibold text-v6-status-error"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Skipped</span>
          </motion.div>
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
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onException}
          disabled={disabled || isLoading}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-v6-card-sm",
            "font-v6-body font-medium",
            "border-2 border-v6-status-error/20 bg-v6-surface-primary text-v6-status-error",
            "transition-all duration-v6-fast",
            "hover:border-v6-status-error/40 hover:bg-v6-status-error/5",
            "active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          data-testid="exception-button"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Can&apos;t Deliver</span>
        </motion.button>
      )}

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center font-v6-body text-sm text-v6-status-error"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
