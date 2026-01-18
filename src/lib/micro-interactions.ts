/**
 * V3 Sprint 6: Micro-interactions Library
 *
 * Framer Motion variants for subtle interaction feedback.
 * Button hovers, card lifts, toggles, favorites, and more.
 */

import type { Variants, TargetAndTransition, Transition } from "framer-motion";

// ============================================
// TIMING CONSTANTS
// ============================================

export const timing = {
  micro: 0.1,
  fast: 0.15,
  standard: 0.2,
  slow: 0.3,
  dramatic: 0.5,
} as const;

// ============================================
// EASING FUNCTIONS
// ============================================

export const easing = {
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
  springBouncy: { type: "spring" as const, stiffness: 500, damping: 15 },
} as const;

// ============================================
// BUTTON INTERACTIONS
// ============================================

export const buttonHover: TargetAndTransition = {
  scale: 1.02,
  transition: { duration: timing.fast, ease: easing.easeOut },
};

export const buttonTap: TargetAndTransition = {
  scale: 0.98,
  transition: { duration: timing.micro },
};

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: buttonHover,
  tap: buttonTap,
};

export const primaryButtonVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 4px 12px rgba(212, 160, 23, 0.3)",
    transition: { duration: timing.fast, ease: easing.easeOut },
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: { duration: timing.micro },
  },
};

// ============================================
// CARD INTERACTIONS
// ============================================

export const cardHover: TargetAndTransition = {
  scale: 1.01,
  y: -2,
  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
  transition: { duration: timing.fast, ease: easing.easeOut },
};

export const cardTap: TargetAndTransition = {
  scale: 0.99,
  y: 0,
  transition: { duration: timing.micro },
};

export const cardVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  hover: cardHover,
  tap: cardTap,
};

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

// ============================================
// ICON BUTTON
// ============================================

export const iconButtonVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    transition: { duration: timing.fast },
  },
  tap: {
    scale: 0.9,
    transition: { duration: timing.micro },
  },
};

export const rotatingIconVariants: Variants = {
  initial: { rotate: 0 },
  active: {
    rotate: 180,
    transition: { duration: timing.standard, ease: easing.easeInOut },
  },
};

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
// PULSE (for attention)
// ============================================

export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a stagger transition for list items
 */
export function staggerChildren(
  staggerDelay = 0.05,
  delayChildren = 0
): Transition {
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

// ============================================
// HAPTIC FEEDBACK (re-export from gestures)
// ============================================

export { triggerHaptic } from "./swipe-gestures";
