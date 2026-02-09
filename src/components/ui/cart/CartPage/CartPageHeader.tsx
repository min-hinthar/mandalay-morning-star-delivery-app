"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export interface CartPageHeaderProps {
  itemCount: number;
  className?: string;
}

const headerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function CartPageHeader({ itemCount, className }: CartPageHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      variants={shouldAnimate ? headerVariants : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      className={cn("mb-6", className)}
    >
      {/* Continue Shopping link */}
      <m.div variants={shouldAnimate ? itemVariants : undefined}>
        <Link
          href="/menu"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            "text-text-secondary hover:text-primary",
            "transition-colors mb-3"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </m.div>

      {/* Title with item count */}
      <m.h1
        variants={shouldAnimate ? itemVariants : undefined}
        transition={getSpring(spring.gentle)}
        className="text-2xl sm:text-3xl font-display font-bold text-text-primary"
      >
        Your Cart{" "}
        <span className="text-text-secondary font-normal text-xl sm:text-2xl">
          ({itemCount} {itemCount === 1 ? "item" : "items"})
        </span>
      </m.h1>
    </m.div>
  );
}

export default CartPageHeader;
