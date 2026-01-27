"use client";

import { MapPin, MapPinOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocationTracking } from "@/lib/hooks/useLocationTracking";

interface LocationTrackerProps {
  routeId?: string;
  enabled: boolean;
  showDetails?: boolean;
  className?: string;
}

export function LocationTracker({
  routeId,
  enabled,
  showDetails = false,
  className,
}: LocationTrackerProps) {
  const { location, error, isTracking, isUpdating } = useLocationTracking({
    enabled,
    routeId,
  });

  // Determine status
  const status = error
    ? "error"
    : isTracking
    ? "tracking"
    : "inactive";

  const statusConfig = {
    tracking: {
      icon: isUpdating ? Loader2 : MapPin,
      label: "GPS Active",
      className: "bg-status-success text-text-inverse",
      iconClassName: isUpdating ? "animate-spin" : "",
    },
    error: {
      icon: AlertCircle,
      label: "GPS Error",
      className: "bg-status-error text-text-inverse",
      iconClassName: "",
    },
    inactive: {
      icon: MapPinOff,
      label: "GPS Off",
      className: "bg-surface-tertiary text-text-secondary",
      iconClassName: "",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (!showDetails) {
    // Compact badge view
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          config.className,
          className
        )}
        title={error?.message}
        data-testid="location-tracker-badge"
      >
        <Icon className={cn("h-3.5 w-3.5", config.iconClassName)} />
        <span>{config.label}</span>
      </div>
    );
  }

  // Detailed view with location info
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-primary p-4 shadow-sm",
        className
      )}
      data-testid="location-tracker-detail"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              status === "tracking" && "bg-status-success-bg",
              status === "error" && "bg-status-error-bg",
              status === "inactive" && "bg-surface-tertiary"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                config.iconClassName,
                status === "tracking" && "text-status-success",
                status === "error" && "text-status-error",
                status === "inactive" && "text-text-secondary"
              )}
            />
          </div>
          <div>
            <p className="font-medium text-text-primary">{config.label}</p>
            {error && (
              <p className="text-sm text-status-error">{error.message}</p>
            )}
            {isTracking && location && (
              <p className="text-sm text-text-secondary">
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            status === "tracking" && "bg-status-success",
            status === "error" && "bg-status-error",
            status === "inactive" && "bg-text-secondary/50"
          )}
        />
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === "development" && location && (
        <div className="mt-3 rounded-lg bg-surface-tertiary p-2 text-xs font-mono text-text-secondary">
          <p>
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          </p>
          {location.speed !== null && (
            <p>Speed: {(location.speed * 2.237).toFixed(1)} mph</p>
          )}
        </div>
      )}
    </div>
  );
}
