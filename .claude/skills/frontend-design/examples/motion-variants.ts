/**
 * Framer Motion Variants - Reusable Animation Patterns
 */

import type { Variants, Transition } from "framer-motion";

// =============================================================================
// Spring Configurations
// =============================================================================

export const springs = {
  snappy: { type: "spring", stiffness: 400, damping: 30 } as const,
  bouncy: { type: "spring", stiffness: 300, damping: 10 } as const,
  gentle: { type: "spring", stiffness: 100, damping: 15 } as const,
  heavy: { type: "spring", stiffness: 200, damping: 25, mass: 2 } as const,
} satisfies Record<string, Transition>;

// =============================================================================
// Duration Presets
// =============================================================================

export const durations = {
  instant: 0.05,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
} as const;

// =============================================================================
// Easing Presets
// =============================================================================

export const easings = {
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
};

// =============================================================================
// Fade Variants
// =============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

// =============================================================================
// Slide Variants
// =============================================================================

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

// =============================================================================
// Scale Variants
// =============================================================================

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: durations.fast },
  },
};

// =============================================================================
// Modal Variants
// =============================================================================

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: durations.fast },
  },
};

// =============================================================================
// Drawer Variants (Responsive)
// =============================================================================

export const drawerVariants = {
  mobile: {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: springs.snappy,
    },
    exit: {
      y: "100%",
      transition: { duration: durations.normal },
    },
  } satisfies Variants,

  desktop: {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: springs.snappy,
    },
    exit: {
      x: "100%",
      transition: { duration: durations.normal },
    },
  } satisfies Variants,
};

// =============================================================================
// Stagger Container
// =============================================================================

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
};

// =============================================================================
// Feedback Variants
// =============================================================================

export const successCheckVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
};

export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
};

// =============================================================================
// Hover Interactions
// =============================================================================

export const hoverScaleVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export const hoverLiftVariants: Variants = {
  initial: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  tap: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
};

// =============================================================================
// Reduced Motion Variants
// =============================================================================

export function getReducedMotionVariants(
  fullVariants: Variants,
  shouldReduce: boolean
): Variants {
  if (!shouldReduce) return fullVariants;

  // Return simplified variants that only fade
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0 } },
  };
}

// =============================================================================
// Usage Example
// =============================================================================

/*
import { motion, useReducedMotion } from "framer-motion";
import { slideUpVariants, getReducedMotionVariants } from "./motion-variants";

function AnimatedCard() {
  const shouldReduce = useReducedMotion();
  const variants = getReducedMotionVariants(slideUpVariants, shouldReduce ?? false);

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      Card content
    </motion.div>
  );
}
*/
