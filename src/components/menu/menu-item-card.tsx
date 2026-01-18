"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Whether the item is favorited */
  isFavorite?: boolean;
}

const allergenLabels: Record<string, string> = {
  peanuts: "Peanuts",
  tree_nuts: "Tree Nuts",
  egg: "Egg",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  gluten_wheat: "Gluten",
  sesame: "Sesame",
  dairy: "Dairy",
};

/**
 * V3 Menu Item Card
 * 16:9 image, favorite heart, saffron price, premium animations
 */
export function MenuItemCard({
  item,
  onSelect,
  onFavoriteToggle,
  isFavorite = false,
}: MenuItemCardProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const prefersReducedMotion = useReducedMotion();

  const hasAllergens = item.allergens && item.allergens.length > 0;
  const isInteractive = Boolean(onSelect) && !item.isSoldOut;

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const newValue = !localFavorite;
      setLocalFavorite(newValue);
      onFavoriteToggle?.(item, newValue);
    },
    [item, localFavorite, onFavoriteToggle]
  );

  const handleCardClick = useCallback(() => {
    if (isInteractive) {
      onSelect?.(item);
    }
  }, [isInteractive, item, onSelect]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isInteractive) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(item);
      }
    },
    [isInteractive, item, onSelect]
  );

  return (
    <motion.div
      whileHover={isInteractive && !prefersReducedMotion ? { y: -4, scale: 1.02 } : undefined}
      whileTap={isInteractive && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden",
        "rounded-[var(--radius-md)] bg-[var(--color-surface)]",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-[var(--duration-fast)] ease-out",
        isInteractive && [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-md)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2",
        ],
        item.isSoldOut && "opacity-70"
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
    >
      {/* Image Container - 16:9 aspect ratio */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[var(--color-cream-darker)] to-[var(--color-cta)]/5">
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className={cn(
                "object-cover transition-transform duration-[var(--duration-standard)]",
                isInteractive && "group-hover:scale-105"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Gradient overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-[var(--color-charcoal-muted)]">No image</span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <motion.button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-2 right-2 z-10",
            "flex h-9 w-9 items-center justify-center",
            "rounded-full bg-white/90 backdrop-blur-sm",
            "shadow-[var(--shadow-md)]",
            "transition-all duration-[var(--duration-fast)]",
            "hover:scale-110 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]"
          )}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.8 }}
          aria-label={localFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={localFavorite}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={localFavorite ? "filled" : "outline"}
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={prefersReducedMotion ? undefined : { scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  localFavorite
                    ? "fill-[var(--color-error)] text-[var(--color-error)]"
                    : "text-[var(--color-charcoal-muted)]"
                )}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Sold Out Overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge className="bg-white px-4 py-2 text-base font-bold text-[var(--color-charcoal)] shadow-[var(--shadow-lg)]">
              Sold Out
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-[var(--space-3)]">
        {/* Names */}
        <div className="mb-2">
          <h3 className={cn(
            "font-semibold text-[var(--color-charcoal)] leading-tight text-base",
            "transition-colors group-hover:text-[var(--color-primary)]"
          )}>
            {item.nameEn}
          </h3>
          {item.nameMy && (
            <p className="text-sm text-[var(--color-charcoal-muted)] font-burmese mt-0.5">
              {item.nameMy}
            </p>
          )}
        </div>

        {/* Price + Allergens Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Price in saffron with display font */}
          <span className="font-[var(--font-display)] text-lg font-bold text-[var(--color-cta)]">
            {formatPrice(item.basePriceCents)}
          </span>

          {/* Allergen icons */}
          {hasAllergens && (
            <div className="flex flex-wrap gap-1 justify-end">
              {item.allergens.slice(0, 3).map((allergen) => (
                <Badge
                  key={allergen}
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium px-1.5 py-0.5"
                >
                  {allergenLabels[allergen]?.charAt(0) || allergen.charAt(0)}
                </Badge>
              ))}
              {item.allergens.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-[var(--color-cream-darker)] text-[var(--color-charcoal-muted)] border-[var(--color-border)]"
                >
                  +{item.allergens.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      {isInteractive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-cta)] scale-x-0 transition-transform duration-[var(--duration-fast)] origin-left group-hover:scale-x-100" />
      )}
    </motion.div>
  );
}

/**
 * V3 Menu Item Card Skeleton
 * Loading placeholder with shimmer animation
 */
export function MenuItemCardSkeleton() {
  return (
    <div className={cn(
      "overflow-hidden rounded-[var(--radius-md)]",
      "bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
    )}>
      {/* Image skeleton - 16:9 */}
      <div className="relative aspect-video bg-[var(--color-cream-darker)] animate-shimmer" />

      {/* Content skeleton */}
      <div className="p-[var(--space-3)] space-y-2">
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded bg-[var(--color-cream-darker)] animate-shimmer" />

        {/* Burmese name skeleton */}
        <div className="h-4 w-1/2 rounded bg-[var(--color-cream-darker)] animate-shimmer" />

        {/* Price skeleton */}
        <div className="h-5 w-1/4 rounded bg-[var(--color-cream-darker)] animate-shimmer" />
      </div>
    </div>
  );
}
