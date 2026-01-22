/**
 * GSAP Animation Presets
 * Consistent with motion-tokens.ts feel but optimized for GSAP timelines
 *
 * @example
 * gsap.to(el, { ...gsapPresets.fadeIn });
 * gsap.to(el, { duration: gsapDuration.fast, ease: gsapEase.snappy });
 */
"use client";

// ============================================
// DURATION TOKENS (match motion-tokens.ts)
// ============================================

export const gsapDuration = {
  /** Micro-interactions: toggles, taps */
  micro: 0.08,
  /** Fast interactions: buttons, links */
  fast: 0.12,
  /** Normal transitions: most animations */
  normal: 0.18,
  /** Slow transitions: emphasis, reveals */
  slow: 0.28,
  /** Dramatic moments: celebrations, hero */
  dramatic: 0.4,
  /** Extra slow: special effects */
  epic: 0.6,
} as const;

// ============================================
// EASING TOKENS (GSAP equivalents of motion-tokens)
// ============================================

export const gsapEase = {
  /** Default - smooth deceleration (matches motion-tokens default) */
  default: "power2.out",
  /** Out - dramatic deceleration */
  out: "power3.out",
  /** In - building momentum */
  in: "power2.in",
  /** In-out - smooth both ends */
  inOut: "power2.inOut",
  /** Snappy - quick response (matches spring.snappy feel) */
  snappy: "power2.out",
  /** Bouncy - overshoot ending (matches spring.ultraBouncy feel) */
  bouncy: "back.out(1.7)",
  /** Rubbery - elastic feel (matches spring.rubbery) */
  rubbery: "elastic.out(1, 0.5)",
  /** Gentle - no overshoot (matches spring.gentle) */
  gentle: "power1.out",
  /** Wobbly - pronounced wobble (matches spring.wobbly) */
  wobbly: "elastic.out(1, 0.3)",
  /** Dramatic - big movements */
  dramatic: "back.out(2)",
} as const;

// ============================================
// ANIMATION PRESETS (common patterns)
// ============================================

export const gsapPresets = {
  /** Fade in */
  fadeIn: {
    opacity: 0,
    duration: gsapDuration.normal,
    ease: gsapEase.default,
  },

  /** Slide up with fade */
  slideUp: {
    y: 24,
    opacity: 0,
    duration: gsapDuration.normal,
    ease: gsapEase.default,
  },

  /** Slide down with fade */
  slideDown: {
    y: -24,
    opacity: 0,
    duration: gsapDuration.normal,
    ease: gsapEase.default,
  },

  /** Scale in */
  scaleIn: {
    scale: 0.9,
    opacity: 0,
    duration: gsapDuration.normal,
    ease: gsapEase.default,
  },

  /** Pop in with bounce */
  popIn: {
    scale: 0.7,
    opacity: 0,
    duration: gsapDuration.slow,
    ease: gsapEase.bouncy,
  },

  /** Text reveal (for use with SplitText) */
  textReveal: {
    y: 40,
    opacity: 0,
    duration: gsapDuration.slow,
    ease: gsapEase.default,
    stagger: 0.02,
  },

  /** Stagger defaults */
  stagger: {
    fast: 0.03,
    normal: 0.06,
    slow: 0.1,
  },
} as const;

// ============================================
// SCROLL TRIGGER PRESETS
// ============================================

export const scrollTriggerPresets = {
  /** Standard fade up on scroll */
  fadeUp: {
    trigger: undefined as unknown, // Set per-use
    start: "top 80%",
    toggleActions: "play none none reverse",
  },

  /** Scrub animation (follows scroll) */
  scrub: {
    trigger: undefined as unknown,
    start: "top bottom",
    end: "bottom top",
    scrub: 1,
  },

  /** Pin element during scroll */
  pin: {
    trigger: undefined as unknown,
    start: "top top",
    end: "+=500",
    pin: true,
    scrub: 1,
  },
} as const;

// ============================================
// TIMELINE FACTORY HELPERS
// ============================================

/**
 * Create stagger delay for index
 */
export function staggerDelay(
  index: number,
  baseDelay = 0.06,
  maxDelay = 0.5
): number {
  return Math.min(index * baseDelay, maxDelay);
}

/**
 * Common timeline labels
 */
export const timelineLabels = {
  start: "start",
  middle: "middle",
  end: "end",
  overlap: "-=0.3", // Overlap previous animation by 0.3s
  after: "+=0.1", // Start 0.1s after previous
} as const;
