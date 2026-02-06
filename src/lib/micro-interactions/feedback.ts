/**
 * Micro-interactions - Visual Feedback
 * Badge, ripple, shake, pulse, and spring presets
 */

import type { Variants, Transition } from "framer-motion";
import { timing, easing } from "./timing";

// ============================================
// BADGE/CHIP
// ============================================

export const badgePopVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      scale: { duration: timing.standard, times: [0, 0.6, 1] },
      opacity: { duration: timing.fast },
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: timing.fast },
  },
};

// ============================================
// RIPPLE EFFECT
// ============================================

export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: { duration: 0.6, ease: easing.easeOut },
  },
};

// ============================================
// SHAKE (for errors)
// ============================================

export const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: timing.slow },
  },
};

// ============================================
// PULSE (for attention) - bounded repeat to prevent mobile crashes
// ============================================

export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1,
      repeat: 3, // Bounded to prevent mobile memory issues
      ease: easing.easeInOut,
    },
  },
};

// ============================================
// SPRING PRESETS
// ============================================

/**
 * Tight spring for progress bars - Apple-like crisp feel
 * No overshoot due to high damping
 */
export const progressSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 1,
};

/**
 * Snappy spring for quick feedback
 */
export const snappySpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

/**
 * Bouncy spring for celebratory animations
 */
export const bouncySpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 10,
};
