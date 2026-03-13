"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { MapPin, Calendar, Truck, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  getDirectionsForCoords,
  filterDaysByDirection,
  getDirectionLabel,
} from "@/lib/utils/delivery-zones";
import type { Address } from "@/types/address";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

interface DeliveryZoneInfoCardProps {
  address: Address;
  deliveryZones: DeliveryZoneConfig[];
  deliveryDays: DeliveryDayConfig[];
  freeDeliveryThresholdCents?: number;
  className?: string;
}

const DIRECTION_COLORS: Record<string, string> = {
  east: "text-blue-600 bg-blue-50 border-blue-200",
  west: "text-purple-600 bg-purple-50 border-purple-200",
  south: "text-amber-600 bg-amber-50 border-amber-200",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DeliveryZoneInfoCard({
  address,
  deliveryZones,
  deliveryDays,
  freeDeliveryThresholdCents = 10000,
  className,
}: DeliveryZoneInfoCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const info = useMemo(() => {
    if (!address.lat || !address.lng || deliveryZones.length === 0) return null;

    const directions = getDirectionsForCoords(address.lat, address.lng, deliveryZones);
    if (directions.length === 0) return null;

    const eligibleDays = filterDaysByDirection(directions, deliveryDays);
    const eligibleDayNames = eligibleDays
      .filter((d) => d.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((d) => DAY_NAMES[d.dayOfWeek]);

    const primaryDirection = directions[0];
    const routeLabel = getDirectionLabel(
      primaryDirection as Exclude<typeof primaryDirection, "all">
    );
    const colorClass =
      DIRECTION_COLORS[primaryDirection] ?? "text-primary bg-primary/5 border-primary/20";

    const isExtended = address.distanceMiles != null && address.distanceMiles > 25;
    const thresholdDollars = Math.round(freeDeliveryThresholdCents / 100);
    const feeLabel = isExtended
      ? "$20.00 extended delivery fee"
      : `Free delivery on orders $${thresholdDollars}+`;

    return {
      directions,
      routeLabel,
      colorClass,
      eligibleDayNames,
      distanceMiles: address.distanceMiles,
      isExtended,
      feeLabel,
    };
  }, [address, deliveryZones, deliveryDays, freeDeliveryThresholdCents]);

  if (!info) return null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn("rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3", className)}
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-text-primary">Your Delivery Info</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Route */}
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">Route:</span>
          <span
            className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", info.colorClass)}
          >
            {info.routeLabel}
          </span>
        </div>

        {/* Distance */}
        {info.distanceMiles != null && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted">Distance:</span>
            <span className="text-xs font-medium text-text-primary">
              {info.distanceMiles.toFixed(1)} mi
            </span>
            {info.isExtended && (
              <span className="text-2xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                Extended
              </span>
            )}
          </div>
        )}

        {/* Eligible Days */}
        <div className="flex items-center gap-2 sm:col-span-2">
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">Delivery days:</span>
          <div className="flex flex-wrap gap-1">
            {info.eligibleDayNames.map((day) => (
              <span
                key={day}
                className="text-2xs px-1.5 py-0.5 rounded-full bg-surface-primary border border-border font-medium text-text-primary"
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* Fee */}
        <div className="flex items-center gap-2 sm:col-span-2">
          <DollarSign className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">{info.feeLabel}</span>
        </div>
      </div>
    </m.div>
  );
}
