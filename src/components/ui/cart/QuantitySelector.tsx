"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface QuantitySelectorProps {
  /** Current quantity value */
  quantity: number;
  /** Callback when increment is clicked */
  onIncrement: () => void;
  /** Callback when decrement is clicked */
  onDecrement: () => void;
  /** Minimum allowed value (default: 1) */
  min?: number;
  /** Maximum allowed value (default: 99) */
  max?: number;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional className */
  className?: string;
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    button: "w-6 h-6",
    icon: "w-3 h-3",
    display: "w-8 h-6",
    text: "text-sm",
  },
  md: {
    button: "w-8 h-8",
    icon: "w-4 h-4",
    display: "w-10 h-8",
    text: "text-base",
  },
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

function triggerHaptic(type: "light" | "medium" | "pop" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 15, pop: 10 };
    navigator.vibrate(durations[type]);
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  const sizes = sizeConfig[size];
  // Buttons use snappy spring (quick response)
  const buttonSpring = getSpring(spring.snappy);
  // Number display uses rubbery spring (visible overshoot)
  const rubberySpring = getSpring(spring.rubbery);

  const handleDecrement = useCallback(() => {
    if (quantity > min) {
      triggerHaptic("pop"); // Pop haptic for satisfying feedback
      setDirection("down");
      onDecrement();
    }
  }, [quantity, min, onDecrement]);

  const handleIncrement = useCallback(() => {
    if (quantity < max) {
      triggerHaptic("pop"); // Pop haptic for satisfying feedback
      setDirection("up");
      onIncrement();
    }
  }, [quantity, max, onIncrement]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Decrement button */}
      <motion.button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={cn(
          sizes.button,
          "rounded-full flex items-center justify-center",
          "bg-surface-tertiary text-text-secondary",
          "hover:bg-surface-secondary hover:text-text-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        transition={buttonSpring}
        aria-label="Decrease quantity"
      >
        <Minus className={sizes.icon} />
      </motion.button>

      {/* Quantity display with rubbery flip animation */}
      <div
        className={cn(
          sizes.display,
          "relative flex items-center justify-center overflow-hidden"
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={quantity}
            initial={
              shouldAnimate
                ? {
                    y: direction === "up" ? 28 : -28, // More dramatic flip offset
                    opacity: 0,
                    scale: 0.7, // Start smaller for scale overshoot
                    rotate: -5, // Slight rotation for natural feel
                  }
                : undefined
            }
            animate={
              shouldAnimate
                ? {
                    y: 0,
                    opacity: 1,
                    scale: 1, // Rubbery spring will overshoot to ~1.1 then settle
                    rotate: 0,
                  }
                : undefined
            }
            exit={
              shouldAnimate
                ? {
                    y: direction === "up" ? -28 : 28,
                    opacity: 0,
                    scale: 0.7,
                    rotate: 5,
                  }
                : undefined
            }
            transition={rubberySpring}
            className={cn(
              "absolute font-semibold text-text-primary tabular-nums",
              sizes.text
            )}
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
          sizes.button,
          "rounded-full flex items-center justify-center",
          "bg-surface-tertiary text-text-secondary",
          "hover:bg-surface-secondary hover:text-text-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        transition={buttonSpring}
        aria-label="Increase quantity"
      >
        <Plus className={sizes.icon} />
      </motion.button>
    </div>
  );
}

export default QuantitySelector;
