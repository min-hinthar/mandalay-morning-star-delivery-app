"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Star, Plus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";

type CardVariant = "default" | "compact" | "featured";

interface MenuItemCardProps {
  item: MenuItem;
  /** Click handler when card is selected */
  onSelect?: (item: MenuItem) => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Whether the item is favorited */
  isFavorite?: boolean;
  /** Show favorite button (default: true) */
  showFavorite?: boolean;
  /** Show quick add button on hover (default: false) */
  showQuickAdd?: boolean;
  /** Card variant */
  variant?: CardVariant;
}

/**
 * V4 Menu Item Card - Unified Component
 *
 * Features:
 * - 16:9 aspect ratio (standard)
 * - Variant support: default, compact, featured
 * - Popular/Featured badge
 * - Favorite heart button
 * - Quick add button (optional)
 * - Allergen icons with tooltips
 * - Full design token usage
 */
export function MenuItemCard({
  item,
  onSelect,
  onFavoriteToggle,
  isFavorite = false,
  showFavorite = true,
  showQuickAdd = false,
  variant = "default",
}: MenuItemCardProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const tags = item.tags ?? [];
  const isPopular = tags.includes("featured") || tags.includes("popular");
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

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isInteractive) {
        onSelect?.(item);
      }
    },
    [isInteractive, item, onSelect]
  );

  // Variant-specific styles
  const variantStyles = {
    default: {
      padding: "p-[var(--space-3)]",
      imageAspect: "aspect-video",
      titleSize: "text-base",
      priceSize: "text-lg",
    },
    compact: {
      padding: "p-[var(--space-2)]",
      imageAspect: "aspect-video",
      titleSize: "text-sm",
      priceSize: "text-base",
    },
    featured: {
      padding: "p-[var(--space-4)]",
      imageAspect: "aspect-video",
      titleSize: "text-lg",
      priceSize: "text-xl",
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      whileHover={isInteractive && !prefersReducedMotion ? { y: -4, scale: 1.02 } : undefined}
      whileTap={isInteractive && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden",
        "rounded-[var(--radius-lg)] bg-[var(--color-surface)]",
        "border border-[var(--color-border)]",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-[var(--duration-fast)] ease-out",
        isInteractive && [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-lg)]",
          "hover:border-[var(--color-cta)]/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2",
        ],
        item.isSoldOut && "opacity-70",
        variant === "featured" && "ring-2 ring-[var(--color-cta)]/30"
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      aria-label={`${item.nameEn}${item.isSoldOut ? " - Sold Out" : ""}`}
    >
      {/* Image Container - 16:9 aspect ratio */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[var(--color-cream-darker)] to-[var(--color-cta)]/5",
        styles.imageAspect
      )}>
        {/* Popular/Featured Badge */}
        {isPopular && !item.isSoldOut && (
          <Badge
            className={cn(
              "absolute left-[var(--space-2)] top-[var(--space-2)] z-10",
              "border-0 bg-[var(--color-cta)] text-[var(--color-charcoal)]",
              "shadow-[var(--shadow-md)] font-semibold",
              variant === "featured" && "bg-[var(--color-primary)] text-white"
            )}
          >
            <Star className="mr-1 h-3 w-3 fill-current" />
            Popular
          </Badge>
        )}

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
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-[var(--color-charcoal-muted)]">No image</span>
          </div>
        )}

        {/* Favorite Heart Button */}
        {showFavorite && (
          <motion.button
            type="button"
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-[var(--space-2)] right-[var(--space-2)] z-10",
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
        )}

        {/* Quick Add Button - Desktop only */}
        {showQuickAdd && !item.isSoldOut && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[var(--space-2)] right-[var(--space-2)] z-10 hidden md:block"
          >
            <button
              onClick={handleQuickAdd}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2",
                "bg-white/95 backdrop-blur-sm rounded-full",
                "shadow-[var(--shadow-lg)]",
                "hover:bg-white transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]"
              )}
            >
              <Plus className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--color-primary)]">Add</span>
            </button>
          </motion.div>
        )}

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
      <div className={styles.padding}>
        {/* Names */}
        <div className="mb-2">
          <h3 className={cn(
            "font-semibold text-[var(--color-charcoal)] leading-tight line-clamp-1",
            "transition-colors group-hover:text-[var(--color-primary)]",
            styles.titleSize
          )}>
            {item.nameEn}
          </h3>
          {item.nameMy && (
            <p className="text-sm text-[var(--color-charcoal-muted)] font-burmese mt-0.5 line-clamp-1">
              {item.nameMy}
            </p>
          )}
        </div>

        {/* Description (featured variant only) */}
        {variant === "featured" && item.descriptionEn && (
          <p className="mb-3 line-clamp-2 text-sm text-[var(--color-charcoal-muted)]">
            {item.descriptionEn}
          </p>
        )}

        {/* Price + Allergens Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <span className={cn(
            "font-[var(--font-display)] font-bold text-[var(--color-cta)]",
            "transition-colors group-hover:text-[var(--color-cta-dark)]",
            styles.priceSize
          )}>
            {formatPrice(item.basePriceCents)}
          </span>

          {/* Allergen icons with tooltips */}
          {hasAllergens && (
            <TooltipProvider>
              <div className="flex gap-1">
                {item.allergens.slice(0, 4).map((allergen) => {
                  const info = ALLERGEN_MAP[allergen];
                  if (!info) return null;

                  const IconComponent = info.icon;
                  return (
                    <Tooltip key={allergen}>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full",
                          "border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)]"
                        )}>
                          <IconComponent className={cn("h-3.5 w-3.5", info.color)} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contains {info.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {item.allergens.length > 4 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        "border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)]"
                      )}>
                        <span className="text-xs font-medium text-[var(--color-warning-dark)]">
                          +{item.allergens.length - 4}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {item.allergens
                          .slice(4)
                          .map((a) => ALLERGEN_MAP[a]?.label || a)
                          .join(", ")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
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
 * V4 Menu Item Card Skeleton
 * Loading placeholder with shimmer animation
 */
export function MenuItemCardSkeleton({ variant = "default" }: { variant?: CardVariant }) {
  const styles = {
    default: { padding: "p-[var(--space-3)]" },
    compact: { padding: "p-[var(--space-2)]" },
    featured: { padding: "p-[var(--space-4)]" },
  };

  return (
    <div className={cn(
      "overflow-hidden rounded-[var(--radius-lg)]",
      "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]"
    )}>
      {/* Image skeleton - 16:9 */}
      <div className="relative aspect-video bg-[var(--color-cream-darker)] animate-shimmer" />

      {/* Content skeleton */}
      <div className={cn(styles[variant].padding, "space-y-2")}>
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded bg-[var(--color-cream-darker)] animate-shimmer" />

        {/* Burmese name skeleton */}
        <div className="h-4 w-1/2 rounded bg-[var(--color-cream-darker)] animate-shimmer" />

        {/* Price + allergens skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-1/4 rounded bg-[var(--color-cream-darker)] animate-shimmer" />
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-full bg-[var(--color-cream-darker)] animate-shimmer" />
            <div className="h-6 w-6 rounded-full bg-[var(--color-cream-darker)] animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
