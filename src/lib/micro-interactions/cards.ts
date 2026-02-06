/**
 * Micro-interactions - Card Interactions
 * Card hover, tap, and variant animations
 */

import type { Variants, TargetAndTransition } from "framer-motion";
import { timing, easing } from "./timing";

export const cardHover: TargetAndTransition = {
  scale: 1.01,
  y: -2,
  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", // ~--shadow-lg equivalent, kept numeric for FM interpolation
  transition: { duration: timing.fast, ease: easing.easeOut },
};

export const cardTap: TargetAndTransition = {
  scale: 0.99,
  y: 0,
  transition: { duration: timing.micro },
};

/**
 * Card variants with animated shadows.
 * Note: boxShadow values kept numeric for Framer Motion interpolation.
 */
export const cardVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)", // ~--shadow-sm equivalent
  },
  hover: cardHover,
  tap: cardTap,
};
