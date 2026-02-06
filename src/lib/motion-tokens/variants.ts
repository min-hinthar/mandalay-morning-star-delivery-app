/**
 * V7 Motion Token System - Animation Variants
 * Variants, hover effects, input focus, tap, overlay, badge, and cart animations
 */

import type { Variants, TargetAndTransition } from "framer-motion";
import { spring, transition, duration, easing } from "./core";

// ============================================
// V7 ANIMATION VARIANTS
// ============================================

export const variants = {
  /** Fade in */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.normal },
    exit: { opacity: 0, transition: transition.fast },
  } as Variants,

  /** Slide up with fade */
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, y: -12, transition: transition.fast },
  } as Variants,

  /** Slide down with fade */
  slideDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, y: 12, transition: transition.fast },
  } as Variants,

  /** Slide in from right */
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: spring.default },
    exit: { opacity: 0, x: -20, transition: transition.fast },
  } as Variants,

  /** Slide in from left */
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: spring.default },
    exit: { opacity: 0, x: 20, transition: transition.fast },
  } as Variants,

  /** Scale in with spring */
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: spring.default },
    exit: { opacity: 0, scale: 0.9, transition: transition.fast },
  } as Variants,

  /** Pop in with bounce */
  popIn: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1, transition: spring.ultraBouncy },
    exit: { opacity: 0, scale: 0.7, transition: transition.fast },
  } as Variants,

  /** Bounce in from below */
  bounceUp: {
    initial: { opacity: 0, y: 60, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring.rubbery },
    exit: { opacity: 0, y: -30, transition: transition.fast },
  } as Variants,

  /** Rotate in with scale */
  rotateIn: {
    initial: { opacity: 0, scale: 0.8, rotate: -8 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: spring.default },
    exit: { opacity: 0, scale: 0.8, rotate: 8, transition: transition.fast },
  } as Variants,

  /** Wobble entrance */
  wobbleIn: {
    initial: { opacity: 0, scale: 0.9, rotate: -3 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: spring.wobbly },
    exit: { opacity: 0, scale: 0.9, transition: transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 HOVER EFFECTS
// ============================================

export const hover = {
  /** Lift up with shadow */
  lift: {
    whileHover: { y: -6, scale: 1.02 },
    whileTap: { scale: 0.97, y: 0 },
    transition: spring.snappy,
  },

  /** Scale up */
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: spring.snappy,
  },

  /** Gentle scale */
  scaleGentle: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: spring.gentle,
  },

  /** Tilt effect */
  tilt: {
    whileHover: { rotate: 2, scale: 1.02 },
    whileTap: { rotate: -1, scale: 0.98 },
    transition: spring.snappy,
  },

  /** Bounce on hover */
  bounce: {
    whileHover: { y: -8, scale: 1.03 },
    whileTap: { y: 0, scale: 0.95 },
    transition: spring.ultraBouncy,
  },

  /** Glow effect (use with CSS shadow) */
  glow: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: spring.gentle,
  },

  /** Image zoom */
  imageZoom: {
    whileHover: { scale: 1.08 },
    transition: { duration: duration.slow, ease: easing.out },
  },

  /** Button press - depth effect with shadow reduction */
  buttonPress: {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: {
      scale: 0.97,
      y: 1,
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)", // ~--shadow-xs equivalent, kept numeric for FM interpolation
    },
    transition: spring.snappyButton,
  },
} as const;

// ============================================
// V7 INPUT FOCUS ANIMATIONS
// ============================================

/**
 * Input focus states using CSS variable shadow tokens.
 * These are discrete state changes (not animated between values),
 * so CSS variables work properly for theme-awareness.
 */
export const inputFocus = {
  /** Initial state - no glow */
  initial: { boxShadow: "var(--shadow-none)" },
  /** Default focus - primary glow */
  focus: { boxShadow: "var(--shadow-focus)" },
  /** Error focus - red glow */
  error: { boxShadow: "var(--shadow-focus-error)" },
  /** Success focus - green glow */
  success: { boxShadow: "var(--shadow-focus-success)" },
} as const;

// ============================================
// V7 TAP EFFECTS
// ============================================

export const tap = {
  /** Button tap */
  button: {
    scale: 0.96,
    transition: { duration: duration.micro },
  } as TargetAndTransition,

  /** Icon tap */
  icon: {
    scale: 0.85,
    transition: { duration: duration.micro },
  } as TargetAndTransition,

  /** Card tap */
  card: {
    scale: 0.98,
    transition: spring.snappy,
  } as TargetAndTransition,

  /** Bouncy tap */
  bouncy: {
    scale: 0.9,
    transition: spring.rubbery,
  } as TargetAndTransition,
} as const;

// ============================================
// V7 OVERLAY VARIANTS
// ============================================

export const overlay = {
  /** Backdrop with blur (use with CSS backdrop-filter) */
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.normal },
    exit: { opacity: 0, transition: transition.fast },
  } as Variants,

  /** Modal scale + blur in */
  modal: {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, scale: 0.92, y: 20, transition: transition.fast },
  } as Variants,

  /**
   * Glassmorphism modal
   * MOBILE CRASH PREVENTION: backdropFilter removed from animation
   * Use CSS sm:backdrop-blur-* classes instead for mobile safety
   */
  glass: {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: spring.gentle,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: transition.fast,
    },
  } as Variants,

  /** Drawer from right */
  drawer: {
    initial: { x: "100%" },
    animate: { x: 0, transition: spring.default },
    exit: { x: "100%", transition: transition.normal },
  } as Variants,

  /** Bottom sheet */
  bottomSheet: {
    initial: { y: "100%" },
    animate: { y: 0, transition: spring.default },
    exit: { y: "100%", transition: transition.normal },
  } as Variants,

  /** Toast slide in */
  toast: {
    initial: { opacity: 0, x: 100, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1, transition: spring.default },
    exit: { opacity: 0, x: 100, scale: 0.9, transition: transition.fast },
  } as Variants,
} as const;

// ============================================
// CART ANIMATIONS (from @/lib/animations/cart)
// ============================================

/**
 * Cart bar bounce when item is added
 */
export const cartBarBounce: TargetAndTransition = {
  y: [0, -8, 0],
  transition: {
    duration: 0.3,
    times: [0, 0.5, 1],
    ease: "easeOut",
  },
};

/**
 * Cart bar slide up animation (initial appearance)
 */
export const cartBarSlideUp: Variants = {
  hidden: {
    y: "100%",
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: spring.default,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Badge variants for AnimatePresence
 */
export const badgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: spring.ultraBouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
  pop: {
    scale: [1, 1.3, 1],
    transition: {
      duration: 0.25,
      times: [0, 0.5, 1],
    },
  },
};
