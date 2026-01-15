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
      className: "bg-jade-500 text-white",
      iconClassName: isUpdating ? "animate-spin" : "",
    },
    error: {
      icon: AlertCircle,
      label: "GPS Error",
      className: "bg-red-500 text-white",
      iconClassName: "",
    },
    inactive: {
      icon: MapPinOff,
      label: "GPS Off",
      className: "bg-charcoal-200 text-charcoal-600",
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
        "rounded-xl bg-white p-4 shadow-warm-sm",
        className
      )}
      data-testid="location-tracker-detail"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              status === "tracking" && "bg-jade-100",
              status === "error" && "bg-red-100",
              status === "inactive" && "bg-charcoal-100"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                config.iconClassName,
                status === "tracking" && "text-jade-600",
                status === "error" && "text-red-600",
                status === "inactive" && "text-charcoal-400"
              )}
            />
          </div>
          <div>
            <p className="font-medium text-charcoal">{config.label}</p>
            {error && (
              <p className="text-sm text-red-600">{error.message}</p>
            )}
            {isTracking && location && (
              <p className="text-sm text-charcoal/60">
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            status === "tracking" && "bg-jade-500",
            status === "error" && "bg-red-500",
            status === "inactive" && "bg-charcoal-300"
          )}
        />
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === "development" && location && (
        <div className="mt-3 rounded-lg bg-charcoal-50 p-2 text-xs font-mono text-charcoal/60">
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
