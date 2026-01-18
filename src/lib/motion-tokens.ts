/**
 * V5 Motion Token System
 *
 * Standardized Framer Motion presets that align with CSS tokens.
 * Use these for consistent animations across the application.
 *
 * @example
 * import { transitions, variants } from '@/lib/motion-tokens';
 *
 * <motion.div
 *   variants={variants.fadeIn}
 *   initial="initial"
 *   animate="animate"
 * />
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion";

// ============================================
// V5 DURATION TOKENS (matches tokens.css)
// ============================================

export const duration = {
  instant: 0,
  fast: 0.15, // 150ms
  normal: 0.25, // 250ms
  slow: 0.4, // 400ms
  slower: 0.6, // 600ms
} as const;

// ============================================
// V5 EASING TOKENS (matches tokens.css)
// ============================================

export const easing = {
  default: [0.4, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
} as const;

// ============================================
// V5 SPRING PRESETS
// ============================================

export const spring = {
  /** Gentle spring - no overshoot, smooth deceleration */
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  /** Bouncy spring - slight overshoot for playful feel */
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 15,
    mass: 1,
  },
  /** Snappy spring - quick response, minimal overshoot */
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  /** Wobbly spring - more pronounced bounce */
  wobbly: {
    type: "spring" as const,
    stiffness: 250,
    damping: 10,
    mass: 1,
  },
} as const;

// ============================================
// V5 TRANSITION PRESETS
// ============================================

export const transitions = {
  /** Instant transition (no animation) */
  instant: {
    duration: duration.instant,
  } as Transition,

  /** Fast transition for micro-interactions */
  fast: {
    duration: duration.fast,
    ease: easing.default,
  } as Transition,

  /** Normal transition for most animations */
  normal: {
    duration: duration.normal,
    ease: easing.default,
  } as Transition,

  /** Slow transition for dramatic reveals */
  slow: {
    duration: duration.slow,
    ease: easing.out,
  } as Transition,

  /** Spring transition for natural movement */
  spring: spring.gentle,

  /** Bouncy spring for celebratory moments */
  springBouncy: spring.bouncy,
} as const;

// ============================================
// V5 ANIMATION VARIANTS
// ============================================

export const variants = {
  /** Fade in animation */
  fadeIn: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      transition: transitions.fast,
    },
  } as Variants,

  /** Fade out animation */
  fadeOut: {
    initial: { opacity: 1 },
    animate: {
      opacity: 0,
      transition: transitions.fast,
    },
  } as Variants,

  /** Slide up with fade */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: transitions.fast,
    },
  } as Variants,

  /** Slide down with fade */
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      y: 10,
      transition: transitions.fast,
    },
  } as Variants,

  /** Slide in from right */
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: transitions.fast,
    },
  } as Variants,

  /** Slide in from left */
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: transitions.fast,
    },
  } as Variants,

  /** Scale in with fade */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: transitions.fast,
    },
  } as Variants,

  /** Pop in with spring */
  popIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: spring.bouncy,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: transitions.fast,
    },
  } as Variants,
} as const;

// ============================================
// V5 MICRO-INTERACTION PRESETS
// ============================================

export const microInteractions = {
  /** Button tap feedback */
  buttonTap: {
    scale: 0.98,
    transition: { duration: duration.instant },
  } as TargetAndTransition,

  /** Button hover feedback */
  buttonHover: {
    scale: 1.02,
    transition: transitions.fast,
  } as TargetAndTransition,

  /** Card hover lift */
  cardHover: {
    y: -2,
    boxShadow: "var(--elevation-3)",
    transition: transitions.fast,
  } as TargetAndTransition,

  /** Icon button tap */
  iconTap: {
    scale: 0.9,
    transition: { duration: duration.instant },
  } as TargetAndTransition,
} as const;

// ============================================
// V5 OVERLAY VARIANTS (Modal, Drawer, BottomSheet)
// ============================================

export const overlayVariants = {
  /** Backdrop fade */
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transitions.normal },
    exit: { opacity: 0, transition: transitions.fast },
  } as Variants,

  /** Modal scale + fade */
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: transitions.fast,
    },
  } as Variants,

  /** Drawer slide from right */
  drawer: {
    initial: { x: "100%" },
    animate: {
      x: 0,
      transition: transitions.normal,
    },
    exit: {
      x: "100%",
      transition: transitions.fast,
    },
  } as Variants,

  /** Bottom sheet slide up */
  bottomSheet: {
    initial: { y: "100%" },
    animate: {
      y: 0,
      transition: transitions.normal,
    },
    exit: {
      y: "100%",
      transition: transitions.fast,
    },
  } as Variants,
} as const;

// ============================================
// V5 ACCORDION VARIANTS
// ============================================

export const accordionVariants = {
  /** Accordion content expand/collapse */
  content: {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: duration.normal, ease: easing.out },
        opacity: { duration: duration.fast, delay: 0.1 },
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: duration.fast },
        opacity: { duration: duration.instant },
      },
    },
  } as Variants,

  /** Accordion trigger rotate icon */
  trigger: {
    collapsed: { rotate: 0 },
    expanded: {
      rotate: 180,
      transition: transitions.normal,
    },
  } as Variants,
} as const;

// ============================================
// V5 LIST STAGGER UTILITIES
// ============================================

/**
 * Create staggered list container variants
 */
export function createStaggerContainer(
  staggerDelay = 0.05,
  delayChildren = 0.1
): Variants {
  return {
    initial: { opacity: 0 },
    animate: {
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
 * List item variants for use with stagger container
 */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.fast,
  },
};

// ============================================
// REDUCED MOTION SUPPORT
// ============================================

/**
 * Check if user prefers reduced motion
 * Use this to conditionally disable animations
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation props with reduced motion support
 * Returns empty objects if reduced motion is preferred
 */
export function getMotionProps<T extends Variants>(
  variants: T
): { variants: T } | Record<string, never> {
  if (prefersReducedMotion()) {
    return {};
  }
  return { variants };
}

/**
 * Get transition with reduced motion support
 * Returns instant transition if reduced motion is preferred
 */
export function getTransition(transition: Transition): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return transition;
}
