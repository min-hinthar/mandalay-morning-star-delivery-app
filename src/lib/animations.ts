/**
 * Mandalay Morning Star Animation System
 * V3 Foundation - Rich motion throughout the app
 *
 * Usage:
 * - Import duration/easing tokens for consistent timing
 * - Use Framer Motion variants for complex animations
 * - Check reducedMotion before animating
 */

import type { Variants, Transition, MotionProps } from "framer-motion";

// Re-export all variants from the variants module
export * from "./animations/variants";

// ============================================
// DURATION TOKENS
// ============================================

export const duration = {
  /** Hover, toggles, quick feedback - 150ms */
  micro: 0.15,
  /** Fast interactions - 200ms */
  fast: 0.2,
  /** Page transitions, modals - 300ms */
  standard: 0.3,
  /** Deliberate animations - 400ms */
  slow: 0.4,
  /** Celebrations, hero animations - 500ms */
  dramatic: 0.5,
  /** Very slow, ambient - 700ms */
  verySlow: 0.7,
} as const;

// CSS duration values for inline styles
export const durationMs = {
  micro: "150ms",
  fast: "200ms",
  standard: "300ms",
  slow: "400ms",
  dramatic: "500ms",
  verySlow: "700ms",
} as const;

// ============================================
// EASING PRESETS
// ============================================

export const easing = {
  /** Standard deceleration - entering elements */
  out: [0.0, 0.0, 0.2, 1] as const,
  /** Acceleration - exiting elements */
  in: [0.4, 0, 1, 1] as const,
  /** Smooth transitions */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Playful bounce */
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  /** Natural spring-like */
  spring: [0.25, 0.1, 0.25, 1] as const,
  /** Sharp, snappy */
  sharp: [0.4, 0, 0.6, 1] as const,
} as const;

// CSS easing values
export const easingCss = {
  out: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  spring: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

// ============================================
// SPRING TRANSITIONS
// ============================================

export const spring = {
  /** Quick, responsive - buttons, toggles */
  snappy: { type: "spring", stiffness: 400, damping: 25 } as Transition,
  /** Soft, natural - cards, panels */
  gentle: { type: "spring", stiffness: 120, damping: 14 } as Transition,
  /** Playful overshoot - celebrations, emphasis */
  bouncy: { type: "spring", stiffness: 300, damping: 10 } as Transition,
  /** Balanced - modals, drawers */
  smooth: { type: "spring", stiffness: 200, damping: 20 } as Transition,
  /** Very soft - background elements */
  lazy: { type: "spring", stiffness: 80, damping: 20 } as Transition,
} as const;

// ============================================
// STANDARD TRANSITIONS
// ============================================

export const transition = {
  micro: { duration: duration.micro, ease: easing.out } as Transition,
  fast: { duration: duration.fast, ease: easing.out } as Transition,
  standard: { duration: duration.standard, ease: easing.inOut } as Transition,
  slow: { duration: duration.slow, ease: easing.inOut } as Transition,
  dramatic: { duration: duration.dramatic, ease: easing.spring } as Transition,
} as const;

// ============================================
// CORE ANIMATION VARIANTS
// ============================================

/** Basic fade in */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Fade in with upward slide */
export const slideUp: Variants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 },
};

/** Fade in with downward slide */
export const slideDown: Variants = {
  initial: { y: -10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 10, opacity: 0 },
};

/** Fade in from left */
export const slideLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

/** Fade in from right */
export const slideRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

/** Scale in from smaller */
export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/** Scale in with bounce */
export const popIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: spring.bouncy,
  },
  exit: { scale: 0, opacity: 0 },
};

// ============================================
// CONTAINER VARIANTS (Stagger Children)
// ============================================

/** Standard stagger container */
export const stagger: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Fast stagger for lists */
export const staggerFast: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/** Slow stagger for hero sections */
export const staggerSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ============================================
// SPECIAL ANIMATIONS
// ============================================

/** Modal overlay backdrop */
export const overlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transition.fast },
  exit: { opacity: 0, transition: transition.micro },
};

/** Modal/dialog content */
export const modal: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: transition.micro },
};

/** Drawer slide from right */
export const drawer: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: spring.smooth },
  exit: { x: "100%", transition: transition.fast },
};

/** Bottom sheet */
export const bottomSheet: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: spring.smooth },
  exit: { y: "100%", transition: transition.fast },
};

/** Floating animation (continuous) */
export const float: Variants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/** Pulse animation for attention */
export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/** Confetti celebration */
export const confetti: Variants = {
  initial: { y: 0, opacity: 1, rotate: 0 },
  animate: {
    y: "-100vh",
    opacity: 0,
    rotate: 720,
    transition: { duration: 3, ease: "easeOut" },
  },
};

// ============================================
// REDUCED MOTION UTILITIES
// ============================================

/**
 * Check if user prefers reduced motion
 * Use in components: const prefersReduced = useReducedMotion()
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get motion props respecting user preference
 * Returns empty props if user prefers reduced motion
 */
export function getMotionProps(
  variants: Variants,
  reducedMotion?: boolean
): Partial<MotionProps> {
  const shouldReduce = reducedMotion ?? prefersReducedMotion();

  if (shouldReduce) {
    return {};
  }

  return {
    initial: "initial",
    animate: "animate",
    exit: "exit",
    variants,
  };
}

/**
 * Get safe animation props with reduced motion fallback
 */
export function safeAnimate(
  props: MotionProps,
  reducedMotion?: boolean
): MotionProps {
  const shouldReduce = reducedMotion ?? prefersReducedMotion();

  if (shouldReduce) {
    return {
      ...props,
      animate: undefined,
      initial: undefined,
      exit: undefined,
      transition: { duration: 0 },
    };
  }

  return props;
}

// ============================================
// VIEWPORT SETTINGS FOR SCROLL ANIMATIONS
// ============================================

export const viewport = {
  /** Standard scroll reveal */
  default: { once: true, margin: "-100px", amount: 0.3 as const },
  /** Earlier trigger */
  eager: { once: true, margin: "-50px", amount: 0.1 as const },
  /** Later trigger, more visible */
  lazy: { once: true, margin: "-150px", amount: 0.5 as const },
  /** Repeat on every scroll */
  repeat: { once: false, margin: "-100px", amount: 0.3 as const },
} as const;

// ============================================
// LAYOUT ANIMATION IDS
// ============================================

export const layoutIds = {
  tabIndicator: "activeTabIndicator",
  cartBadge: "cartBadge",
  activeStep: "activeStep",
} as const;

// ============================================
// TYPES
// ============================================

export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type SpringKey = keyof typeof spring;
export type TransitionKey = keyof typeof transition;
export type ViewportKey = keyof typeof viewport;
