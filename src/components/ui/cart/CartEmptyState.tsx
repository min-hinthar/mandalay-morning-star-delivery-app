"use client";

/**
 * CartEmptyState Component
 * Friendly empty cart state with animation
 *
 * Features:
 * - Animated floating shopping bag icon
 * - Staggered entrance animation
 * - CTA to browse menu
 * - Respects animation preferences
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

export interface CartEmptyStateProps {
  /** Callback when close action should trigger */
  onClose?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function CartEmptyState({ onClose, className }: CartEmptyStateProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {/* Static bag icon - removed infinite animations to prevent mobile crashes */}
      <motion.div
        variants={shouldAnimate ? itemVariants : undefined}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full",
          "bg-gradient-cart-summary",
          "shadow-lg shadow-amber-500/10"
        )}
      >
        <ShoppingBag className="h-14 w-14 text-amber-500/70" />
      </motion.div>

      {/* Heading */}
      <motion.h3
        variants={shouldAnimate ? itemVariants : undefined}
        className="mt-6 text-xl font-display font-bold text-text-primary"
      >
        Your cart is empty
      </motion.h3>

      {/* Description */}
      <motion.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="mt-2 text-sm font-body text-text-secondary max-w-[240px]"
      >
        Browse our authentic Burmese dishes and add something delicious to your
        cart!
      </motion.p>

      {/* CTA Button */}
      <motion.div
        variants={shouldAnimate ? itemVariants : undefined}
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={getSpring(spring.snappy)}
        className="mt-8"
      >
        <Button
          variant="primary"
          size="lg"
          className="shadow-elevated"
          onClick={onClose}
          asChild
        >
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default CartEmptyState;
