"use client";

/**
 * V8 Add To Cart Button
 *
 * Animated button that triggers fly-to-cart celebration and adds item to cart.
 *
 * Features:
 * - Integrates with useFlyToCart for celebration animation
 * - Scale pulse on success
 * - Color flash to jade on success
 * - Loading state during animation
 * - Respects reduced motion preference
 * - Accessible with dynamic aria-label
 */

import { useRef, useState, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useFlyToCart } from "./FlyToCart";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { spring, triggerHaptic } from "@/lib/motion-tokens";
import type { SelectedModifier } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface AddToCartItem {
  /** Menu item ID (menuItemId in cart) */
  menuItemId: string;
  /** Menu item slug for URL */
  menuItemSlug: string;
  /** English name */
  nameEn: string;
  /** Myanmar name (optional) */
  nameMy?: string | null;
  /** Image URL for fly animation thumbnail */
  imageUrl?: string | null;
  /** Base price in cents */
  basePriceCents: number;
}

export interface AddToCartButtonProps {
  /** Item to add to cart */
  item: AddToCartItem;
  /** Quantity to add (default: 1) */
  quantity?: number;
  /** Selected modifiers for the item */
  modifiers?: SelectedModifier[];
  /** Item notes */
  notes?: string;
  /** Callback after item is added */
  onAdd?: () => void;
  /** Additional class names */
  className?: string;
  /** Custom button content (replaces default) */
  children?: ReactNode;
  /** Button size variant */
  size?: "sm" | "md" | "lg";
  /** Disable the button */
  disabled?: boolean;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const buttonVariants = {
  idle: {
    scale: 1,
    backgroundColor: "var(--color-primary, #f59e0b)",
  },
  loading: {
    scale: 0.98,
    opacity: 0.8,
  },
  success: {
    scale: [1, 1.08, 1],
    backgroundColor: [
      "var(--color-primary, #f59e0b)",
      "var(--color-jade, #10b981)",
      "var(--color-primary, #f59e0b)",
    ],
  },
};

const successTransition = {
  duration: 0.5,
  times: [0, 0.5, 1],
};

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    button: "h-9 px-3 text-sm gap-1.5",
    icon: "h-4 w-4",
  },
  md: {
    button: "h-11 px-4 text-base gap-2",
    icon: "h-5 w-5",
  },
  lg: {
    button: "h-14 px-6 text-lg gap-2.5",
    icon: "h-6 w-6",
  },
} as const;

// ============================================
// COMPONENT
// ============================================

export function AddToCartButton({
  item,
  quantity: _quantity = 1,
  modifiers: _modifiers = [],
  notes: _notes = "",
  onAdd,
  className,
  children,
  size = "md",
  disabled = false,
}: AddToCartButtonProps) {
  // Note: quantity, modifiers, notes props are passed to parent via onAdd callback
  // The parent (ItemDetailSheetV8) maintains these values in its own state
  void _quantity;
  void _modifiers;
  void _notes;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastAddTimeRef = useRef<number>(0);
  const { fly, isAnimating } = useFlyToCart();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  // Debounce interval to prevent duplicate additions from rapid clicks
  const DEBOUNCE_MS = 500;

  const handleClick = useCallback(async () => {
    // Debounce guard for rapid clicks
    const now = Date.now();
    if (now - lastAddTimeRef.current < DEBOUNCE_MS) return;
    lastAddTimeRef.current = now;

    if (state !== "idle" || disabled) return;

    // Start animation
    setState("loading");
    triggerHaptic("medium");

    // Trigger fly animation if button ref available
    if (buttonRef.current && shouldAnimate) {
      fly({
        sourceElement: buttonRef.current,
        imageUrl: item.imageUrl ?? undefined,
        size: 40,
      });
    }

    // Call parent callback to handle cart addition
    // Parent is responsible for calling addItem() - this prevents double-add
    onAdd?.();

    // Show success state
    if (shouldAnimate) {
      setState("success");
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Reset to idle
    setState("idle");
  }, [state, disabled, shouldAnimate, fly, item, onAdd]);

  const config = sizeConfig[size];
  const isDisabled = disabled || state === "loading" || isAnimating;

  // Render icon based on state
  const renderIcon = () => {
    if (state === "loading") {
      return <Loader2 className={cn(config.icon, "animate-spin")} />;
    }
    if (state === "success") {
      return <Check className={config.icon} />;
    }
    return <ShoppingCart className={config.icon} />;
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      variants={shouldAnimate ? buttonVariants : undefined}
      animate={shouldAnimate ? state : undefined}
      transition={
        state === "success" ? successTransition : getSpring(spring.snappy)
      }
      whileHover={shouldAnimate && !isDisabled ? { scale: 1.03 } : undefined}
      whileTap={shouldAnimate && !isDisabled ? { scale: 0.97 } : undefined}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-semibold rounded-full",
        "bg-amber-500 text-white",
        "transition-colors duration-150",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
        // Hover
        !isDisabled && "hover:bg-amber-600",
        // Disabled
        isDisabled && "opacity-60 cursor-not-allowed",
        // Size
        config.button,
        className
      )}
      aria-label={`Add ${item.nameEn} to cart`}
      aria-busy={state === "loading"}
    >
      {children ?? (
        <>
          {renderIcon()}
          <span>{state === "success" ? "Added!" : "Add to Cart"}</span>
        </>
      )}
    </motion.button>
  );
}

export default AddToCartButton;
