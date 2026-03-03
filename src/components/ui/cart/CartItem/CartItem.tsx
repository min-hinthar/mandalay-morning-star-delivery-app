"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { m, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { QuantitySelector } from "../QuantitySelector";
import type { CartItem as CartItemType, CartItemValidationStatus } from "@/types/cart";
import { triggerHaptic, getFallbackEmoji } from "./helpers";
import { SwipeDeleteIndicator } from "./SwipeDeleteIndicator";
import { ValidationOverlay } from "./ValidationOverlay";
import { PriceChangeBadge } from "./PriceChangeBadge";

export interface CartItemProps {
  item: CartItemType;
  onEdit?: (item: CartItemType) => void;
  compact?: boolean;
  className?: string;
  // Validation props (optional -- only provided when validation is active)
  validationStatus?: CartItemValidationStatus;
  priceDirection?: "up" | "down";
  newPriceCents?: number;
  onDismissPriceChange?: () => void;
  onRemoveStale?: () => void;
}

// Simplified animation variants to prevent mobile crashes
const cartItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50, transition: { duration: 0.15 } },
};

export const CartItem = memo(function CartItem({
  item,
  onEdit,
  compact = false,
  className,
  validationStatus,
  priceDirection,
  onDismissPriceChange,
  onRemoveStale,
}: CartItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  const isStale = validationStatus === "sold-out" || validationStatus === "unavailable";
  const hasPriceChange = validationStatus === "price-changed";

  const dragX = useMotionValue(0);
  const swipeProgress = useTransform(dragX, [-150, 0], [1, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeValue, setSwipeValue] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const unsubscribe = swipeProgress.on("change", setSwipeValue);
    return unsubscribe;
  }, [swipeProgress]);

  const itemTotal = getItemTotal(item.cartItemId);
  const springConfig = getSpring(spring.gentle);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      if (info.offset.x < -100 || info.velocity.x < -500) {
        triggerHaptic("heavy");
        removeItem(item.cartItemId);
      }
    },
    [item.cartItemId, removeItem]
  );

  const handleIncrement = useCallback(() => {
    updateQuantity(item.cartItemId, item.quantity + 1);
  }, [item.cartItemId, item.quantity, updateQuantity]);

  const handleDecrement = useCallback(() => {
    if (item.quantity === 1) {
      triggerHaptic("medium");
      removeItem(item.cartItemId);
    } else {
      updateQuantity(item.cartItemId, item.quantity - 1);
    }
  }, [item.cartItemId, item.quantity, updateQuantity, removeItem]);

  const handleRemove = useCallback(() => {
    triggerHaptic("medium");
    removeItem(item.cartItemId);
  }, [item.cartItemId, removeItem]);

  return (
    <m.div
      ref={containerRef}
      variants={shouldAnimate ? cartItemVariants : undefined}
      initial={shouldAnimate ? "initial" : undefined}
      animate={shouldAnimate ? "animate" : undefined}
      exit={shouldAnimate ? "exit" : undefined}
      transition={springConfig}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {isDragging && <SwipeDeleteIndicator progress={swipeValue} />}
      </AnimatePresence>

      <m.div
        drag={shouldAnimate && !isStale ? "x" : false}
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={cn(
          "relative glass-menu-card rounded-2xl",
          "border border-white/20 dark:border-white/10",
          "shadow-colorful shadow-lg",
          "touch-pan-y sm:backdrop-blur-xl",
          compact ? "p-3" : "p-4"
        )}
        whileHover={shouldAnimate && !isDragging && !isStale ? { scale: 1.02, y: -2 } : undefined}
        transition={springConfig}
      >
        {/* Validation overlay for sold-out/unavailable items */}
        {isStale && onRemoveStale && (
          <ValidationOverlay
            status={validationStatus as "sold-out" | "unavailable"}
            onRemove={onRemoveStale}
          />
        )}

        <div className={cn("flex gap-3", isStale && "opacity-50 pointer-events-none")}>
          {/* Image */}
          <m.div
            className={cn(
              "flex-shrink-0 rounded-xl overflow-hidden bg-surface-secondary/50",
              compact ? "w-16 h-16" : "w-20 h-20"
            )}
            whileHover={shouldAnimate && !isStale ? { scale: 1.05 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            {item.imageUrl && !imgError ? (
              /* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URL in animation */
              <img
                src={item.imageUrl}
                alt={item.nameEn}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                <span role="img" aria-label="Food">
                  {getFallbackEmoji(item.nameEn)}
                </span>
              </div>
            )}
          </m.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-semibold text-text-primary truncate",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {item.nameEn}
                </h3>
                {item.modifiers.length > 0 && (
                  <m.p
                    initial={shouldAnimate ? { opacity: 0 } : undefined}
                    animate={shouldAnimate ? { opacity: 1 } : undefined}
                    className={cn("text-text-secondary truncate", compact ? "text-xs" : "text-sm")}
                  >
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </m.p>
                )}
                {item.notes && (
                  <p className="text-xs text-text-muted mt-1 italic truncate">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onEdit && !isStale && (
                  <m.button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "text-text-muted hover:text-text-primary",
                      "hover:bg-surface-tertiary transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    )}
                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                    aria-label="Edit item"
                  >
                    <Edit3 className="w-4 h-4" />
                  </m.button>
                )}
                {!isStale && (
                  <m.button
                    type="button"
                    onClick={handleRemove}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "text-text-muted hover:text-red-500",
                      "hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    )}
                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </m.button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              {!isStale && (
                <QuantitySelector
                  quantity={item.quantity}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  min={0}
                  size={compact ? "sm" : "md"}
                />
              )}
              <m.div className={cn("text-right", isStale && "ml-auto")}>
                <PriceTicker
                  value={itemTotal}
                  inCents={true}
                  className={cn("font-semibold text-primary", compact ? "text-sm" : "text-base")}
                />
                {item.quantity > 1 && (
                  <p className="text-xs text-text-muted">
                    ${(item.basePriceCents / 100).toFixed(2)} each
                  </p>
                )}
              </m.div>
            </div>

            {/* Price change badge below the price section */}
            {hasPriceChange && priceDirection && onDismissPriceChange && (
              <div className="mt-2">
                <PriceChangeBadge direction={priceDirection} onDismiss={onDismissPriceChange} />
              </div>
            )}
          </div>
        </div>
      </m.div>
    </m.div>
  );
});

export default CartItem;
