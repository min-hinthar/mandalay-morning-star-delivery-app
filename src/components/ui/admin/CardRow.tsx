"use client";

import { type ReactNode } from "react";
import { m, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface CardRowProps {
  children: ReactNode;
  /** Tailwind bg class for status tint (e.g. "bg-status-warning/5") */
  statusTint?: string;
  /** Whether this row is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
  /** Framer Motion layoutId for shared layout animations */
  layoutId?: string;
}

// ============================================
// STAGGER EXPORTS (40ms per CONTEXT decision)
// ============================================

/** Container variants with 40ms stagger for card row lists */
export const cardContainer: Variants = staggerContainer(0.04, 0.06);

/** Item variants for card row entry animation */
export const cardItem: Variants = staggerItem;

// ============================================
// HOVER CONFIG (FM animated shadow needs numeric values for interpolation)
// ============================================

/* eslint-disable no-restricted-syntax */
const hoverEffect = {
  scale: 1.01,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)", // ~--shadow-md equivalent
};
/* eslint-enable no-restricted-syntax */

// ============================================
// COMPONENT
// ============================================

export function CardRow({
  children,
  statusTint,
  selected = false,
  onClick,
  className,
  layoutId,
}: CardRowProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      layoutId={layoutId}
      variants={cardItem}
      whileHover={shouldAnimate ? hoverEffect : undefined}
      whileTap={shouldAnimate ? { scale: 0.995 } : undefined}
      transition={getSpring(spring.gentle)}
      onClick={onClick}
      className={cn(
        "rounded-xl p-4 bg-surface-primary border border-border transition-shadow",
        onClick && "cursor-pointer",
        statusTint,
        selected && "ring-2 ring-accent-teal shadow-lg bg-accent-teal/[0.04] scale-[1.01]",
        className
      )}
    >
      {children}
    </m.div>
  );
}
