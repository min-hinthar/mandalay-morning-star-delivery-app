// @deprecated Use UnifiedMenuItemCard instead - will be removed in future cleanup
"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Plus, Heart, Flame, Leaf, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PriceTicker } from "@/components/ui/PriceTicker";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface MenuItemCardProps {
  /** Menu item data */
  item: MenuItem;
  /** Callback when card is clicked (for detail view) */
  onSelect?: (item: MenuItem) => void;
  /** Callback for quick add to cart */
  onQuickAdd?: (item: MenuItem) => void;
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Whether item is favorited */
  isFavorite?: boolean;
  /** Layout ID for FLIP animation */
  layoutId?: string;
  /** Additional className */
  className?: string;
  /** Disable 3D tilt effect */
  disableTilt?: boolean;
  /** Index for stagger animation */
  index?: number;
}

// ============================================
// DIETARY BADGES
// ============================================

interface DietaryBadgeProps {
  type: "vegetarian" | "vegan" | "spicy" | "popular";
  level?: number; // For spicy level 1-3
}

function DietaryBadge({ type, level = 1 }: DietaryBadgeProps) {
  const badges = {
    vegetarian: {
      icon: <Leaf className="w-3 h-3" />,
      label: "Vegetarian",
      color: "bg-green/20 text-green border-green/30",
    },
    vegan: {
      icon: <Leaf className="w-3 h-3" />,
      label: "Vegan",
      color: "bg-accent-green/20 text-accent-green border-accent-green/30",
    },
    spicy: {
      icon: (
        <div className="flex gap-0.5">
          {Array.from({ length: level }).map((_, i) => (
            <Flame key={i} className="w-3 h-3" />
          ))}
        </div>
      ),
      label: `Spicy${level > 1 ? ` (${level})` : ""}`,
      color: "bg-primary/20 text-primary border-primary/30",
    },
    popular: {
      icon: <Star className="w-3 h-3 fill-current" />,
      label: "Popular",
      color: "bg-secondary/20 text-secondary-hover border-secondary/30",
    },
  };

  const badge = badges[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-[10px] font-semibold uppercase tracking-wider",
        "border",
        badge.color
      )}
    >
      {badge.icon}
      <span className="sr-only">{badge.label}</span>
    </span>
  );
}

// ============================================
// QUICK ADD BUTTON
// ============================================

interface QuickAddButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

function QuickAddButton({ onClick, disabled }: QuickAddButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "absolute bottom-3 right-3 z-20",
        "w-10 h-10 rounded-full",
        "bg-primary text-white",
        "flex items-center justify-center",
        "shadow-lg shadow-primary/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      transition={getSpring(spring.snappy)}
      aria-label="Quick add to cart"
    >
      <motion.div
        animate={isPressed && shouldAnimate ? { rotate: 90 } : { rotate: 0 }}
        transition={getSpring(spring.snappy)}
      >
        <Plus className="w-5 h-5" />
      </motion.div>

      {/* Ripple effect on press */}
      <AnimatePresence>
        {isPressed && shouldAnimate && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// FAVORITE BUTTON
// ============================================

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function FavoriteButton({ isFavorite, onClick }: FavoriteButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-3 right-3 z-20",
        "w-8 h-8 rounded-full",
        "bg-white/90 backdrop-blur-sm",
        "flex items-center justify-center",
        "shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
      transition={getSpring(spring.snappy)}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
    >
      <motion.div
        animate={
          isFavorite && shouldAnimate
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={getSpring(spring.rubbery)}
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-colors",
            isFavorite
              ? "fill-primary text-primary"
              : "text-text-secondary"
          )}
        />
      </motion.div>
    </motion.button>
  );
}

// ============================================
// MAIN CARD COMPONENT
// ============================================

export function MenuItemCard({
  item,
  onSelect,
  onQuickAdd,
  onFavoriteToggle,
  isFavorite = false,
  layoutId,
  className,
  disableTilt = false,
  index = 0,
}: MenuItemCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position for 3D tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth spring values for tilt
  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [8, -8]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-8, 8]),
    springConfig
  );

  // Parallax for image
  const imageX = useSpring(
    useTransform(mouseX, [0, 1], [-10, 10]),
    springConfig
  );
  const imageY = useSpring(
    useTransform(mouseY, [0, 1], [-10, 10]),
    springConfig
  );

  // Shine effect position
  const shineX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);
  const shineY = useTransform(mouseY, [0, 1], ["-100%", "200%"]);

  // Handle mouse move for tilt effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disableTilt || !shouldAnimate) return;

      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
    },
    [disableTilt, shouldAnimate, mouseX, mouseY]
  );

  // Reset tilt on mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // Handle card click
  const handleClick = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onSelect?.(item);
  }, [item, onSelect]);

  // Handle quick add
  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      onQuickAdd?.(item);
    },
    [item, onQuickAdd]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onFavoriteToggle?.(item, !isFavorite);
    },
    [item, isFavorite, onFavoriteToggle]
  );

  // Determine dietary badges from tags
  const badges = useMemo(() => {
    const result: DietaryBadgeProps[] = [];
    if (item.tags?.includes("vegetarian")) result.push({ type: "vegetarian" });
    if (item.tags?.includes("vegan")) result.push({ type: "vegan" });
    if (item.tags?.includes("spicy")) result.push({ type: "spicy", level: 1 });
    if (item.tags?.includes("very-spicy")) result.push({ type: "spicy", level: 2 });
    if (item.tags?.includes("extra-spicy")) result.push({ type: "spicy", level: 3 });
    if (item.tags?.includes("popular")) result.push({ type: "popular" });
    return result;
  }, [item.tags]);

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        ...getSpring(spring.rubbery),
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.article
      ref={cardRef}
      layoutId={layoutId}
      className={cn(
        "relative group cursor-pointer",
        "bg-surface-primary rounded-card",
        "overflow-hidden",
        "border border-border",
        "shadow-card hover:shadow-card-hover",
        "transition-shadow duration-300",
        className
      )}
      style={{
        rotateX: shouldAnimate && !disableTilt ? rotateX : 0,
        rotateY: shouldAnimate && !disableTilt ? rotateY : 0,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      variants={shouldAnimate ? cardVariants : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      whileHover={shouldAnimate ? { y: -4 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`View ${item.nameEn} details`}
    >
      {/* Image container with parallax */}
      <div className="relative h-48 overflow-hidden bg-surface-secondary">
        <motion.div
          className="absolute inset-0"
          style={{
            x: shouldAnimate && isHovered ? imageX : 0,
            y: shouldAnimate && isHovered ? imageY : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- Menu item image with hover parallax */
            <img
              src={item.imageUrl}
              alt={item.nameEn}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🍜
            </div>
          )}
        </motion.div>

        {/* Shine effect */}
        {shouldAnimate && isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                135deg,
                transparent 0%,
                rgba(255, 255, 255, 0.1) 50%,
                transparent 100%
              )`,
              left: shineX,
              top: shineY,
            }}
          />
        )}

        {/* Dietary badges */}
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
            {badges.map((badge, i) => (
              <DietaryBadge key={i} {...badge} />
            ))}
          </div>
        )}

        {/* Favorite button */}
        <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteToggle} />

        {/* Out of stock overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="px-4 py-2 bg-surface-primary rounded-full text-sm font-semibold text-text-primary">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and description */}
        <h3 className="font-display font-semibold text-lg text-text-primary mb-1 line-clamp-1">
          {item.nameEn}
        </h3>
        <p className="font-body text-sm text-text-secondary mb-3 line-clamp-2">
          {item.descriptionEn}
        </p>

        {/* Price and quick add */}
        <div className="flex items-center justify-between">
          <PriceTicker
            value={item.basePriceCents}
            inCents={true}
            className="text-lg font-bold text-primary"
          />

          {!item.isSoldOut && onQuickAdd && (
            <QuickAddButton onClick={handleQuickAdd} />
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      {shouldAnimate && (
        <motion.div
          className="absolute inset-0 rounded-card pointer-events-none"
          style={{
            boxShadow: isHovered
              ? "inset 0 0 30px rgba(164, 16, 52, 0.1)"
              : "none",
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.article>
  );
}

export default MenuItemCard;
