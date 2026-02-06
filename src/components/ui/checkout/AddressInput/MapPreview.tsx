"use client";

/**
 * MapPreview Component
 *
 * Interactive Google Map preview showing coverage route.
 */

import { cn } from "@/lib/utils/cn";
import { CoverageRouteMap } from "@/components/ui/coverage/CoverageRouteMap";
import type { Address, CoverageResult } from "@/types/address";

interface MapPreviewProps {
  address: Address | null;
  coverageResult?: CoverageResult | null;
  className?: string;
}

export function MapPreview({ address, coverageResult, className }: MapPreviewProps) {
  const hasDestination = address && coverageResult && address.lat && address.lng;

  return (
    <CoverageRouteMap
      {...(hasDestination && {
        destinationLat: address.lat,
        destinationLng: address.lng,
        encodedPolyline: coverageResult.encodedPolyline,
        durationMinutes: coverageResult.durationMinutes,
        distanceMiles: coverageResult.distanceMiles,
        isValid: coverageResult.isValid,
      })}
      className={cn("h-48", className)}
    />
  );
}
