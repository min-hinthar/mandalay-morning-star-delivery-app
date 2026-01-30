"use client";

import { memo } from "react";
import { cn } from "@/lib/utils/cn";
import { PriceTicker } from "@/components/ui/PriceTicker";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface CardContentProps {
  /** Menu item data */
  item: MenuItem;
  /** Show description text */
  showDescription?: boolean;
  /** Show Burmese name */
  showBurmeseName?: boolean;
  /** Padding class */
  paddingClass?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * CardContent - Item details with typography hierarchy
 *
 * Displays:
 * - Item name (bold, line-clamp-1)
 * - Description (secondary, line-clamp-2, optional)
 * - Burmese name (text-xs, muted, optional)
 * - Price (subtle, animated via PriceTicker)
 */
export const CardContent = memo(function CardContent({
  item,
  showDescription = true,
  showBurmeseName = true,
  paddingClass = "p-4",
  className,
}: CardContentProps) {
  return (
    <div className={cn(paddingClass, className)}>
      {/* Item name - primary typography */}
      <h3
        className={cn(
          "font-display font-bold text-lg text-text-primary",
          "leading-tight line-clamp-1"
        )}
      >
        {item.nameEn}
      </h3>

      {/* Burmese name - muted secondary */}
      {showBurmeseName && item.nameMy && (
        <p className="text-xs text-text-muted mt-0.5 font-burmese line-clamp-1">
          {item.nameMy}
        </p>
      )}

      {/* Description - secondary typography */}
      {showDescription && item.descriptionEn && (
        <p
          className={cn(
            "text-sm text-text-secondary mt-1.5",
            "line-clamp-2 leading-snug"
          )}
        >
          {item.descriptionEn}
        </p>
      )}

      {/* Price - subtle, animated */}
      <div className="mt-3">
        <PriceTicker
          value={item.basePriceCents}
          inCents={true}
          size="md"
          className="text-text-secondary font-semibold"
        />
      </div>
    </div>
  );
});

export default CardContent;
