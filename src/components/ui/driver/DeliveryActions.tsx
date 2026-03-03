/**
 * V6 Delivery Actions Component - Pepper Aesthetic
 *
 * Primary action buttons for drivers: Mark Arrived, Mark Delivered, Can't Deliver.
 * V6 colors, typography, and 56px touch targets for high-contrast mode.
 * Offline-aware: queues status updates to IndexedDB when connectivity drops.
 */

"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Check, AlertTriangle, Camera, MapPin, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import type { RouteStopStatus } from "@/types/driver";

interface DeliveryActionsProps {
  routeId: string;
  stopId: string;
  currentStatus: RouteStopStatus;
  onStatusChange?: (newStatus: RouteStopStatus) => void;
  onQueuedOffline?: () => void;
  onException?: () => void;
  disabled?: boolean;
  testMode?: boolean;
  photoRequired?: boolean;
  onPhotoPrompt?: () => void;
}

export function DeliveryActions({
  routeId,
  stopId,
  currentStatus,
  onStatusChange,
  onQueuedOffline,
  onException,
  disabled = false,
  testMode,
  photoRequired,
  onPhotoPrompt,
}: DeliveryActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const { queueStatusUpdate } = useOfflineSync();

  const queueOffline = async (newStatus: RouteStopStatus) => {
    await queueStatusUpdate(routeId, stopId, newStatus);
    onStatusChange?.(newStatus);
    onQueuedOffline?.();
    // Brief "Queued" flash
    setQueued(true);
    setTimeout(() => setQueued(false), 1500);
  };

  const updateStatus = async (newStatus: RouteStopStatus) => {
    if (testMode) {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setIsLoading(false);
      onStatusChange?.(newStatus);
      return;
    }

    if (!routeId) {
      setError("Route ID missing — cannot update stop");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        await queueOffline(newStatus);
        return;
      }

      const response = await fetch(`/api/driver/routes/${routeId}/stops/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status >= 500) {
          // 5xx: fall through to queue
          await queueOffline(newStatus);
          return;
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      onStatusChange?.(newStatus);
    } catch (err) {
      // Network TypeError: fall through to queue
      if (err instanceof TypeError) {
        await queueOffline(newStatus);
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const renderButtonContent = (icon: React.ReactNode, label: string) => {
    if (queued) {
      return (
        <>
          <WifiOff className="h-5 w-5" />
          <span>Queued</span>
          <Check className="h-5 w-5" />
        </>
      );
    }
    if (isLoading) {
      return <Loader2 className="h-6 w-6 animate-spin" />;
    }
    return (
      <>
        {icon}
        <span>{label}</span>
      </>
    );
  };

  // Determine which action to show based on current status
  const renderPrimaryAction = () => {
    switch (currentStatus) {
      case "pending":
      case "enroute":
        return (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateStatus("arrived")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-card-sm",
              "font-body font-semibold",
              "bg-primary text-text-inverse shadow-md",
              "transition-all duration-fast",
              "hover:bg-primary-hover hover:shadow-lg",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            data-testid="mark-arrived-button"
          >
            {renderButtonContent(<MapPin className="h-6 w-6" />, "Mark Arrived")}
          </m.button>
        );

      case "arrived":
        if (photoRequired) {
          return (
            <m.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPhotoPrompt?.()}
              disabled={disabled || isLoading}
              className={cn(
                "flex h-14 w-full items-center justify-center gap-3 rounded-card-sm",
                "font-body font-semibold",
                "bg-primary text-text-inverse shadow-md",
                "transition-all duration-fast",
                "hover:bg-primary-hover hover:shadow-lg",
                "active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              data-testid="take-photo-button"
            >
              {renderButtonContent(<Camera className="h-6 w-6" />, "Take Photo to Deliver")}
            </m.button>
          );
        }
        return (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateStatus("delivered")}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-card-sm",
              "font-body font-semibold",
              "bg-green text-text-inverse shadow-md",
              "transition-all duration-fast",
              "hover:bg-green/90 hover:shadow-lg",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            data-testid="mark-delivered-button"
          >
            {renderButtonContent(<Check className="h-6 w-6" />, "Mark Delivered")}
          </m.button>
        );

      case "delivered":
        return (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-card-sm",
              "bg-green/10 font-body font-semibold text-green"
            )}
          >
            <Check className="h-5 w-5" />
            <span>Delivered</span>
          </m.div>
        );

      case "skipped":
        return (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-card-sm",
              "bg-status-error/10 font-body font-semibold text-status-error"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Skipped</span>
          </m.div>
        );

      default:
        return null;
    }
  };

  const canReportException = currentStatus !== "delivered" && currentStatus !== "skipped";

  return (
    <div className="space-y-3">
      {/* Primary Action */}
      {renderPrimaryAction()}

      {/* Exception Button */}
      {canReportException && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onException}
          disabled={disabled || isLoading}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-card-sm",
            "font-body font-medium",
            "border-2 border-status-error/20 bg-surface-primary text-status-error",
            "transition-all duration-fast",
            "hover:border-status-error/40 hover:bg-status-error/5",
            "active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          data-testid="exception-button"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Can&apos;t Deliver</span>
        </m.button>
      )}

      {/* Error Message */}
      {error && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center font-body text-sm text-status-error"
          role="alert"
        >
          {error}
        </m.p>
      )}
    </div>
  );
}
