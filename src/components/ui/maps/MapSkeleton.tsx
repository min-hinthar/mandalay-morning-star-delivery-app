"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MapSkeletonProps {
  /** Delivery address text shown below skeleton while loading */
  addressText?: string;
  className?: string;
  /** Container height in pixels (default: 300) */
  height?: number;
  /** Mobile container height in pixels (smaller to save rendering resources) */
  mobileHeight?: number;
}

/**
 * Map placeholder skeleton with centered MapPin icon and pulse animation.
 * Optionally shows delivery address context text below the skeleton.
 */
export function MapSkeleton({
  addressText,
  className,
  height = 300,
  mobileHeight,
}: MapSkeletonProps) {
  return (
    <div
      className={cn(
        "relative animate-pulse rounded-xl bg-surface-muted",
        className
      )}
      style={{ minHeight: height }}
      role="status"
      aria-label="Loading map"
    >
      {/* Responsive height override for mobile */}
      {mobileHeight && (
        <style>{`@media (max-width: 767px) { [data-map-skeleton] { min-height: ${mobileHeight}px !important; } }`}</style>
      )}
      {mobileHeight && <div data-map-skeleton="" className="absolute inset-0" style={{ minHeight: mobileHeight }} />}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <MapPin className="h-8 w-8 text-text-muted" />
        <span className="text-sm text-text-muted">Loading map...</span>
      </div>

      {addressText && (
        <p className="absolute bottom-3 left-3 right-3 text-center text-xs text-text-muted">
          {addressText}
        </p>
      )}
    </div>
  );
}
