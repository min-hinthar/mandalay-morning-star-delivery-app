"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Star, Plus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import { v6Spring, v6SpringBouncy } from "@/lib/motion";

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
 * V6 Menu Item Card - Pepper Aesthetic
 *
 * Features:
 * - 24px rounded corners (V6 card radius)
 * - Image zoom on hover
 * - Spring-based hover lift
 * - Quick add button appears on hover
 * - Popular badge with V6 secondary color
 * - V6 typography and colors
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

  // V6 Variant-specific styles
  const variantStyles = {
    default: {
      padding: "p-4",
      imageAspect: "aspect-video",
      titleSize: "text-base",
      priceSize: "text-lg",
    },
    compact: {
      padding: "p-3",
      imageAspect: "aspect-video",
      titleSize: "text-sm",
      priceSize: "text-base",
    },
    featured: {
      padding: "p-5",
      imageAspect: "aspect-video",
      titleSize: "text-lg",
      priceSize: "text-xl",
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      whileHover={isInteractive && !prefersReducedMotion ? { y: -4, scale: 1.01 } : undefined}
      whileTap={isInteractive && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={v6Spring}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden",
        // V6 Card styling with visible border
        "rounded-card bg-surface-primary",
        "border border-border",
        "shadow-card",
        // V6 Motion
        "transition-all duration-normal ease-spring",
        isInteractive && [
          "cursor-pointer",
          "hover:shadow-card-hover",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        item.isSoldOut && "opacity-60 grayscale",
        variant === "featured" && "ring-2 ring-secondary/40"
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      aria-label={`${item.nameEn}${item.isSoldOut ? " - Sold Out" : ""}`}
    >
      {/* Image Container - V6 rounded top corners */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-surface-secondary to-surface-tertiary",
        "rounded-t-card",
        styles.imageAspect
      )}>
        {/* V6 Popular Badge - Golden Yellow */}
        {isPopular && !item.isSoldOut && (
          <Badge
            variant="featured"
            className="absolute left-3 top-3 z-dropdown"
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
                "object-cover",
                // V6 Image zoom effect
                "transition-transform duration-300 ease-default",
                isInteractive && "group-hover:scale-[1.03]"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* V6 Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-normal group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-text-muted">No image</span>
          </div>
        )}

        {/* V6 Favorite Heart Button */}
        {showFavorite && (
          <motion.button
            type="button"
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 z-dropdown",
              "flex h-10 w-10 items-center justify-center",
              "rounded-full bg-surface-primary/95 backdrop-blur-sm",
              "shadow-md",
              "transition-all duration-fast",
              "hover:scale-110 active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.85 }}
            aria-label={localFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={localFavorite}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={localFavorite ? "filled" : "outline"}
                initial={prefersReducedMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={prefersReducedMotion ? undefined : { scale: 0 }}
                transition={v6SpringBouncy}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-colors",
                    localFavorite
                      ? "fill-primary text-primary"
                      : "text-text-muted"
                  )}
                />
              </motion.div>
            </AnimatePresence>
          </motion.button>
        )}

        {/* V6 Quick Add Button - Desktop only */}
        {showQuickAdd && !item.isSoldOut && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 right-3 z-dropdown hidden md:block"
          >
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickAdd}
              className="shadow-elevated"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </motion.div>
        )}

        {/* V6 Sold Out Overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge className="bg-surface-primary px-4 py-2 text-base font-bold text-text-primary shadow-elevated">
              Sold Out
            </Badge>
          </div>
        )}
      </div>

      {/* V6 Content */}
      <div className={styles.padding}>
        {/* Names */}
        <div className="mb-2">
          <h3 className={cn(
            "font-display font-bold text-text-primary leading-tight line-clamp-1",
            "transition-colors duration-fast group-hover:text-primary",
            styles.titleSize
          )}>
            {item.nameEn}
          </h3>
          {item.nameMy && (
            <p className="text-sm text-text-muted font-burmese mt-0.5 line-clamp-1">
              {item.nameMy}
            </p>
          )}
        </div>

        {/* Description (featured variant only) */}
        {variant === "featured" && item.descriptionEn && (
          <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
            {item.descriptionEn}
          </p>
        )}

        {/* V6 Price + Allergens Row */}
        <div className="flex items-center justify-between gap-2">
          {/* V6 Price - Primary color */}
          <span className={cn(
            "font-display font-bold text-primary",
            "transition-colors duration-fast group-hover:text-primary-hover",
            styles.priceSize
          )}>
            {formatPrice(item.basePriceCents)}
          </span>

          {/* V6 Allergen icons */}
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
                          "border border-orange/30 bg-orange-light"
                        )}>
                          <IconComponent className={cn("h-3.5 w-3.5", info.color)} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-surface-primary text-text-primary border-border">
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
                        "border border-orange/30 bg-orange-light"
                      )}>
                        <span className="text-xs font-medium text-orange">
                          +{item.allergens.length - 4}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-surface-primary text-text-primary border-border">
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
    </motion.div>
  );
}

/**
 * V6 Menu Item Card Skeleton
 * Loading placeholder with V6 styling
 */
export function MenuItemCardSkeleton({ variant = "default" }: { variant?: CardVariant }) {
  const styles = {
    default: { padding: "p-4" },
    compact: { padding: "p-3" },
    featured: { padding: "p-5" },
  };

  return (
    <div className={cn(
      "overflow-hidden rounded-card",
      "bg-surface-primary shadow-card"
    )}>
      {/* Image skeleton - V6 shimmer */}
      <div className="relative aspect-video bg-surface-tertiary animate-shimmer" />

      {/* Content skeleton */}
      <div className={cn(styles[variant].padding, "space-y-2")}>
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded-input bg-surface-tertiary animate-shimmer" />

        {/* Burmese name skeleton */}
        <div className="h-4 w-1/2 rounded-input bg-surface-tertiary animate-shimmer" />

        {/* Price + allergens skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-1/4 rounded-input bg-surface-tertiary animate-shimmer" />
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-full bg-surface-tertiary animate-shimmer" />
            <div className="h-6 w-6 rounded-full bg-surface-tertiary animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
