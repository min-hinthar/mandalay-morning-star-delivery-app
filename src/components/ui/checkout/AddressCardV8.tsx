"use client";

/**
 * AddressCardV8 - Address selection card with animations
 *
 * Enhanced version with:
 * - Hover scale + lift animation
 * - Selection scale animation with bouncy checkmark
 * - Edit/Delete action buttons
 * - Default badge indicator
 *
 * Phase 6 Plan 03
 */

import { useMemo } from "react";
import { m } from "framer-motion";
import { MapPin, Check, Pencil, Trash2, Star } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { getDirectionsForCoords, getDirectionLabel } from "@/lib/utils/delivery-zones";
import type { Address } from "@/types/address";
import type { DeliveryZoneConfig } from "@/types/delivery";

const DIRECTION_BADGE_COLORS: Record<string, string> = {
  east: "bg-blue-100 text-blue-700",
  west: "bg-purple-100 text-purple-700",
  south: "bg-amber-100 text-amber-700",
};

interface AddressCardV8Props {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deliveryZones?: DeliveryZoneConfig[];
}

export function AddressCardV8({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  deliveryZones,
}: AddressCardV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const directionInfo = useMemo(() => {
    if (!address.lat || !address.lng || !deliveryZones?.length) return null;
    const dirs = getDirectionsForCoords(address.lat, address.lng, deliveryZones);
    if (dirs.length === 0) return null;
    const primary = dirs[0];
    return {
      label: getDirectionLabel(primary as Exclude<typeof primary, "all">),
      colorClass: DIRECTION_BADGE_COLORS[primary] ?? "bg-primary/10 text-primary",
    };
  }, [address.lat, address.lng, deliveryZones]);

  return (
    <m.button
      type="button"
      onClick={onSelect}
      whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "relative w-full p-4 rounded-xl text-left",
        "border-2 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-surface-primary hover:border-primary/50"
      )}
    >
      {/* Selection indicator */}
      <m.div
        initial={false}
        animate={
          shouldAnimate
            ? {
                scale: isSelected ? 1 : 0,
                opacity: isSelected ? 1 : 0,
              }
            : {
                scale: isSelected ? 1 : 0,
                opacity: isSelected ? 1 : 0,
              }
        }
        transition={getSpring(spring.ultraBouncy)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
      >
        <Check className="w-4 h-4 text-text-inverse" strokeWidth={3} />
      </m.div>

      {/* Address content */}
      <div className="flex items-start gap-3 pr-8">
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            isSelected ? "bg-primary/10" : "bg-surface-secondary"
          )}
        >
          <MapPin className={cn("w-5 h-5", isSelected ? "text-primary" : "text-text-muted")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-text-primary">{address.label}</p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                Default
              </span>
            )}
            {directionInfo && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  directionInfo.colorClass
                )}
              >
                {directionInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted truncate">{address.line1}</p>
          {address.line2 && <p className="text-sm text-text-muted truncate">{address.line2}</p>}
          <p className="text-sm text-text-muted">
            {address.city}, {address.state} {address.postalCode}
          </p>
          {/* Distance & fee tier */}
          {address.distanceMiles != null && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xs text-text-muted">
                {address.distanceMiles.toFixed(1)} mi
              </span>
              {address.distanceMiles > 25 && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                  Extended delivery
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      )}
    </m.button>
  );
}
