"use client";

/**
 * CartIndicator - Cart icon with animated badge for header
 *
 * Features:
 * - Badge bounces and icon shakes when item is added
 * - Uses spring.rubbery for satisfying overshoot
 * - Registers badge ref for fly-to-cart animation target
 * - Hydration-safe with localStorage persistence
 */

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartAnimationStore } from "@/lib/stores/cart-animation-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";

export interface CartIndicatorProps {
  className?: string;
}

/**
 * Badge bounce animation - scale with rubbery spring
 */
const badgeBounce = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  bounce: {
    scale: [1, 1.4, 1],
    transition: spring.rubbery,
  },
};

/**
 * Icon shake animation - rotate back and forth
 */
const iconShake = {
  rotate: [0, -8, 8, -8, 0],
  transition: { duration: 0.4, ease: "easeInOut" as const },
};

export function CartIndicator({ className }: CartIndicatorProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();
  const setBadgeRef = useCartAnimationStore((s) => s.setBadgeRef);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Badge ref for fly-to-cart animation target
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  // Track item addition for animation trigger
  const [shouldBounce, setShouldBounce] = useState(false);
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

  // Trigger animations when item is added
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCountRef.current = itemCount;
      return;
    }

    // Trigger bounce/shake when count increases
    if (itemCount > prevCountRef.current) {
      setShouldBounce(true);
      const timeout = setTimeout(() => setShouldBounce(false), 500);
      return () => clearTimeout(timeout);
    }

    prevCountRef.current = itemCount;
  }, [itemCount]);

  // Skeleton before hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full",
          "bg-zinc-100/50 dark:bg-zinc-800/50",
          className
        )}
        aria-hidden="true"
      >
        <ShoppingBag className="h-5 w-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={open}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      animate={shouldAnimate && shouldBounce ? iconShake : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "bg-zinc-100/80 dark:bg-zinc-800/80",
        "text-zinc-700 dark:text-zinc-300",
        "transition-colors duration-150",
        "hover:bg-amber-500 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
    >
      <ShoppingBag className="h-5 w-5" />

      <AnimatePresence mode="wait">
        {itemCount > 0 && (
          <motion.span
            ref={badgeRef}
            key={`badge-${itemCount}`}
            variants={shouldAnimate ? badgeBounce : undefined}
            initial={shouldAnimate ? "initial" : false}
            animate={
              shouldAnimate
                ? shouldBounce
                  ? "bounce"
                  : "animate"
                : { scale: 1, opacity: 1 }
            }
            exit={shouldAnimate ? "exit" : undefined}
            className={cn(
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[20px] h-[20px] px-1 rounded-full",
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

export default CartIndicator;
