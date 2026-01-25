"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { QuantitySelector } from "@/components/ui-v8/cart/QuantitySelector";
import { useFlyToCart } from "@/components/ui-v8/cart/FlyToCart";
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
  /** Callback when item is added */
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
 * - idle: Pill-shaped "Add" button with Plus icon
 * - adding: Brief checkmark animation (~300ms)
 * - quantity: +/- quantity controls
 *
 * Features:
 * - Press animation (scale 0.95)
 * - Fly-to-cart arc animation
 * - Click sound via useCardSound
 * - Haptic feedback
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
  const [state, setState] = useState<ButtonState>(
    quantity > 0 ? "quantity" : "idle"
  );

  const { fly } = useFlyToCart();
  const { playAddSound, playRemoveSound, markUserInteraction } = useCardSound();

  // Track previous quantity to avoid unnecessary state updates
  const prevQuantityRef = useRef(quantity);

  // Sync state with external quantity - only when quantity actually changes
  useEffect(() => {
    if (prevQuantityRef.current !== quantity) {
      prevQuantityRef.current = quantity;
      if (quantity > 0 && state === "idle") {
        setState("quantity");
      } else if (quantity === 0 && state === "quantity") {
        setState("idle");
      }
    }
  }, [quantity, state]);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || state !== "idle") return;

      // Mark interaction for sound
      markUserInteraction();

      // Trigger haptic
      triggerHaptic("medium");

      // Start adding animation
      setState("adding");

      // Play sound
      playAddSound();

      // Fly animation
      const source = sourceRef?.current ?? buttonRef.current;
      if (source) {
        fly({
          sourceElement: source,
          imageUrl: item.imageUrl ?? undefined,
          size: 40,
        });
      }

      // Callback
      onAdd();

      // Transition to quantity after animation
      setTimeout(() => {
        setState("quantity");
      }, 300);
    },
    [
      disabled,
      state,
      markUserInteraction,
      playAddSound,
      fly,
      sourceRef,
      item.imageUrl,
      onAdd,
    ]
  );

  const handleIncrement = useCallback(() => {
    markUserInteraction();
    triggerHaptic("light");
    playAddSound();
    onIncrement();
  }, [markUserInteraction, playAddSound, onIncrement]);

  const handleDecrement = useCallback(() => {
    markUserInteraction();
    triggerHaptic("light");
    playRemoveSound();
    onDecrement();
  }, [markUserInteraction, playRemoveSound, onDecrement]);

  const springConfig = getSpring(spring.snappy);

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {/* Idle state - Add button */}
        {state === "idle" && (
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
        {state === "adding" && (
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
        {state === "quantity" && (
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
