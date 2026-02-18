"use client";

import { useRef, useMemo, useCallback } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { GlassOverlay } from "./GlassOverlay";
import { CardImage } from "./CardImage";
import { CardContent } from "./CardContent";
import { AddButton } from "./AddButton";
import { DietaryBadges } from "./DietaryBadges";
import { FavoriteButton } from "../FavoriteButton";
import { useTiltEffect } from "./useTiltEffect";
import { useCardInteractions } from "./useCardInteractions";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export type CardVariant = "menu" | "homepage" | "cart";

export interface UnifiedMenuItemCardProps {
  /** Menu item data */
  item: MenuItem;
  /** Card display variant */
  variant?: CardVariant;
  /** Category slug for emoji fallback */
  categorySlug?: string;
  /** Callback when card is clicked (for detail view) */
  onSelect?: (item: MenuItem) => void;
  /** Callback for quick add to cart (skips detail view) - parent handles cart mutation */
  onQuickAdd?: (item: MenuItem) => void;
  /** Whether item is favorited (controlled) */
  isFavorite?: boolean;
  /** Callback for favorite toggle (controlled) */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Disable 3D tilt effect */
  disableTilt?: boolean;
  /** Priority loading for above-fold images */
  priority?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// VARIANT CONFIGURATIONS
// ============================================

const variantConfig = {
  menu: {
    imageAspect: "aspect-[4/3]",
    showDescription: true,
    showBadges: true,
    enableTilt: true,
    rounded: "rounded-3xl",
    roundedTop: "rounded-t-3xl",
    padding: "p-4",
  },
  homepage: {
    imageAspect: "aspect-[4/3]",
    showDescription: false,
    showBadges: true,
    enableTilt: true,
    rounded: "rounded-3xl",
    roundedTop: "rounded-t-3xl",
    padding: "p-3",
  },
  cart: {
    imageAspect: "aspect-square",
    showDescription: false,
    showBadges: false,
    enableTilt: false,
    rounded: "rounded-xl",
    roundedTop: "rounded-t-xl",
    padding: "p-2",
  },
} as const;

// Touch device tap feedback (shadow elevation + lift per CONTEXT.md)
const TOUCH_TAP_VARIANTS = {
  idle: {
    y: 0,
    boxShadow: "var(--shadow-sm)",
  },
  pressed: {
    y: -4,
    boxShadow: "var(--shadow-xl)",
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * UnifiedMenuItemCard - Consolidated menu card with glassmorphism and 3D tilt
 *
 * Add-to-cart flow:
 * - Items WITHOUT required modifiers: Quick-add directly via card's Add button
 * - Items WITH required modifiers: Opens detail modal for modifier selection
 *
 * Quantity display:
 * - Shows aggregate quantity of this item in cart (all modifier variants combined)
 * - This provides visual feedback that item is in cart
 */
export function UnifiedMenuItemCard({
  item,
  variant = "menu",
  categorySlug,
  onSelect,
  onQuickAdd,
  isFavorite: controlledFavorite,
  onFavoriteToggle: controlledFavoriteToggle,
  disableTilt = false,
  priority = false,
  className,
}: UnifiedMenuItemCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const canHover = useCanHover();
  const cardRef = useRef<HTMLElement>(null);

  // Favorites - use controlled state if provided, else use hook
  const favoritesHook = useFavorites();
  const isItemFavorite =
    controlledFavorite !== undefined ? controlledFavorite : favoritesHook.isFavorite(item.id);

  // Get variant config
  const config = variantConfig[variant];
  // Disable tilt on touch-only devices (complete disable per CONTEXT.md)
  const shouldEnableTilt =
    config.enableTilt && !disableTilt && shouldAnimate && !item.isSoldOut && canHover;

  // Memoized spring config
  const springConfig = useMemo(() => getSpring(spring.snappy), [getSpring]);

  // 3D tilt effect
  const {
    mouseX,
    mouseY,
    tiltStyle,
    isHovered,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    handleTiltTouchMove,
    resetTilt,
  } = useTiltEffect({ enabled: shouldEnableTilt, cardRef });

  // Card interactions (click, add, increment, decrement, favorite, long-press)
  const {
    totalQuantityInCart,
    handleCardClick,
    handleFavoriteToggle,
    handleAdd,
    handleIncrement,
    handleDecrement,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMoveCancel,
  } = useCardInteractions({
    item,
    onSelect,
    onQuickAdd,
    isFavorite: isItemFavorite,
    controlledFavoriteToggle,
    favoritesToggle: favoritesHook.toggleFavorite,
    shouldEnableTilt,
    resetTilt,
  });

  // Combine touch move handlers (long-press cancel + tilt)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleTouchMoveCancel(e);
      handleTiltTouchMove(e);
    },
    [handleTouchMoveCancel, handleTiltTouchMove]
  );

  return (
    <m.article
      ref={cardRef}
      className={cn(
        "relative group cursor-pointer",
        config.rounded,
        "overflow-visible",
        // Add tilt-container for Safari stacking context isolation
        shouldEnableTilt && "tilt-container",
        item.isSoldOut && "opacity-60 cursor-not-allowed",
        className
      )}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={handleCardClick}
      // Touch tap feedback when tilt disabled, scale when no animation
      variants={!shouldEnableTilt && shouldAnimate ? TOUCH_TAP_VARIANTS : undefined}
      initial={!shouldEnableTilt && shouldAnimate ? "idle" : undefined}
      whileHover={
        // Disable scale when tilt is enabled - 3D tilt IS the hover feedback
        shouldAnimate && !item.isSoldOut && !shouldEnableTilt ? { scale: 1.03 } : undefined
      }
      whileTap={
        shouldAnimate && !item.isSoldOut
          ? shouldEnableTilt
            ? undefined // 3D tilt IS the feedback
            : "pressed" // Touch tap feedback
          : undefined
      }
      transition={springConfig}
      role="button"
      tabIndex={item.isSoldOut ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${item.nameEn}${item.isSoldOut ? " - Sold Out" : ""}`}
    >
      {/* Glassmorphism background */}
      <GlassOverlay isHovered={isHovered} rounded={config.rounded} />

      {/* Card content container - no overflow-hidden to prevent 3D tilt clipping */}
      <div className={cn("relative", config.rounded)}>
        {/* Image with parallax and shine */}
        <CardImage
          imageUrl={item.imageUrl}
          alt={item.nameEn}
          mouseX={mouseX}
          mouseY={mouseY}
          isHovered={isHovered}
          categorySlug={categorySlug}
          priority={priority}
          aspectClass={config.imageAspect}
          roundedTop={config.roundedTop}
        />

        {/* Dietary badges */}
        {config.showBadges && item.tags.length > 0 && <DietaryBadges tags={item.tags} />}

        {/* Favorite button */}
        <div className={cn("absolute top-3 right-3", zClass.dropdown)}>
          <FavoriteButton isFavorite={isItemFavorite} onToggle={handleFavoriteToggle} size="md" />
        </div>

        {/* Sold out overlay */}
        {item.isSoldOut && (
          <div
            className={cn(
              "absolute inset-0 bg-overlay flex items-center justify-center",
              zClass.sticky
            )}
          >
            <span className="px-4 py-2 bg-surface-primary rounded-full text-sm font-semibold text-text-primary shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Content */}
        <CardContent
          item={item}
          showDescription={config.showDescription}
          showBurmeseName={variant !== "cart"}
          paddingClass={config.padding}
        />

        {/* Add button - bottom right */}
        {!item.isSoldOut && (
          <div className={cn("absolute bottom-3 right-3", zClass.dropdown)}>
            <AddButton
              item={item}
              quantity={totalQuantityInCart}
              onAdd={handleAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              sourceRef={cardRef as React.RefObject<HTMLElement>}
            />
          </div>
        )}
      </div>
    </m.article>
  );
}

export default UnifiedMenuItemCard;
