/**
 * V7 Motion Token System - Card Variants
 * 3D flip card and expanding card animations
 */

import type { Variants } from "framer-motion";
import { spring, duration, transition } from "./core";

// ============================================
// V7 3D FLIP CARD VARIANTS
// (Accordion replacement)
// ============================================

export const flipCard = {
  /** Container (needs perspective: 1000px) */
  container: {
    style: { perspective: 1000 },
  },

  /** Front face */
  front: {
    initial: { rotateY: 0 },
    flipped: { rotateY: 180, transition: spring.default },
  } as Variants,

  /** Back face */
  back: {
    initial: { rotateY: -180 },
    flipped: { rotateY: 0, transition: spring.default },
  } as Variants,

  /** Face styles (apply to both front/back) */
  faceStyle: {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden" as const,
    transformStyle: "preserve-3d" as const,
  },
} as const;

// ============================================
// V7 EXPANDING CARD VARIANTS
// (FLIP animation replacement)
// ============================================

export const expandingCard = {
  /** Collapsed state */
  collapsed: {
    height: "auto",
  },

  /** Expanded state */
  expanded: {
    height: "auto",
    transition: {
      height: spring.gentle,
      opacity: { duration: duration.fast, delay: 0.05 },
    },
  },

  /** Content reveal */
  content: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.1, ...spring.gentle } },
    exit: { opacity: 0, y: -10, transition: transition.fast },
  } as Variants,
} as const;
