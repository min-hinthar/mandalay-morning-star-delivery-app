/**
 * V3 Sprint 5: Tab Switching Animations
 *
 * Direction-aware content transitions for tab navigation.
 * Supports swipe gestures and keyboard navigation.
 */

import type { Variants, PanInfo } from "framer-motion";
import { springPresets } from "./variants";

// ============================================
// DIRECTION-AWARE CONTENT TRANSITIONS
// ============================================

/**
 * Tab content variants with direction awareness
 * Pass direction as custom prop: positive = forward, negative = backward
 */
export const tabContent: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

/**
 * Simple fade transition (no direction)
 */
export const tabContentFade: Variants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================
// TAB INDICATOR ANIMATIONS
// ============================================

/**
 * Sliding underline indicator
 * Use with layoutId for shared layout animation
 */
export const tabIndicator = {
  layoutId: "tabIndicator",
  transition: springPresets.snappy,
};

/**
 * Tab indicator variants for AnimatePresence
 */
export const tabIndicatorVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: springPresets.snappy,
  },
};

// ============================================
// TAB BUTTON ANIMATIONS
// ============================================

/**
 * Tab button press animation
 */
export const tabButtonTap = {
  scale: 0.98,
};

/**
 * Tab button hover animation
 */
export const tabButtonHover = {
  y: -1,
};

/**
 * Tab text color transition
 */
export const tabTextVariants: Variants = {
  inactive: {
    color: "var(--color-charcoal-muted)",
    transition: { duration: 0.15 },
  },
  active: {
    color: "var(--color-text-primary)",
    transition: { duration: 0.15 },
  },
};

// ============================================
// SWIPE NAVIGATION UTILITIES
// ============================================

export interface SwipeNavigationOptions {
  /** Minimum distance to trigger navigation */
  threshold?: number;
  /** Minimum velocity to trigger navigation */
  velocityThreshold?: number;
  /** Whether at first item (prevent backward swipe) */
  isFirst?: boolean;
  /** Whether at last item (prevent forward swipe) */
  isLast?: boolean;
  /** Callback for next navigation */
  onNext?: () => void;
  /** Callback for previous navigation */
  onPrev?: () => void;
}

const DEFAULT_SWIPE_THRESHOLD = 50;
const DEFAULT_VELOCITY_THRESHOLD = 200;

/**
 * Handle swipe gesture for tab navigation
 */
export function handleSwipeNavigation(
  info: PanInfo,
  options: SwipeNavigationOptions
): void {
  const {
    threshold = DEFAULT_SWIPE_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    isFirst = false,
    isLast = false,
    onNext,
    onPrev,
  } = options;

  const { offset, velocity } = info;

  // Swipe left = next
  if (
    (offset.x < -threshold || velocity.x < -velocityThreshold) &&
    !isLast &&
    onNext
  ) {
    onNext();
    return;
  }

  // Swipe right = previous
  if (
    (offset.x > threshold || velocity.x > velocityThreshold) &&
    !isFirst &&
    onPrev
  ) {
    onPrev();
  }
}

/**
 * Get drag constraints based on position
 */
export function getSwipeConstraints(isFirst: boolean, isLast: boolean) {
  return {
    left: isLast ? 0 : -100,
    right: isFirst ? 0 : 100,
  };
}

/**
 * Get drag elastic based on position
 * More resistance at boundaries
 */
export function getSwipeElastic(isFirst: boolean, isLast: boolean) {
  return {
    left: isLast ? 0.1 : 0.5,
    right: isFirst ? 0.1 : 0.5,
  };
}

// ============================================
// TAB CONTAINER ANIMATIONS
// ============================================

/**
 * Tab container for horizontal scroll
 */
export const tabContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Individual tab item
 */
export const tabItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================
// EDGE FADE INDICATORS
// ============================================

/**
 * Fade indicator variants
 */
export const edgeFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
};

// ============================================
// KEYBOARD NAVIGATION HELPERS
// ============================================

export interface KeyboardNavigationOptions {
  currentIndex: number;
  totalTabs: number;
  onSelect: (index: number) => void;
}

/**
 * Handle keyboard navigation for tabs
 */
export function handleTabKeyNavigation(
  event: KeyboardEvent,
  options: KeyboardNavigationOptions
): void {
  const { currentIndex, totalTabs, onSelect } = options;

  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      event.preventDefault();
      onSelect((currentIndex + 1) % totalTabs);
      break;
    case "ArrowLeft":
    case "ArrowUp":
      event.preventDefault();
      onSelect((currentIndex - 1 + totalTabs) % totalTabs);
      break;
    case "Home":
      event.preventDefault();
      onSelect(0);
      break;
    case "End":
      event.preventDefault();
      onSelect(totalTabs - 1);
      break;
  }
}

// ============================================
// REDUCED MOTION HELPERS
// ============================================

/**
 * Get tab content props respecting reduced motion
 */
export function getTabContentProps(
  prefersReducedMotion: boolean | null,
  direction: number
) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    };
  }

  return {
    custom: direction,
    variants: tabContent,
    initial: "enter",
    animate: "center",
    exit: "exit",
  };
}
