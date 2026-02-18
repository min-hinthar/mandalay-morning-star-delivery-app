/**
 * V7 Motion Token System - Stagger Utilities
 * Stagger containers, items, and delay calculations
 */

import type { Variants } from "framer-motion";
import { spring, transition } from "./core";

// ============================================
// V7 STAGGER UTILITIES
// ============================================

/**
 * Standard stagger gap for Phase 22+ (80ms between items)
 */
export const STAGGER_GAP = 0.08;

/**
 * Maximum stagger delay cap (500ms) - items beyond index 6 get same delay
 * Prevents excessively long stagger animations on large lists
 */
export const MAX_STAGGER_DELAY = 0.5;

/**
 * Create staggered container variants
 */
export function staggerContainer(staggerDelay = 0.06, delayChildren = 0.08): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Create Phase 22 standard stagger container (80ms gap, capped at 500ms)
 * Use for menu items, order history, and other scrolling lists
 */
export function staggerContainer80(delayChildren = 0.08): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_GAP,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: STAGGER_GAP / 2,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Stagger item variants
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring.default },
  exit: { opacity: 0, y: -8, transition: transition.fast },
};

/**
 * Stagger item with rotation
 */
export const staggerItemRotate: Variants = {
  hidden: { opacity: 0, y: 16, rotate: -3 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: spring.default },
  exit: { opacity: 0, y: -8, rotate: 3, transition: transition.fast },
};

/**
 * Calculate stagger delay with cap
 * Items beyond index 6 get same delay (500ms max) per RESEARCH pitfall
 */
export function staggerDelay(
  index: number,
  baseDelay = STAGGER_GAP,
  maxDelay = MAX_STAGGER_DELAY
): number {
  return Math.min(index * baseDelay, maxDelay);
}
