/**
 * V7 Motion Token System - Core Tokens
 * Duration, easing, spring, and transition presets
 *
 * DESIGN SYSTEM INTEGRATION:
 * Framer Motion requires NUMERIC durations for spring physics interpolation.
 * CSS variables (var(--duration-*)) cannot be used directly in FM transitions.
 *
 * Token Mapping (FM numeric -> CSS variable equivalent):
 * - micro (0.08s = 80ms)    -> ~instant (0ms) / fast (150ms)
 * - fast (0.12s = 120ms)    -> duration-fast (150ms)
 * - normal (0.18s = 180ms)  -> ~duration-normal (220ms)
 * - slow (0.28s = 280ms)    -> ~duration-slow (350ms)
 * - dramatic (0.4s = 400ms) -> ~duration-slower (500ms)
 * - epic (0.6s = 600ms)     -> beyond tokens (custom)
 */

import type { Transition } from "framer-motion";

// ============================================
// V7 DURATION TOKENS (Faster for 120fps)
// ============================================

export const duration = {
  /** Micro-interactions: toggles, taps. CSS equivalent: var(--duration-instant) at 0ms, this is ~80ms */
  micro: 0.08,
  /** Fast interactions: buttons, links. CSS equivalent: var(--duration-fast) at 150ms, this is ~120ms */
  fast: 0.12,
  /** Normal transitions: most animations. CSS equivalent: var(--duration-normal) at 220ms, this is ~180ms */
  normal: 0.18,
  /** Slow transitions: emphasis, reveals. CSS equivalent: var(--duration-slow) at 350ms, this is ~280ms */
  slow: 0.28,
  /** Dramatic moments: celebrations, hero. CSS equivalent: var(--duration-slower) at 500ms, this is ~400ms */
  dramatic: 0.4,
  /** Extra slow: special effects. CSS equivalent: beyond standard tokens (~600ms) */
  epic: 0.6,
} as const;

// ============================================
// V7 EASING TOKENS (More dramatic curves)
// ============================================

export const easing = {
  /** Default ease - smooth deceleration */
  default: [0.2, 0.9, 0.3, 1] as const,
  /** Ease out - dramatic deceleration */
  out: [0, 0.7, 0.2, 1] as const,
  /** Ease in - building momentum */
  in: [0.7, 0, 0.9, 0.3] as const,
  /** Ease in-out - smooth both ends */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Overshoot - bouncy ending */
  overshoot: [0.34, 1.56, 0.64, 1] as const,
  /** Elastic - rubbery feel */
  elastic: [0.68, -0.55, 0.27, 1.55] as const,
} as const;

// ============================================
// V7 SPRING PRESETS (More playful)
// ============================================

export const spring = {
  /** Default - balanced playfulness */
  default: {
    type: "spring" as const,
    stiffness: 300,
    damping: 22,
    mass: 0.8,
  },
  /** Ultra bouncy - maximum playfulness */
  ultraBouncy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 12,
    mass: 0.8,
  },
  /** Rubbery - stretchy feel */
  rubbery: {
    type: "spring" as const,
    stiffness: 350,
    damping: 8,
    mass: 1,
  },
  /** Snappy - quick response */
  snappy: {
    type: "spring" as const,
    stiffness: 600,
    damping: 35,
    mass: 1,
  },
  /** Floaty - dreamy, slow motion */
  floaty: {
    type: "spring" as const,
    stiffness: 100,
    damping: 10,
    mass: 2,
  },
  /** Wobbly - pronounced wobble */
  wobbly: {
    type: "spring" as const,
    stiffness: 250,
    damping: 6,
    mass: 1,
  },
  /** Gentle - no overshoot */
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  /** Dramatic - big movements */
  dramatic: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 1.2,
  },
  /** Snappy button - quick press feedback */
  snappyButton: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  },
  /** Bouncy toggle - playful toggle bounces */
  bouncyToggle: {
    type: "spring" as const,
    stiffness: 400,
    damping: 12,
    mass: 0.9,
  },
  /** Smooth - balanced modals, drawers */
  smooth: {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
    mass: 1,
  },
} as const;

// ============================================
// V7 TRANSITION PRESETS
// ============================================

export const transition = {
  /** Instant - no animation */
  instant: { duration: 0 } as Transition,

  /** Micro - tiny interactions */
  micro: {
    duration: duration.micro,
    ease: easing.default,
  } as Transition,

  /** Fast - quick feedback */
  fast: {
    duration: duration.fast,
    ease: easing.default,
  } as Transition,

  /** Normal - standard transitions */
  normal: {
    duration: duration.normal,
    ease: easing.default,
  } as Transition,

  /** Slow - dramatic reveals */
  slow: {
    duration: duration.slow,
    ease: easing.out,
  } as Transition,

  /** Spring default */
  spring: spring.default,

  /** Spring bouncy */
  springBouncy: spring.ultraBouncy,

  /** Spring snappy */
  springSnappy: spring.snappy,
} as const;
