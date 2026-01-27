"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { QuantitySelector, useFlyToCart } from "@/components/ui/cart";
import { useCardSound } from "./use-card-sound";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

type ButtonState = "idle" | "adding" | "quantity";

export interface AddButtonProps {
  /** Menu item data */
  item: MenuItem;
  /** Current quantity in cart (0 if not in cart) */
  quantity: number;
  /** Callback when item is added - parent handles cart mutation */
  onAdd: () => void;
  /** Callback when quantity is incremented */
  onIncrement: () => void;
  /** Callback when quantity is decremented */
  onDecrement: () => void;
  /** Source element ref for fly animation */
  sourceRef?: React.RefObject<HTMLElement>;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

function triggerHaptic(type: "light" | "medium" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 15 };
    navigator.vibrate(durations[type]);
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AddButton - State machine button with 3 states
 *
 * States:
 * - idle: Pill-shaped "Add" button with Plus icon (quantity === 0)
 * - adding: Brief checkmark animation (~300ms) after clicking Add
 * - quantity: +/- quantity controls (quantity > 0)
 *
 * Key principle:
 * - This component ONLY handles UI/animation
 * - Cart mutations happen via callbacks (onAdd, onIncrement, onDecrement)
 * - External quantity prop drives the state machine
 */
export function AddButton({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  sourceRef,
  disabled = false,
  className,
}: AddButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Internal state for animation timing
  const [isAddingAnimation, setIsAddingAnimation] = useState(false);

  // Track if we're in the middle of an add operation
  const isProcessingRef = useRef(false);

  const { fly } = useFlyToCart();
  const { playAddSound, playRemoveSound, markUserInteraction } = useCardSound();

  /**
   * Derive display state from quantity prop and animation state.
   * - quantity === 0 && not animating → "idle"
   * - isAddingAnimation → "adding" (brief checkmark)
   * - quantity > 0 → "quantity"
   */
  const displayState: ButtonState = isAddingAnimation
    ? "adding"
    : quantity > 0
      ? "quantity"
      : "idle";

  /**
   * Handle add button click.
   * - Shows animation feedback
   * - Calls onAdd callback (parent handles cart mutation)
   * - Cart store has debounce protection, so rapid clicks are safe
   */
  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Prevent double-processing
      if (disabled || isProcessingRef.current || isAddingAnimation) {
        return;
      }

      isProcessingRef.current = true;

      // UI feedback
      markUserInteraction();
      triggerHaptic("medium");
      playAddSound();

      // Start animation
      setIsAddingAnimation(true);

      // Fly animation
      const source = sourceRef?.current ?? buttonRef.current;
      if (source) {
        fly({
          sourceElement: source,
          imageUrl: item.imageUrl ?? undefined,
          size: 40,
        });
      }

      // Call parent callback to add to cart
      onAdd();

      // End animation after delay
      setTimeout(() => {
        setIsAddingAnimation(false);
        isProcessingRef.current = false;
      }, 350);
    },
    [
      disabled,
      isAddingAnimation,
      markUserInteraction,
      playAddSound,
      fly,
      sourceRef,
      item.imageUrl,
      onAdd,
    ]
  );

  const handleIncrement = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      markUserInteraction();
      triggerHaptic("light");
      playAddSound();
      onIncrement();
    },
    [markUserInteraction, playAddSound, onIncrement]
  );

  const handleDecrement = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      markUserInteraction();
      triggerHaptic("light");
      playRemoveSound();
      onDecrement();
    },
    [markUserInteraction, playRemoveSound, onDecrement]
  );

  // Reset animation state if quantity drops to 0 externally
  useEffect(() => {
    if (quantity === 0 && !isAddingAnimation) {
      isProcessingRef.current = false;
    }
  }, [quantity, isAddingAnimation]);

  const springConfig = getSpring(spring.snappy);

  return (
    <div
      className={cn("relative", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* Idle state - Add button */}
        {displayState === "idle" && (
          <motion.button
            key="add"
            ref={buttonRef}
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2",
              "bg-primary text-white font-semibold",
              "rounded-full shadow-lg shadow-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
            initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            exit={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            transition={springConfig}
            aria-label={`Add ${item.nameEn} to cart`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add</span>
          </motion.button>
        )}

        {/* Adding state - Checkmark animation */}
        {displayState === "adding" && (
          <motion.div
            key="adding"
            className={cn(
              "flex items-center justify-center w-10 h-10",
              "bg-green-500 text-white rounded-full",
              "shadow-lg"
            )}
            initial={shouldAnimate ? { scale: 0, rotate: -45 } : undefined}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
            exit={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
            transition={getSpring(spring.ultraBouncy)}
          >
            <motion.div
              initial={shouldAnimate ? { pathLength: 0 } : undefined}
              animate={shouldAnimate ? { pathLength: 1 } : undefined}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}

        {/* Quantity state - +/- controls */}
        {displayState === "quantity" && (
          <motion.div
            key="quantity"
            initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            exit={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
            transition={springConfig}
          >
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              min={0}
              max={99}
              size="sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AddButton;
