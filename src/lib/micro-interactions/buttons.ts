/**
 * Micro-interactions - Button Interactions
 * Button hover, tap, and variant animations
 */

import type { Variants, TargetAndTransition } from "framer-motion";
import { timing, easing } from "./timing";

export const buttonHover: TargetAndTransition = {
  scale: 1.02,
  transition: { duration: timing.fast, ease: easing.easeOut },
};

export const buttonTap: TargetAndTransition = {
  scale: 0.98,
  transition: { duration: timing.micro },
};

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: buttonHover,
  tap: buttonTap,
};

/**
 * Primary button variants with animated shadows.
 * Note: boxShadow values kept numeric for Framer Motion interpolation.
 * Token equivalents documented for reference.
 */
export const primaryButtonVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // ~--shadow-xs equivalent
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 4px 12px rgba(212, 160, 23, 0.3)", // ~--shadow-button-hover equivalent (gold-tinted)
    transition: { duration: timing.fast, ease: easing.easeOut },
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)", // ~--shadow-xs equivalent
    transition: { duration: timing.micro },
  },
};

// ============================================
// ICON BUTTON
// ============================================

export const iconButtonVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    transition: { duration: timing.fast },
  },
  tap: {
    scale: 0.9,
    transition: { duration: timing.micro },
  },
};

export const rotatingIconVariants: Variants = {
  initial: { rotate: 0 },
  active: {
    rotate: 180,
    transition: { duration: timing.standard, ease: easing.easeInOut },
  },
};
