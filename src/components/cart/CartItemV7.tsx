"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2, Minus, Plus, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import type { CartItem } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface CartItemV7Props {
  /** Cart item data */
  item: CartItem;
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Callback when edit is requested */
  onEdit?: (item: CartItem) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// QUANTITY SELECTOR V7
// ============================================

interface QuantitySelectorV7Props {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

function QuantitySelectorV7({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 50,
}: QuantitySelectorV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  const handleDecrement = useCallback(() => {
    if (quantity > min) {
      setDirection("down");
      onDecrement();
    }
  }, [quantity, min, onDecrement]);

  const handleIncrement = useCallback(() => {
    if (quantity < max) {
      setDirection("up");
      onIncrement();
    }
  }, [quantity, max, onIncrement]);

  return (
    <div className="flex items-center gap-1">
      {/* Decrement button */}
      <motion.button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-v6-surface-tertiary text-v6-text-secondary",
          "hover:bg-v6-surface-secondary hover:text-v6-text-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary"
        )}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        transition={getSpring(v7Spring.snappy)}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </motion.button>

      {/* Quantity display with flip animation */}
      <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={quantity}
            initial={shouldAnimate ? {
              y: direction === "up" ? 20 : -20,
              opacity: 0,
              scale: 0.8,
            } : undefined}
            animate={shouldAnimate ? {
              y: 0,
              opacity: 1,
              scale: 1,
            } : undefined}
            exit={shouldAnimate ? {
              y: direction === "up" ? -20 : 20,
              opacity: 0,
              scale: 0.8,
            } : undefined}
            transition={getSpring(v7Spring.snappy)}
            className="absolute text-base font-semibold text-v6-text-primary tabular-nums"
          >
            {quantity}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Increment button */}
      <motion.button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-v6-surface-tertiary text-v6-text-secondary",
          "hover:bg-v6-surface-secondary hover:text-v6-text-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary"
        )}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        transition={getSpring(v7Spring.snappy)}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ============================================
// SWIPE DELETE INDICATOR
// ============================================

interface SwipeDeleteIndicatorProps {
  progress: number; // 0-1
}

function SwipeDeleteIndicator({ progress }: SwipeDeleteIndicatorProps) {
  const scale = Math.min(1, progress * 1.5);
  const opacity = Math.min(1, progress * 2);

  return (
    <motion.div
      className={cn(
        "absolute right-0 inset-y-0 flex items-center justify-end pr-4",
        "bg-gradient-to-l from-red-500/20 to-transparent",
        "rounded-r-xl"
      )}
      style={{ width: `${Math.min(100, progress * 150)}%` }}
    >
      <motion.div
        className={cn(
          "w-10 h-10 rounded-full bg-red-500 text-white",
          "flex items-center justify-center"
        )}
        style={{
          scale,
          opacity,
        }}
      >
        <Trash2 className="w-5 h-5" />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartItemV7({
  item,
  compact = false,
  onEdit,
  className,
}: CartItemV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe to delete
  const dragX = useMotionValue(0);
  const swipeProgress = useTransform(dragX, [-150, 0], [1, 0]);
  const [isDragging, setIsDragging] = useState(false);

  const itemTotal = getItemTotal(item.cartItemId);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      if (info.offset.x < -100 || info.velocity.x < -500) {
        // Trigger haptic
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(20);
        }
        removeItem(item.cartItemId);
      }
    },
    [item.cartItemId, removeItem]
  );

  const handleIncrement = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
    updateQuantity(item.cartItemId, item.quantity + 1);
  }, [item.cartItemId, item.quantity, updateQuantity]);

  const handleDecrement = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
    if (item.quantity === 1) {
      removeItem(item.cartItemId);
    } else {
      updateQuantity(item.cartItemId, item.quantity - 1);
    }
  }, [item.cartItemId, item.quantity, updateQuantity, removeItem]);

  const handleRemove = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    removeItem(item.cartItemId);
  }, [item.cartItemId, removeItem]);

  // Get current swipe progress for indicator
  const [swipeValue, setSwipeValue] = useState(0);
  swipeProgress.on("change", setSwipeValue);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Delete indicator (behind) */}
      {isDragging && <SwipeDeleteIndicator progress={swipeValue} />}

      {/* Main card */}
      <motion.div
        drag={shouldAnimate ? "x" : false}
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={cn(
          "relative bg-v6-surface-primary rounded-xl",
          "border border-v6-border",
          "shadow-v6-sm",
          "touch-pan-y",
          compact ? "p-3" : "p-4"
        )}
        whileHover={shouldAnimate && !isDragging ? { scale: 1.01 } : undefined}
        transition={getSpring(v7Spring.gentle)}
      >
        <div className="flex gap-3">
          {/* Image */}
          <motion.div
            className={cn(
              "flex-shrink-0 rounded-lg overflow-hidden bg-v6-surface-secondary",
              compact ? "w-16 h-16" : "w-20 h-20"
            )}
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            transition={getSpring(v7Spring.snappy)}
          >
            {item.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URL in animation */
              <img
                src={item.imageUrl}
                alt={item.nameEn}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🍜
              </div>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-semibold text-v6-text-primary truncate",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {item.nameEn}
                </h3>

                {/* Modifiers */}
                {item.modifiers.length > 0 && (
                  <motion.p
                    initial={shouldAnimate ? { opacity: 0 } : undefined}
                    animate={shouldAnimate ? { opacity: 1 } : undefined}
                    className={cn(
                      "text-v6-text-secondary truncate",
                      compact ? "text-xs" : "text-sm"
                    )}
                  >
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </motion.p>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-xs text-v6-text-muted mt-1 italic truncate">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onEdit && (
                  <motion.button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "text-v6-text-muted hover:text-v6-text-primary",
                      "hover:bg-v6-surface-tertiary",
                      "transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary"
                    )}
                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                    aria-label="Edit item"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  onClick={handleRemove}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "text-v6-text-muted hover:text-red-500",
                    "hover:bg-red-50",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  )}
                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Bottom row: quantity & price */}
            <div className="flex items-center justify-between mt-2">
              <QuantitySelectorV7
                quantity={item.quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />

              <motion.div
                className="text-right"
                layout
              >
                <PriceTicker
                  value={itemTotal}
                  className={cn(
                    "font-semibold text-v6-primary",
                    compact ? "text-sm" : "text-base"
                  )}
                />
                {item.quantity > 1 && (
                  <p className="text-xs text-v6-text-muted">
                    ${(item.basePriceCents / 100).toFixed(2)} each
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Swipe hint indicator */}
        {shouldAnimate && (
          <motion.div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "text-v6-text-muted/30 pointer-events-none"
            )}
            animate={{ x: [0, -4, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// CART ITEM COMPACT (For preview bar)
// ============================================

export interface CartItemCompactV7Props {
  item: CartItem;
  className?: string;
}

export function CartItemCompactV7({ item, className }: CartItemCompactV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-v6-surface-secondary",
        className
      )}
    >
      <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URL in animation */
          <img
            src={item.imageUrl}
            alt={item.nameEn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg bg-v6-surface-tertiary">
            🍜
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-v6-text-primary truncate">
          {item.nameEn}
        </p>
        <p className="text-xs text-v6-text-muted">
          Qty: {item.quantity}
        </p>
      </div>
    </motion.div>
  );
}

export default CartItemV7;
