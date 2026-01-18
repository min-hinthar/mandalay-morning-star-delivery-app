"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { cn } from "@/lib/utils/cn";
import { snappySpring } from "@/lib/micro-interactions";

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();
  const prefersReducedMotion = useReducedMotion();

  // Track cart changes to trigger pulse animation
  const [shouldPulse, setShouldPulse] = useState(false);
  const prevCountRef = useRef(itemCount);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip pulse on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCountRef.current = itemCount;
      return;
    }

    // Trigger pulse when count changes (add, remove, or quantity change)
    if (itemCount !== prevCountRef.current) {
      setShouldPulse(true);
      prevCountRef.current = itemCount;

      // Reset pulse after animation completes
      const timeout = setTimeout(() => setShouldPulse(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [itemCount]);

  return (
    <motion.button
      onClick={open}
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full",
        "bg-secondary/50 text-foreground",
        "transition-colors duration-200",
        "hover:bg-primary hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence mode="wait">
        {itemCount > 0 && (
          <motion.span
            key={`badge-${itemCount}`}
            initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={
              prefersReducedMotion
                ? { scale: 1, opacity: 1 }
                : shouldPulse
                  ? { scale: [1, 1.2, 1], opacity: 1 }
                  : { scale: 1, opacity: 1 }
            }
            exit={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : shouldPulse
                  ? { duration: 0.3, type: "spring", stiffness: 400, damping: 15 }
                  : snappySpring
            }
            className={cn(
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[22px] h-[22px] px-1.5 rounded-full",
              "bg-primary text-[11px] font-bold text-white",
              "shadow-lg ring-2 ring-background"
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
