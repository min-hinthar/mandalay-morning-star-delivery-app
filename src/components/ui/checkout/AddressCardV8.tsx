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

import { motion } from "framer-motion";
import { MapPin, Check, Pencil, Trash2, Star } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import type { Address } from "@/types/address";

interface AddressCardV8Props {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AddressCardV8({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.button
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
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {/* Selection indicator */}
      <motion.div
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
      </motion.div>

      {/* Address content */}
      <div className="flex items-start gap-3 pr-8">
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            isSelected ? "bg-primary/10" : "bg-muted"
          )}
        >
          <MapPin
            className={cn(
              "w-5 h-5",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{address.label}</p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {address.line1}
          </p>
          {address.line2 && (
            <p className="text-sm text-muted-foreground truncate">
              {address.line2}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.state} {address.postalCode}
          </p>
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
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
    </motion.button>
  );
}
