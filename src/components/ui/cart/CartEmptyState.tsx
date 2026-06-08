"use client";

/**
 * CartEmptyState — warm-paper empty cart (After Dark)
 *
 * Editorial, bilingual, calm: a warm clay disc + staggered entrance + a clear
 * route back to the menu. No infinite loops (mobile-safe).
 */

import Link from "next/link";
import { m } from "framer-motion";
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
    <m.div
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {/* Warm clay disc */}
      <m.div
        variants={shouldAnimate ? itemVariants : undefined}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full",
          "border border-hero-clay/20 bg-hero-clay/10"
        )}
      >
        <ShoppingBag className="h-14 w-14 text-hero-clay" />
      </m.div>

      {/* Heading — bilingual */}
      <m.h3
        variants={shouldAnimate ? itemVariants : undefined}
        className="mt-6 font-display text-xl font-bold text-text-primary"
      >
        Your cart is empty
      </m.h3>
      <m.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="font-burmese text-sm text-text-muted"
        lang="my"
      >
        သင့်ခြင်းတောင်း ဗလာဖြစ်နေပါသည်
      </m.p>

      {/* Description */}
      <m.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="mt-2 max-w-[240px] font-body text-sm text-text-muted"
      >
        Browse our authentic Burmese dishes and add something delicious to your cart.
      </m.p>

      {/* Delivery schedule context */}
      <m.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="mt-1 text-xs text-text-muted"
      >
        Check our menu for delivery schedule and cutoff times.
      </m.p>

      {/* CTA Button */}
      <m.div
        variants={shouldAnimate ? itemVariants : undefined}
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={getSpring(spring.snappy)}
        className="mt-8"
      >
        <Button variant="primary" size="lg" className="shadow-elevated" onClick={onClose} asChild>
          <Link href="/menu">Browse Menu · မီနူးကြည့်ရန်</Link>
        </Button>
      </m.div>
    </m.div>
  );
}

export default CartEmptyState;
