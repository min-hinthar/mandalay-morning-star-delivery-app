"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { QuantitySelector } from "./QuantitySelector";
import type { CartItem } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface CartItemProps {
  /** Cart item data */
  item: CartItem;
  /** Callback when edit is requested */
  onEdit?: (item: CartItem) => void;
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 15, heavy: 25 };
    navigator.vibrate(durations[type]);
  }
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
        "bg-gradient-delete",
        "rounded-r-xl pointer-events-none"
      )}
      style={{ width: `${Math.min(100, progress * 150)}%` }}
    >
      <motion.div
        className={cn(
          "w-10 h-10 rounded-full bg-red-500 text-text-inverse",
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
// CART ITEM ANIMATION VARIANTS
// ============================================

const cartItemVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.9,
    rotate: -3, // Subtle rotation on exit for natural feel
    height: 0,
    marginBottom: 0,
    transition: {
      opacity: { duration: 0.15 },
      x: { duration: 0.2 },
      scale: { duration: 0.15 },
      rotate: { duration: 0.15 },
      height: { delay: 0.15, duration: 0.2 },
      marginBottom: { delay: 0.15, duration: 0.2 },
    },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function CartItem({
  item,
  onEdit,
  compact = false,
  className,
}: CartItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe to delete state
  const dragX = useMotionValue(0);
  const swipeProgress = useTransform(dragX, [-150, 0], [1, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeValue, setSwipeValue] = useState(0);

  // Subscribe to swipeProgress changes
  useEffect(() => {
    const unsubscribe = swipeProgress.on("change", setSwipeValue);
    return unsubscribe;
  }, [swipeProgress]);

  const itemTotal = getItemTotal(item.cartItemId);
  const springConfig = getSpring(spring.gentle);

  // Handle drag end - check if should remove
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      // Remove if swiped far enough or fast enough
      if (info.offset.x < -100 || info.velocity.x < -500) {
        triggerHaptic("heavy");
        removeItem(item.cartItemId);
      }
    },
    [item.cartItemId, removeItem]
  );

  // Handle quantity increment
  const handleIncrement = useCallback(() => {
    updateQuantity(item.cartItemId, item.quantity + 1);
  }, [item.cartItemId, item.quantity, updateQuantity]);

  // Handle quantity decrement (remove if goes to 0)
  const handleDecrement = useCallback(() => {
    if (item.quantity === 1) {
      triggerHaptic("medium");
      removeItem(item.cartItemId);
    } else {
      updateQuantity(item.cartItemId, item.quantity - 1);
    }
  }, [item.cartItemId, item.quantity, updateQuantity, removeItem]);

  // Handle manual remove button
  const handleRemove = useCallback(() => {
    triggerHaptic("medium");
    removeItem(item.cartItemId);
  }, [item.cartItemId, removeItem]);

  return (
    <motion.div
      ref={containerRef}
      layout={shouldAnimate}
      variants={shouldAnimate ? cartItemVariants : undefined}
      initial={shouldAnimate ? "initial" : undefined}
      animate={shouldAnimate ? "animate" : undefined}
      exit={shouldAnimate ? "exit" : undefined}
      transition={springConfig}
      className={cn("relative", className)}
    >
      {/* Delete indicator (behind card) */}
      <AnimatePresence>
        {isDragging && <SwipeDeleteIndicator progress={swipeValue} />}
      </AnimatePresence>

      {/* Main card - glassmorphism style matching unified card (no 3D tilt per CONTEXT.md) */}
      <motion.div
        drag={shouldAnimate ? "x" : false}
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={cn(
          // Glassmorphism styling matching unified card
          "relative glass-menu-card rounded-2xl",
          "border border-white/20 dark:border-white/10",
          // Premium shadow with colorful tint
          "shadow-colorful shadow-lg",
          "touch-pan-y backdrop-blur-xl",
          compact ? "p-3" : "p-4"
        )}
        whileHover={
          shouldAnimate && !isDragging ? { scale: 1.02, y: -2 } : undefined
        }
        transition={springConfig}
      >
        <div className="flex gap-3">
          {/* Image - rounded corners matching card style */}
          <motion.div
            className={cn(
              "flex-shrink-0 rounded-xl overflow-hidden bg-surface-secondary/50",
              compact ? "w-16 h-16" : "w-20 h-20"
            )}
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            transition={getSpring(spring.snappy)}
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
                {/* Fallback emoji for Myanmar cuisine */}
                <span role="img" aria-label="Food">
                  {getFallbackEmoji(item.nameEn)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                {/* Item name */}
                <h3
                  className={cn(
                    "font-semibold text-text-primary truncate",
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
                      "text-text-secondary truncate",
                      compact ? "text-xs" : "text-sm"
                    )}
                  >
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </motion.p>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-xs text-text-muted mt-1 italic truncate">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {onEdit && (
                  <motion.button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "text-text-muted hover:text-text-primary",
                      "hover:bg-surface-tertiary",
                      "transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                    "text-text-muted hover:text-red-500",
                    "hover:bg-red-50 dark:hover:bg-red-950/30",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
              <QuantitySelector
                quantity={item.quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                min={0}
                size={compact ? "sm" : "md"}
              />

              <motion.div className="text-right" layout={shouldAnimate}>
                <PriceTicker
                  value={itemTotal}
                  inCents={true}
                  className={cn(
                    "font-semibold text-primary",
                    compact ? "text-sm" : "text-base"
                  )}
                />
                {item.quantity > 1 && (
                  <p className="text-xs text-text-muted">
                    ${(item.basePriceCents / 100).toFixed(2)} each
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get fallback emoji based on item name
 */
function getFallbackEmoji(name: string): string {
  const lowercaseName = name.toLowerCase();

  // Rice dishes
  if (
    lowercaseName.includes("rice") ||
    lowercaseName.includes("fried rice") ||
    lowercaseName.includes("htamin")
  ) {
    return "\u{1F35A}"; // Rice bowl
  }

  // Noodles
  if (
    lowercaseName.includes("noodle") ||
    lowercaseName.includes("khao swe") ||
    lowercaseName.includes("mohinga")
  ) {
    return "\u{1F35C}"; // Noodle bowl
  }

  // Curry
  if (lowercaseName.includes("curry") || lowercaseName.includes("hin")) {
    return "\u{1F35B}"; // Curry
  }

  // Soup
  if (lowercaseName.includes("soup") || lowercaseName.includes("hin cho")) {
    return "\u{1F372}"; // Pot of food
  }

  // Salad
  if (lowercaseName.includes("salad") || lowercaseName.includes("thoke")) {
    return "\u{1F957}"; // Salad
  }

  // Tea/drinks
  if (
    lowercaseName.includes("tea") ||
    lowercaseName.includes("laphet") ||
    lowercaseName.includes("drink")
  ) {
    return "\u{1F375}"; // Tea
  }

  // Default food emoji
  return "\u{1F35C}"; // Default noodle bowl for Myanmar cuisine
}

export default CartItem;
