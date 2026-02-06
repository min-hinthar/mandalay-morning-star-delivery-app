"use client";

/**
 * AddressCard Component
 *
 * Selectable saved address card with coverage status indicator.
 */

import { m } from "framer-motion";
import {
  MapPin,
  Check,
  AlertCircle,
  Home,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Address, CoverageResult } from "@/types/address";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  coverageStatus?: CoverageResult | null;
  onSelect: () => void;
  index: number;
}

export function AddressCard({
  address,
  isSelected,
  coverageStatus,
  onSelect,
}: AddressCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const labelIcon = address.label === "Home" ? (
    <Home className="w-4 h-4" />
  ) : address.label === "Work" ? (
    <Briefcase className="w-4 h-4" />
  ) : (
    <MapPin className="w-4 h-4" />
  );

  return (
    <m.button
      type="button"
      onClick={onSelect}
      variants={shouldAnimate ? staggerItem : undefined}
      whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "w-full text-left p-4 rounded-xl",
        "border-2 transition-colors duration-200",
        isSelected
          ? "border-primary bg-primary-light/30"
          : "border-border bg-surface-primary hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        <m.div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
            isSelected
              ? "bg-primary text-text-inverse"
              : "bg-surface-tertiary text-text-muted"
          )}
          animate={isSelected && shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
          transition={getSpring(spring.ultraBouncy)}
        >
          {isSelected ? <Check className="w-4 h-4" /> : labelIcon}
        </m.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary">{address.label}</span>
            {address.isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-hover font-medium">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary line-clamp-2">
            {address.formattedAddress || `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`}
          </p>

          {coverageStatus && (
            <m.div
              initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              className={cn(
                "mt-2 flex items-center gap-2 text-xs",
                coverageStatus.isValid ? "text-green" : "text-red-500"
              )}
            >
              {coverageStatus.isValid ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>
                    {coverageStatus.distanceMiles.toFixed(1)} mi • ~{coverageStatus.durationMinutes} min
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Outside delivery area</span>
                </>
              )}
            </m.div>
          )}
        </div>

        <ChevronRight className={cn(
          "w-5 h-5 text-text-muted transition-transform",
          isSelected && "text-primary rotate-90"
        )} />
      </div>
    </m.button>
  );
}
