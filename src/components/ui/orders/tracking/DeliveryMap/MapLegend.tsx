"use client";

/**
 * MapLegend - Map legend showing marker color key and stale location info
 */

import { cn } from "@/lib/utils/cn";

interface MapLegendProps {
  inFullscreen: boolean;
  showDriverMarker: boolean;
  showRestaurantMarker: boolean;
  isStale: boolean;
  staleMinutesAgo: number;
  lastLocationUpdate: Date | null | undefined;
}

export function MapLegend({
  inFullscreen,
  showDriverMarker,
  showRestaurantMarker,
  isStale,
  staleMinutesAgo,
  lastLocationUpdate,
}: MapLegendProps) {
  return (
    <div
      className={cn(
        "absolute left-3 right-3 z-10",
        inFullscreen ? "bottom-6" : "bottom-3"
      )}
    >
      <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-2 shadow-sm sm:backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[var(--color-jade)]" />
            <span className="text-[var(--color-text-primary)]">
              Destination
            </span>
          </div>
          {showDriverMarker && (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[var(--color-saffron)]" />
              <span className="text-[var(--color-text-primary)]">Driver</span>
            </div>
          )}
          {showRestaurantMarker && (
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#C75050" }}
              />
              <span className="text-[var(--color-text-primary)]">
                Restaurant
              </span>
            </div>
          )}
        </div>
        {isStale && lastLocationUpdate && (
          <span className="text-2xs text-[var(--color-text-muted)]">
            Last updated {staleMinutesAgo}m ago
          </span>
        )}
      </div>
    </div>
  );
}
