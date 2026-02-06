/**
 * Micro-interactions - Timing & Easing Constants
 * Foundation constants for all micro-interactions
 */

// ============================================
// TIMING CONSTANTS
// ============================================

export const timing = {
  micro: 0.1,
  fast: 0.15,
  standard: 0.2,
  slow: 0.3,
  dramatic: 0.5,
} as const;

// ============================================
// EASING FUNCTIONS
// ============================================

export const easing = {
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
  springBouncy: { type: "spring" as const, stiffness: 500, damping: 15 },
} as const;
