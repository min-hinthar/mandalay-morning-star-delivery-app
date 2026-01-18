"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";
import { useAnimationPreference } from "./useAnimationPreference";

/**
 * V5 Sprint 2.4 - Reduced Motion Hook
 *
 * Combines system preference with user override for JS animations.
 * Use this to conditionally disable Framer Motion animations.
 *
 * Priority:
 * 1. User override in localStorage (if set)
 * 2. System prefers-reduced-motion
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // Conditionally apply motion
 * <motion.div
 *   initial={prefersReducedMotion ? false : { opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 * />
 *
 * @example
 * // Use with motion variants
 * const variants = {
 *   hidden: prefersReducedMotion ? {} : { opacity: 0, y: 20 },
 *   visible: { opacity: 1, y: 0 }
 * };
 */
export function useReducedMotion(): boolean {
  const { isReduced } = useAnimationPreference();
  return isReduced;
}

/**
 * Lightweight hook using only Framer Motion's built-in detection
 * Use when you don't need user override support
 */
export function useSystemReducedMotion(): boolean | null {
  return useFramerReducedMotion();
}

/**
 * Get motion variants that respect reduced motion preference
 *
 * @example
 * const { fadeIn, slideUp } = useMotionVariants();
 *
 * <motion.div variants={fadeIn} initial="hidden" animate="visible" />
 */
export function useMotionVariants() {
  const prefersReducedMotion = useReducedMotion();

  return {
    /**
     * Fade in animation - respects reduced motion
     */
    fadeIn: {
      hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
      visible: {
        opacity: 1,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: "easeOut" },
      },
    },

    /**
     * Slide up with fade - respects reduced motion
     */
    slideUp: {
      hidden: prefersReducedMotion ? {} : { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: "easeOut" },
      },
    },

    /**
     * Scale in animation - respects reduced motion
     */
    scaleIn: {
      hidden: prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.2, ease: "easeOut" },
      },
    },

    /**
     * Stagger container for child animations
     */
    staggerContainer: {
      hidden: {},
      visible: {
        transition: prefersReducedMotion
          ? { staggerChildren: 0 }
          : { staggerChildren: 0.05 },
      },
    },
  };
}

/**
 * Get transition config that respects reduced motion
 *
 * @example
 * const transition = useMotionTransition();
 * <motion.div transition={transition.spring} />
 */
export function useMotionTransition() {
  const prefersReducedMotion = useReducedMotion();

  return {
    /** No transition (immediate) */
    none: { duration: 0 },

    /** Fast transition (button presses, micro-interactions) */
    fast: prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.15, ease: "easeOut" },

    /** Normal transition (most animations) */
    normal: prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.25, ease: "easeOut" },

    /** Slow transition (page transitions, emphasis) */
    slow: prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.4, ease: "easeOut" },

    /** Spring transition (bouncy, playful) */
    spring: prefersReducedMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 400, damping: 25 },

    /** Elastic spring (cart badge, notifications) */
    elastic: prefersReducedMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 500, damping: 20 },
  };
}
