"use client";

/**
 * CartIndicator - Cart icon with animated badge for header
 *
 * Features:
 * - Consistent styling with CartBar/CartDrawer (amber background)
 * - Badge bounces when item is added
 * - Registers badge ref for fly-to-cart animation target
 * - Hydration-safe with localStorage persistence
 */

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartAnimationStore } from "@/lib/stores/cart-animation-store";
import { cn } from "@/lib/utils/cn";

export interface CartIndicatorProps {
  className?: string;
}

/**
 * Badge animation - simple scale
 */
const badgeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
};

export function CartIndicator({ className }: CartIndicatorProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();

  // Badge ref for fly-to-cart animation target
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  // Mount effect - register badge ref (use getState to avoid subscription)
  useEffect(() => {
    setMounted(true);
    useCartAnimationStore.getState().setBadgeRef(badgeRef);

    return () => {
      useCartAnimationStore.getState().setBadgeRef(null);
    };
  }, []);

  // Skeleton before hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full",
          "bg-amber-100 dark:bg-amber-900/30",
          className
        )}
        aria-hidden="true"
      >
        <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "bg-amber-100 dark:bg-amber-900/30",
        "transition-colors duration-150",
        "hover:bg-amber-200 dark:hover:bg-amber-900/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
    >
      <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />

      <AnimatePresence mode="wait">
        {itemCount > 0 && (
          <motion.span
            ref={badgeRef}
            key={`badge-${itemCount}`}
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[20px] h-[20px] px-1 rounded-full",
              "bg-amber-500 text-xs font-bold text-text-inverse",
              "shadow-lg ring-2 ring-white dark:ring-zinc-950"
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default CartIndicator;
