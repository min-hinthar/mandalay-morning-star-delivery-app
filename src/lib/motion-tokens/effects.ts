/**
 * V7 Motion Token System - Special Effects
 * Celebration, floating, morphing, price ticker, and route drawing animations
 */

import type { Variants } from "framer-motion";
import { spring, transition, duration, easing } from "./core";

// ============================================
// V7 CELEBRATION ANIMATIONS
// ============================================

export const celebration = {
  /** Success checkmark */
  success: {
    initial: { scale: 0, rotate: -45 },
    animate: { scale: 1, rotate: 0, transition: spring.ultraBouncy },
  } as Variants,

  /** Confetti particle (use with stagger) */
  confettiParticle: (index: number) => ({
    initial: { y: 0, x: 0, scale: 0, rotate: 0 },
    animate: {
      y: -100 - Math.random() * 100,
      x: (Math.random() - 0.5) * 200,
      scale: [0, 1, 1, 0],
      rotate: Math.random() * 720 - 360,
      transition: {
        duration: 1 + Math.random() * 0.5,
        ease: easing.out,
        delay: index * 0.02,
      },
    },
  }),

  /** Badge earned */
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0, transition: spring.dramatic },
  } as Variants,

  /** Counter increment */
  counter: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.3, 1],
      transition: { duration: duration.normal, ease: easing.elastic },
    },
  } as Variants,

  /** Star rating fill */
  starFill: (index: number) => ({
    initial: { scale: 0, rotate: -30 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: { ...spring.ultraBouncy, delay: index * 0.1 },
    },
  }),
} as const;

// ============================================
// V7 FLOATING ANIMATIONS
// (For hero elements, decoratives)
// ============================================

/**
 * Float animation with BOUNDED repeat count to prevent mobile crashes.
 * Use sparingly on hero sections only.
 */
export function float(index: number) {
  return {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 3, 0],
      scale: [1, 1.02, 1],
    },
    transition: {
      duration: 5 + index * 0.7,
      repeat: 3, // Bounded to prevent mobile memory issues
      ease: "easeInOut" as const,
      delay: index * 0.4,
    },
  };
}

/**
 * Gentle float animation with BOUNDED repeat count to prevent mobile crashes.
 * Use sparingly on hero sections only.
 */
export function floatGentle(index: number) {
  return {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 1.5, 0],
    },
    transition: {
      duration: 6 + index * 0.5,
      repeat: 3, // Bounded to prevent mobile memory issues
      ease: "easeInOut" as const,
      delay: index * 0.3,
    },
  };
}

// ============================================
// V7 MORPHING ANIMATIONS
// (For hamburger menu, icons)
// ============================================

export const morph = {
  /** Hamburger to X morphing */
  hamburgerTop: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 8, transition: spring.snappy },
  } as Variants,

  hamburgerMiddle: {
    closed: { opacity: 1, scaleX: 1 },
    open: { opacity: 0, scaleX: 0, transition: transition.fast },
  } as Variants,

  hamburgerBottom: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -8, transition: spring.snappy },
  } as Variants,
} as const;

// ============================================
// V7 PRICE TICKER
// ============================================

export const priceTicker = {
  /** Digit change */
  digit: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1, transition: spring.snappy },
    exit: { y: "-100%", opacity: 0, transition: transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 ROUTE DRAWING
// (For map polylines)
// ============================================

export const routeDraw = {
  /** Path drawing animation */
  path: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: easing.out },
        opacity: { duration: 0.3 },
      },
    },
  } as Variants,

  /** Marker pulse - bounded repeat to prevent mobile crashes */
  markerPulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: 5, // Bounded to prevent mobile memory issues
        ease: "easeInOut",
      },
    },
  },
} as const;
