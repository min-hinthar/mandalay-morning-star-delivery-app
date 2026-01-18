/**
 * V3 Sprint 5: Cart Interaction Animations
 *
 * Framer Motion variants and utilities for cart micro-interactions:
 * - Add to cart button success
 * - Cart bar bounce
 * - Badge pop animation
 * - Item fly-to-cart (coordinates helper)
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion";
import { springPresets } from "./variants";

// ============================================
// ADD TO CART BUTTON ANIMATIONS
// ============================================

/**
 * Button success animation after adding to cart
 * Scale pulse + color flash to jade
 */
export const addToCartSuccess: TargetAndTransition = {
  scale: [1, 1.1, 1],
  backgroundColor: ["var(--color-cta)", "var(--color-jade)", "var(--color-cta)"],
  transition: {
    duration: 0.4,
    times: [0, 0.5, 1],
    ease: "easeOut",
  },
};

/**
 * Button loading state (brief spinner)
 */
export const addToCartLoading: TargetAndTransition = {
  scale: 0.98,
  opacity: 0.8,
};

/**
 * Combined button animation variants
 */
export const addToCartButton: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
  },
  loading: {
    scale: 0.98,
    opacity: 0.8,
    transition: { duration: 0.1 },
  },
  success: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.5, 1],
    },
  },
};

// ============================================
// CART BAR ANIMATIONS
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
    transition: springPresets.smooth,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================
// BADGE ANIMATIONS
// ============================================

/**
 * Badge pop animation when count changes
 */
export const badgePop: TargetAndTransition = {
  scale: [1, 1.3, 1],
  transition: {
    duration: 0.25,
    times: [0, 0.5, 1],
    ease: "easeOut",
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
    transition: springPresets.bouncy,
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

// ============================================
// CART ITEM ANIMATIONS
// ============================================

/**
 * Cart item enter animation
 */
export const cartItemEnter: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy,
  },
};

/**
 * Cart item exit animation (slide out left)
 */
export const cartItemExit: Variants = {
  exit: {
    opacity: 0,
    x: -100,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.2,
      height: { delay: 0.1 },
      marginBottom: { delay: 0.1 },
    },
  },
};

/**
 * Combined cart item variants
 */
export const cartItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy,
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 },
  },
};

// ============================================
// QUANTITY ANIMATIONS
// ============================================

/**
 * Quantity number flip animation
 */
export const quantityFlip: Variants = {
  initial: (direction: number) => ({
    y: direction > 0 ? -20 : 20,
    opacity: 0,
  }),
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    y: direction > 0 ? 20 : -20,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  }),
};

/**
 * Price counter animation
 */
export const priceCounter: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

// ============================================
// CART DRAWER ANIMATIONS
// ============================================

/**
 * Cart drawer expand (mobile: from bottom, desktop: from right)
 */
export const cartDrawerExpand = {
  mobile: {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: springPresets.smooth,
    },
    exit: {
      y: "100%",
      transition: { duration: 0.2 },
    },
  } as Variants,
  desktop: {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: springPresets.smooth,
    },
    exit: {
      x: "100%",
      transition: { duration: 0.2 },
    },
  } as Variants,
};

/**
 * Cart drawer backdrop
 */
export const cartDrawerBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================
// FLY TO CART UTILITIES
// ============================================

/**
 * Calculate the animation path from source to cart
 * Returns coordinates for a curved arc animation
 */
export function calculateFlyToCartPath(
  sourceRect: DOMRect,
  targetRect: DOMRect
): { x: number[]; y: number[] } {
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // Calculate arc control point (above the midpoint)
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 100; // Arc height

  return {
    x: [startX, midX, endX],
    y: [startY, midY, endY],
  };
}

/**
 * Fly to cart animation variant
 * Use with custom values from calculateFlyToCartPath
 */
export const flyToCart: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: (custom: { x: number[]; y: number[] }) => ({
    x: custom.x,
    y: custom.y,
    scale: [1, 0.8, 0.3],
    opacity: [1, 1, 0],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
      ease: "easeIn",
    },
  }),
};

// ============================================
// REDUCED MOTION HELPERS
// ============================================

/**
 * Get cart animation props respecting reduced motion preference
 */
export function getCartAnimationProps(
  prefersReducedMotion: boolean | null,
  variants: Variants
) {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: "visible",
      exit: false,
    };
  }

  return {
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    variants,
  };
}

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(durations[type]);
  }
}
