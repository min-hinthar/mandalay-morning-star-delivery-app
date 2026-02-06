/**
 * V7 Motion Token System - Scroll & Parallax
 * Scroll reveal animations, parallax utilities, and viewport config
 */

import { spring } from "./core";

// ============================================
// V7 SCROLL REVEAL
// ============================================

export const scrollReveal = {
  /** Fade up on scroll */
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0, transition: spring.gentle },
    viewport: { once: true, margin: "-80px" },
  },

  /** Scale in on scroll */
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    whileInView: { opacity: 1, scale: 1, transition: spring.default },
    viewport: { once: true, margin: "-50px" },
  },

  /** Slide from left */
  slideLeft: {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0, transition: spring.default },
    viewport: { once: true, margin: "-50px" },
  },

  /** Slide from right */
  slideRight: {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0, transition: spring.default },
    viewport: { once: true, margin: "-50px" },
  },
} as const;

// ============================================
// V7 PARALLAX UTILITIES
// ============================================

/**
 * Create parallax layer config
 * @param speed - Parallax speed (0-1, higher = more movement)
 */
export function parallaxLayer(speed: number) {
  return {
    style: {
      willChange: "transform" as const,
    },
    // Use with useScroll + useTransform from framer-motion
    speedFactor: speed,
  };
}

export const parallaxPresets = {
  /** Background layer (slowest) */
  background: { speedFactor: 0.1 },
  /** Far distance */
  far: { speedFactor: 0.25 },
  /** Mid distance */
  mid: { speedFactor: 0.4 },
  /** Near distance */
  near: { speedFactor: 0.6 },
  /** Foreground */
  foreground: { speedFactor: 0.8 },
  /** Main content (1:1) */
  content: { speedFactor: 1.0 },
} as const;

// ============================================
// V7 VIEWPORT CONFIG
// ============================================

/**
 * Standard viewport trigger amount for Phase 22+ (25% visible)
 */
export const VIEWPORT_AMOUNT = 0.25;

export const viewport = {
  /** Once only, standard margin */
  once: { once: true, margin: "-50px" as const },
  /** Once only, larger margin */
  onceLarge: { once: true, margin: "-100px" as const },
  /** Repeat on every view */
  repeat: { once: false, margin: "-50px" as const },
  /** Amount visible before trigger */
  half: { once: true, amount: 0.5 as const },
} as const;
