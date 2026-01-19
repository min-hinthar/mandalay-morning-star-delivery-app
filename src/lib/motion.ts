/**
 * V6 Framer Motion Presets
 * Pepper Aesthetic - Spring-based, playful animations
 *
 * Usage:
 * import { v6FadeInUp, v6Spring, v6HoverLift } from '@/lib/motion';
 * <motion.div {...v6FadeInUp} />
 */

import { type Variants, type Transition } from "framer-motion";

// ============================================
// V6 SPRING CONFIGURATIONS
// ============================================

/** Default spring for most interactions */
export const v6Spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

/** Bouncier spring for playful emphasis */
export const v6SpringBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

/** Gentle spring for large elements */
export const v6SpringGentle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 30,
};

/** Snappy spring for micro-interactions */
export const v6SpringSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

// ============================================
// V6 DURATION & EASING PRESETS
// ============================================

export const v6Duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.22,
  slow: 0.35,
  slower: 0.5,
} as const;

export const v6Easing = {
  default: [0.2, 0.8, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
} as const;

// ============================================
// V6 ANIMATION VARIANTS
// ============================================

/** Fade in from below - section reveals */
export const v6FadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: v6Easing.default },
};

/** Fade in with scale - modals, cards appearing */
export const v6ScaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: v6Spring,
};

/** Slide in from right - drawers, panels */
export const v6SlideInRight = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: v6Spring,
};

/** Slide in from bottom - mobile sheets */
export const v6SlideInBottom = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: v6Spring,
};

// ============================================
// V6 HOVER EFFECTS
// ============================================

/** Card hover lift effect */
export const v6HoverLift = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: v6Spring,
};

/** Button hover scale */
export const v6HoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: v6SpringSnappy,
};

/** Image zoom on card hover */
export const v6ImageZoom = {
  whileHover: { scale: 1.03 },
  transition: { duration: 0.3, ease: v6Easing.default },
};

// ============================================
// V6 SCROLL REVEAL VARIANTS
// ============================================

/** Container for staggered children */
export const v6StaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Child item for staggered reveals */
export const v6StaggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: v6Easing.default },
  },
};

/** Viewport config for scroll-triggered animations */
export const v6ViewportOnce = {
  viewport: { once: true, margin: "-50px" },
};

// ============================================
// V6 TAB/NAV TRANSITIONS
// ============================================

/** Active tab indicator (use with layoutId) */
export const v6TabIndicator = {
  layout: true,
  transition: v6Spring,
};

// ============================================
// V6 SUCCESS/FEEDBACK ANIMATIONS
// ============================================

/** Success checkmark scale in */
export const v6SuccessScale: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: v6SpringBouncy,
  },
};

/** Pulse ring for status indicators */
export const v6PulseRing: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: 1.8,
    opacity: 0,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
};

// ============================================
// V6 FLOATING INGREDIENT ANIMATION
// Hero decorative elements
// ============================================

export const v6FloatIngredient = (index: number) => ({
  animate: {
    y: [0, -12, 0],
    rotate: [0, 3, 0],
  },
  transition: {
    duration: 6 + index * 0.5, // Stagger durations
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: index * 0.3, // Stagger starts
  },
});

// ============================================
// V6 REDUCED MOTION VARIANTS
// Respects prefers-reduced-motion
// ============================================

export const v6ReducedMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.01 },
};

/**
 * Helper to check if reduced motion is preferred
 * Use in components that need runtime detection
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// ============================================
// V6 UTILITY HELPERS
// ============================================

/**
 * Create staggered delay for items in a list
 * @param index - Item index
 * @param baseDelay - Base delay in seconds (default 0.08)
 * @param maxDelay - Maximum delay cap (default 0.64 = 8 items)
 */
export const v6StaggerDelay = (
  index: number,
  baseDelay = 0.08,
  maxDelay = 0.64
): number => {
  return Math.min(index * baseDelay, maxDelay);
};

/**
 * Get animation props based on reduced motion preference
 * @param normalProps - Props for normal motion
 * @param reducedProps - Props for reduced motion (optional)
 */
export const v6WithReducedMotion = <T extends object>(
  normalProps: T,
  reducedProps?: Partial<T>
): T => {
  if (prefersReducedMotion()) {
    return { ...normalProps, ...reducedProps, ...v6ReducedMotion };
  }
  return normalProps;
};
