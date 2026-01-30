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

