"use client";

/**
 * V8 Cart Button Component
 * Cart button with animated badge for header integration
 *
 * Features:
 * - Badge shows item count with pulse animation on change
 * - Badge ref registered in useCartAnimationStore for fly-to-cart target
 * - Hydration-safe (cart persists to localStorage)
 * - Reduced motion support
 * - Accessible with dynamic aria-label
 */

import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartAnimationStore } from "@/lib/stores/cart-animation-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { spring, badgeVariants } from "@/lib/motion-tokens";

// ============================================
// TYPES
// ============================================

export interface CartButtonV8Props {
  /** Additional container classes */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function CartButtonV8({ className }: CartButtonV8Props) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();
  const setBadgeRef = useCartAnimationStore((s) => s.setBadgeRef);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Badge ref for fly-to-cart animation target
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Hydration safety - cart is persisted to localStorage
  const [mounted, setMounted] = useState(false);

  // Track cart changes for pulse animation
  const [shouldPulse, setShouldPulse] = useState(false);
  const prevCountRef = useRef(itemCount);
  const isInitialMount = useRef(true);

  // Mount effect - register badge ref
  useEffect(() => {
    setMounted(true);
    setBadgeRef(badgeRef);

    return () => {
      setBadgeRef(null);
    };
  }, [setBadgeRef]);

  // Pulse animation on count change
  useEffect(() => {
    // Skip pulse on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCountRef.current = itemCount;
      return;
    }

    // Trigger pulse when count changes
    if (itemCount !== prevCountRef.current) {
      setShouldPulse(true);
      prevCountRef.current = itemCount;

      // Reset pulse after animation
      const timeout = setTimeout(() => setShouldPulse(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [itemCount]);

  // Animation config
  const buttonSpring = getSpring(spring.snappy);

  // Skeleton placeholder before hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-full",
          "bg-zinc-100/50 dark:bg-zinc-800/50",
          className
        )}
        aria-hidden="true"
      >
        <ShoppingCart className="h-5 w-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={open}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={buttonSpring}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full",
        "bg-zinc-100/80 dark:bg-zinc-800/80",
        "text-zinc-700 dark:text-zinc-300",
        "transition-colors duration-150",
        "hover:bg-amber-500 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
    >
      <ShoppingCart className="h-5 w-5" />

      <AnimatePresence mode="wait">
        {itemCount > 0 && (
          <motion.span
            ref={badgeRef}
            key={`badge-${itemCount}`}
            variants={shouldAnimate ? badgeVariants : undefined}
            initial={shouldAnimate ? "initial" : false}
            animate={
              shouldAnimate
                ? shouldPulse
                  ? "pop"
                  : "animate"
                : { scale: 1, opacity: 1 }
            }
            exit={shouldAnimate ? "exit" : undefined}
            className={cn(
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[22px] h-[22px] px-1.5 rounded-full",
              "bg-amber-500 text-[11px] font-bold text-white",
              "shadow-lg ring-2 ring-white dark:ring-zinc-950"
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default CartButtonV8;
