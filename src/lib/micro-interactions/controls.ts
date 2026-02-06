/**
 * Micro-interactions - Controls
 * Toggle, checkbox, heart favorite, and quantity stepper animations
 */

import type { Variants, TargetAndTransition } from "framer-motion";
import { timing, easing } from "./timing";

// ============================================
// TOGGLE SWITCH
// ============================================

export const toggleKnobVariants: Variants = {
  off: {
    x: 2,
    transition: easing.spring,
  },
  on: {
    x: 22,
    transition: easing.spring,
  },
};

export const toggleTrackVariants: Variants = {
  off: {
    backgroundColor: "var(--color-surface-muted)",
    transition: { duration: timing.fast },
  },
  on: {
    backgroundColor: "var(--color-jade)",
    transition: { duration: timing.fast },
  },
};

// ============================================
// CHECKBOX
// ============================================

export const checkboxVariants: Variants = {
  unchecked: {
    scale: 1,
    backgroundColor: "transparent",
  },
  checked: {
    scale: [0.9, 1.1, 1],
    backgroundColor: "var(--color-jade)",
    transition: {
      scale: { duration: timing.standard, times: [0, 0.5, 1] },
      backgroundColor: { duration: timing.fast },
    },
  },
};

export const checkmarkVariants: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: timing.standard, ease: easing.easeOut },
  },
};

// ============================================
// HEART FAVORITE
// ============================================

export const heartVariants: Variants = {
  unfavorited: {
    scale: 1,
    fill: "transparent",
    stroke: "var(--color-text-muted)",
  },
  favorited: {
    scale: [1, 1.3, 1],
    fill: "var(--color-error)",
    stroke: "var(--color-error)",
    transition: {
      scale: {
        duration: timing.slow,
        times: [0, 0.3, 1],
        ease: easing.bounce,
      },
      fill: { duration: timing.fast },
      stroke: { duration: timing.fast },
    },
  },
};

export const heartTap: TargetAndTransition = {
  scale: 0.9,
  transition: { duration: timing.micro },
};

// ============================================
// QUANTITY STEPPER
// ============================================

export const quantityFlipVariants: Variants = {
  initial: { y: 0, opacity: 1 },
  exit: (direction: number) => ({
    y: direction > 0 ? -20 : 20,
    opacity: 0,
    transition: { duration: timing.fast },
  }),
  enter: (direction: number) => ({
    y: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: timing.fast },
  },
};

export const stepperButtonVariants: Variants = {
  initial: { scale: 1 },
  tap: {
    scale: 0.9,
    transition: { duration: timing.micro },
  },
  disabled: {
    opacity: 0.5,
    scale: 1,
  },
};
