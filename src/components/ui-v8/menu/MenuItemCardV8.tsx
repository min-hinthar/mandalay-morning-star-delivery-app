"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { BlurImage } from "./BlurImage";
import { EmojiPlaceholder } from "./EmojiPlaceholder";
import { FavoriteButton } from "./FavoriteButton";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface MenuItemCardV8Props {
  /** Menu item data */
  item: MenuItem;
  /** Category slug for emoji placeholder */
  categorySlug?: string;
  /** Click handler for card */
  onClick?: (item: MenuItem) => void;
  /** Disable favorite button */
  hideFavorite?: boolean;
  /** Card layout variant */
  variant?: "default" | "compact" | "featured";
  /** Priority load image (above fold) */
  priority?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// VARIANT CONFIGS
// ============================================

const variantConfig = {
  default: {
    card: "w-full",
    imageContainer: "aspect-[16/9]",
    imageSize: { width: 400, height: 225 },
    content: "p-3 sm:p-4",
    title: "text-base font-semibold",
    description: "text-sm",
    price: "text-base font-semibold",
    favoriteSize: "md" as const,
  },
  compact: {
    card: "w-full",
    imageContainer: "aspect-square",
    imageSize: { width: 200, height: 200 },
    content: "p-2 sm:p-3",
    title: "text-sm font-semibold",
    description: "text-xs",
    price: "text-sm font-semibold",
    favoriteSize: "sm" as const,
  },
  featured: {
    card: "w-full",
    imageContainer: "aspect-[4/3]",
    imageSize: { width: 600, height: 450 },
    content: "p-4 sm:p-5",
    title: "text-lg font-bold",
    description: "text-base",
    price: "text-lg font-bold",
    favoriteSize: "lg" as const,
  },
};

// ============================================
// ANIMATION CONFIG
// ============================================

// Card hover/tap effects matching motion-tokens hover.lift
const cardMotion = {
  whileHover: { y: -6, scale: 1.02 },
  whileTap: { scale: 0.97, y: 0 },
  transition: spring.snappy,
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

function triggerHaptic(type: "light" | "medium" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 10 };
    navigator.vibrate(durations[type]);
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuItemCardV8({
  item,
  categorySlug,
  onClick,
  hideFavorite = false,
  variant = "default",
  priority = false,
  className,
}: MenuItemCardV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { isFavorite, toggleFavorite } = useFavorites();

  const config = variantConfig[variant];
  const springConfig = getSpring(spring.snappy);
  const itemIsFavorite = isFavorite(item.id);

  const handleClick = useCallback(() => {
    if (!item.isSoldOut) {
      triggerHaptic("light");
      onClick?.(item);
    }
  }, [item, onClick]);

  const handleFavoriteToggle = useCallback(
    (_newState: boolean) => {
      toggleFavorite(item.id);
    },
    [item.id, toggleFavorite]
  );

  const formattedPrice = `$${(item.basePriceCents / 100).toFixed(2)}`;

  return (
    <motion.article
      data-menu-card={item.id}
      className={cn(
        config.card,
        "relative group",
        "bg-surface-primary rounded-xl",
        "border border-border",
        "shadow-sm hover:shadow-md",
        "overflow-hidden cursor-pointer",
        "transition-shadow duration-200",
        item.isSoldOut && "opacity-60 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      whileHover={shouldAnimate && !item.isSoldOut ? cardMotion.whileHover : undefined}
      whileTap={shouldAnimate && !item.isSoldOut ? cardMotion.whileTap : undefined}
      transition={springConfig}
      role="button"
      tabIndex={item.isSoldOut ? -1 : 0}
      aria-label={`${item.nameEn}, ${formattedPrice}${item.isSoldOut ? ', sold out' : ''}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Image container */}
      <div className={cn("relative", config.imageContainer)}>
        {item.imageUrl ? (
          <BlurImage
            src={item.imageUrl}
            alt={item.nameEn}
            fill
            sizes={`(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw`}
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            containerClassName="w-full h-full"
          />
        ) : (
          <EmojiPlaceholder
            category={categorySlug}
            size="xl"
            className="w-full h-full rounded-none"
            animate={false}
          />
        )}

        {/* Sold out overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Favorite button */}
        {!hideFavorite && (
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton
              isFavorite={itemIsFavorite}
              onToggle={handleFavoriteToggle}
              size={config.favoriteSize}
            />
          </div>
        )}

        {/* Tags badges */}
        {item.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
                  "text-text-secondary"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={config.content}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              config.title,
              "text-text-primary line-clamp-1"
            )}
          >
            {item.nameEn}
          </h3>
          <span
            className={cn(
              config.price,
              "text-primary flex-shrink-0"
            )}
          >
            {formattedPrice}
          </span>
        </div>

        {/* Description */}
        {item.descriptionEn && (
          <p
            className={cn(
              config.description,
              "text-text-secondary mt-1 line-clamp-2"
            )}
          >
            {item.descriptionEn}
          </p>
        )}

        {/* Myanmar name */}
        {item.nameMy && (
          <p className="text-xs text-text-muted mt-1">
            {item.nameMy}
          </p>
        )}

        {/* Allergens */}
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.allergens.map((allergen) => (
              <span
                key={allergen}
                className="px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              >
                {allergen}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ============================================
// SKELETON
// ============================================

export interface MenuItemCardV8SkeletonProps {
  variant?: "default" | "compact" | "featured";
  className?: string;
}

export function MenuItemCardV8Skeleton({
  variant = "default",
  className,
}: MenuItemCardV8SkeletonProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        config.card,
        "bg-surface-primary rounded-xl",
        "border border-border",
        "overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* Image skeleton */}
      <div className={cn(config.imageContainer, "bg-surface-tertiary animate-pulse")} />

      {/* Content skeleton */}
      <div className={config.content}>
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-3/4 bg-surface-tertiary rounded animate-pulse" />
          <div className="h-5 w-14 bg-surface-tertiary rounded animate-pulse" />
        </div>
        <div className="mt-2 space-y-2">
          <div className="h-4 w-full bg-surface-tertiary rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-surface-tertiary rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// GRID HELPER
// ============================================

export interface MenuItemGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function MenuItemGrid({
  children,
  columns = 2,
  className,
}: MenuItemGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

export default MenuItemCardV8;
