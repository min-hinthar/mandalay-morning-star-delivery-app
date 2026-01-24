"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useCart } from "@/lib/hooks/useCart";
import { GlassOverlay } from "./GlassOverlay";
import { CardImage } from "./CardImage";
import { CardContent } from "./CardContent";
import { AddButton } from "./AddButton";
import { DietaryBadges } from "./DietaryBadges";
import { FavoriteButton } from "@/components/ui-v8/menu/FavoriteButton";
import { zIndex } from "@/design-system/tokens/z-index";
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
  /** Callback for quick add to cart (skips detail view) */
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

// ============================================
// TILT CONFIGURATION
// ============================================

const TILT_MAX_ANGLE = 18; // 15-20 degree range
const SPRING_CONFIG = { stiffness: 150, damping: 15 };

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * UnifiedMenuItemCard - Consolidated menu card with glassmorphism and 3D tilt
 *
 * Variants:
 * - menu: Full details with description, tilt enabled
 * - homepage: Compact for carousel, tilt enabled
 * - cart: Minimal for cart list, no tilt
 *
 * Features:
 * - Glassmorphism background with 20px blur
 * - 3D tilt effect (15-20 degree max) with moving shine
 * - Scale on hover (1.03x)
 * - Add button state machine (idle -> adding -> quantity)
 * - Dietary badges with icons AND text
 * - Respects reduced motion preference
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
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileTiltActive, setIsMobileTiltActive] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Favorites - use controlled state if provided, else use hook
  const favoritesHook = useFavorites();
  const isItemFavorite =
    controlledFavorite !== undefined
      ? controlledFavorite
      : favoritesHook.isFavorite(item.id);

  // Cart integration
  const cart = useCart();
  const cartItem = cart.items.find((ci) => ci.menuItemId === item.id);
  const quantity = cartItem?.quantity ?? 0;

  // Get variant config
  const config = variantConfig[variant];
  const shouldEnableTilt =
    config.enableTilt && !disableTilt && shouldAnimate && !item.isSoldOut;

  // Mouse position for 3D tilt (0-1 normalized)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Spring-smoothed rotation transforms
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [TILT_MAX_ANGLE, -TILT_MAX_ANGLE]),
    SPRING_CONFIG
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-TILT_MAX_ANGLE, TILT_MAX_ANGLE]),
    SPRING_CONFIG
  );

  // Memoized spring config
  const springConfig = useMemo(
    () => getSpring(spring.snappy),
    [getSpring]
  );

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!shouldEnableTilt) return;

      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
    },
    [shouldEnableTilt, mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsMobileTiltActive(false);
    // Reset to center
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // Mobile long-press to enable tilt play
  const handleTouchStart = useCallback(() => {
    if (!shouldEnableTilt) return;

    longPressTimer.current = setTimeout(() => {
      setIsMobileTiltActive(true);
      // Trigger haptic to indicate tilt mode
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
    }, 300);
  }, [shouldEnableTilt]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsMobileTiltActive(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobileTiltActive) return;

      const touch = e.touches[0];
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect || !touch) return;

      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;

      mouseX.set(Math.max(0, Math.min(1, x)));
      mouseY.set(Math.max(0, Math.min(1, y)));
    },
    [isMobileTiltActive, mouseX, mouseY]
  );

  const handleCardClick = useCallback(() => {
    if (item.isSoldOut) return;

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    onSelect?.(item);
  }, [item, onSelect]);

  const handleFavoriteToggle = useCallback(
    (newState: boolean) => {
      if (controlledFavoriteToggle) {
        controlledFavoriteToggle(item, newState);
      } else {
        favoritesHook.toggleFavorite(item.id);
      }
    },
    [item, controlledFavoriteToggle, favoritesHook]
  );

  // Cart handlers
  const handleAdd = useCallback(() => {
    if (onQuickAdd) {
      onQuickAdd(item);
    } else {
      // Convert MenuItem to CartItem format
      cart.addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        imageUrl: item.imageUrl,
        basePriceCents: item.basePriceCents,
        quantity: 1,
        modifiers: [],
        notes: "",
      });
    }
  }, [item, onQuickAdd, cart]);

  const handleIncrement = useCallback(() => {
    if (cartItem) {
      cart.updateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
    }
  }, [cartItem, cart]);

  const handleDecrement = useCallback(() => {
    if (cartItem) {
      if (cartItem.quantity <= 1) {
        cart.removeItem(cartItem.cartItemId);
      } else {
        cart.updateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
      }
    }
  }, [cartItem, cart]);

  // ==========================================
  // RENDER
  // ==========================================

  const tiltStyle = shouldEnableTilt
    ? {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d" as const,
        transformPerspective: 1000,
      }
    : {};

  return (
    <motion.article
      ref={cardRef}
      className={cn(
        "relative group cursor-pointer",
        config.rounded,
        "overflow-visible", // Allow 3D tilt overflow
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
      whileHover={
        shouldAnimate && !item.isSoldOut ? { scale: 1.03, zIndex: zIndex.dropdown } : undefined
      }
      whileTap={
        shouldAnimate && !item.isSoldOut ? { scale: 0.98 } : undefined
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

      {/* Card content container */}
      <div className={cn("relative", config.rounded, "overflow-hidden")}>
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
        {config.showBadges && item.tags.length > 0 && (
          <DietaryBadges tags={item.tags} />
        )}

        {/* Favorite button */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            isFavorite={isItemFavorite}
            onToggle={handleFavoriteToggle}
            size="md"
          />
        </div>

        {/* Sold out overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
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
          <div className="absolute bottom-3 right-3 z-10">
            <AddButton
              item={item}
              quantity={quantity}
              onAdd={handleAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              sourceRef={cardRef as React.RefObject<HTMLElement>}
            />
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default UnifiedMenuItemCard;
