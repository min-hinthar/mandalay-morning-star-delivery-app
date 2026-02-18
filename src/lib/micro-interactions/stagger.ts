/**
 * Micro-interactions - Stagger & List Utilities
 * Variable stagger, list items, and container variants
 */

import type { Variants, Transition } from "framer-motion";
import { timing, easing } from "./timing";

/**
 * Calculate variable stagger delay for natural-feeling cascade
 *
 * Items at the start animate quickly (30ms gaps), later items
 * slow down (up to 80ms gaps) for a decelerating cascade effect.
 *
 * @param index - Item index in the list (0-based)
 * @param options - Configuration options
 * @returns Delay in seconds
 *
 * @example
 * // In a list component:
 * {items.map((item, i) => (
 *   <motion.div
 *     key={item.id}
 *     initial={{ opacity: 0, y: 10 }}
 *     animate={{ opacity: 1, y: 0 }}
 *     transition={{ delay: variableStagger(i) }}
 *   />
 * ))}
 */
export function variableStagger(
  index: number,
  options?: {
    /** Base delay in seconds (default: 0.03 = 30ms) */
    baseDelay?: number;
    /** Maximum delay in seconds (default: 0.08 = 80ms) */
    maxDelay?: number;
    /** Acceleration factor (default: 0.005) */
    acceleration?: number;
  }
): number {
  const { baseDelay = 0.03, maxDelay = 0.08, acceleration = 0.005 } = options ?? {};

  // Quadratic deceleration: delay increases with index^2
  const delay = baseDelay + index * index * acceleration;
  return Math.min(delay, maxDelay);
}

/**
 * Create variable stagger variants for a container
 */
export function createVariableStaggerContainer(
  itemCount: number,
  options?: Parameters<typeof variableStagger>[1]
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        // Calculate total animation time based on item count
        staggerChildren: variableStagger(Math.floor(itemCount / 2), options),
        delayChildren: 0.05,
      },
    },
  };
}

/**
 * Create a stagger transition for list items
 */
export function staggerChildren(staggerDelay = 0.05, delayChildren = 0): Transition {
  return {
    staggerChildren: staggerDelay,
    delayChildren,
  };
}

/**
 * Create a list item variant with stagger support
 */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.standard, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: timing.fast },
  },
};

/**
 * Container variant for staggered children
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: staggerChildren(0.05, 0.1),
  },
};
