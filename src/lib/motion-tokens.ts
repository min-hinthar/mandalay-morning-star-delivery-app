/**
 * V7 Motion Token System
 * Maximum playfulness, 120fps target, ultra-smooth animations
 *
 * Philosophy:
 * - Every element should feel alive
 * - Springs over easings for natural motion
 * - Faster durations for 120fps smoothness
 * - Bounce and overshoot encouraged
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
 *
 * Note: FM durations are intentionally faster than CSS tokens for
 * the playful, snappy feel of the v7 design language. Spring physics
 * with proper stiffness/damping provides natural deceleration.
 *
 * For CSS-only animations, use the tokens.css variables directly.
 *
 * @example
 * import { spring, variants, hover } from '@/lib/motion-tokens-v7';
 * <motion.div {...hover.lift} variants={variants.popIn} />
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion";

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

// ============================================
// V7 ANIMATION VARIANTS
// ============================================

export const variants = {
  /** Fade in */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.normal },
    exit: { opacity: 0, transition: transition.fast },
  } as Variants,

  /** Slide up with fade */
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, y: -12, transition: transition.fast },
  } as Variants,

  /** Slide down with fade */
  slideDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, y: 12, transition: transition.fast },
  } as Variants,

  /** Slide in from right */
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: spring.default },
    exit: { opacity: 0, x: -20, transition: transition.fast },
  } as Variants,

  /** Slide in from left */
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: spring.default },
    exit: { opacity: 0, x: 20, transition: transition.fast },
  } as Variants,

  /** Scale in with spring */
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: spring.default },
    exit: { opacity: 0, scale: 0.9, transition: transition.fast },
  } as Variants,

  /** Pop in with bounce */
  popIn: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1, transition: spring.ultraBouncy },
    exit: { opacity: 0, scale: 0.7, transition: transition.fast },
  } as Variants,

  /** Bounce in from below */
  bounceUp: {
    initial: { opacity: 0, y: 60, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring.rubbery },
    exit: { opacity: 0, y: -30, transition: transition.fast },
  } as Variants,

  /** Rotate in with scale */
  rotateIn: {
    initial: { opacity: 0, scale: 0.8, rotate: -8 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: spring.default },
    exit: { opacity: 0, scale: 0.8, rotate: 8, transition: transition.fast },
  } as Variants,

  /** Wobble entrance */
  wobbleIn: {
    initial: { opacity: 0, scale: 0.9, rotate: -3 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: spring.wobbly },
    exit: { opacity: 0, scale: 0.9, transition: transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 HOVER EFFECTS
// ============================================

export const hover = {
  /** Lift up with shadow */
  lift: {
    whileHover: { y: -6, scale: 1.02 },
    whileTap: { scale: 0.97, y: 0 },
    transition: spring.snappy,
  },

  /** Scale up */
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: spring.snappy,
  },

  /** Gentle scale */
  scaleGentle: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: spring.gentle,
  },

  /** Tilt effect */
  tilt: {
    whileHover: { rotate: 2, scale: 1.02 },
    whileTap: { rotate: -1, scale: 0.98 },
    transition: spring.snappy,
  },

  /** Bounce on hover */
  bounce: {
    whileHover: { y: -8, scale: 1.03 },
    whileTap: { y: 0, scale: 0.95 },
    transition: spring.ultraBouncy,
  },

  /** Glow effect (use with CSS shadow) */
  glow: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: spring.gentle,
  },

  /** Image zoom */
  imageZoom: {
    whileHover: { scale: 1.08 },
    transition: { duration: duration.slow, ease: easing.out },
  },

  /** Button press - depth effect with shadow reduction */
  buttonPress: {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: {
      scale: 0.97,
      y: 1,
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)", // ~--shadow-xs equivalent, kept numeric for FM interpolation
    },
    transition: spring.snappyButton,
  },
} as const;

// ============================================
// V7 INPUT FOCUS ANIMATIONS
// ============================================

/**
 * Input focus states using CSS variable shadow tokens.
 * These are discrete state changes (not animated between values),
 * so CSS variables work properly for theme-awareness.
 */
export const inputFocus = {
  /** Initial state - no glow */
  initial: { boxShadow: "var(--shadow-none)" },
  /** Default focus - primary glow */
  focus: { boxShadow: "var(--shadow-focus)" },
  /** Error focus - red glow */
  error: { boxShadow: "var(--shadow-focus-error)" },
  /** Success focus - green glow */
  success: { boxShadow: "var(--shadow-focus-success)" },
} as const;

// ============================================
// V7 TAP EFFECTS
// ============================================

export const tap = {
  /** Button tap */
  button: {
    scale: 0.96,
    transition: { duration: duration.micro },
  } as TargetAndTransition,

  /** Icon tap */
  icon: {
    scale: 0.85,
    transition: { duration: duration.micro },
  } as TargetAndTransition,

  /** Card tap */
  card: {
    scale: 0.98,
    transition: spring.snappy,
  } as TargetAndTransition,

  /** Bouncy tap */
  bouncy: {
    scale: 0.9,
    transition: spring.rubbery,
  } as TargetAndTransition,
} as const;

// ============================================
// V7 OVERLAY VARIANTS
// ============================================

export const overlay = {
  /** Backdrop with blur (use with CSS backdrop-filter) */
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.normal },
    exit: { opacity: 0, transition: transition.fast },
  } as Variants,

  /** Modal scale + blur in */
  modal: {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: spring.default },
    exit: { opacity: 0, scale: 0.92, y: 20, transition: transition.fast },
  } as Variants,

  /** Glassmorphism modal */
  glass: {
    initial: { opacity: 0, scale: 0.95, backdropFilter: "blur(0px)" },
    animate: {
      opacity: 1,
      scale: 1,
      backdropFilter: "blur(20px)",
      transition: spring.gentle,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      backdropFilter: "blur(0px)",
      transition: transition.fast,
    },
  } as Variants,

  /** Drawer from right */
  drawer: {
    initial: { x: "100%" },
    animate: { x: 0, transition: spring.default },
    exit: { x: "100%", transition: transition.normal },
  } as Variants,

  /** Bottom sheet */
  bottomSheet: {
    initial: { y: "100%" },
    animate: { y: 0, transition: spring.default },
    exit: { y: "100%", transition: transition.normal },
  } as Variants,

  /** Toast slide in */
  toast: {
    initial: { opacity: 0, x: 100, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1, transition: spring.default },
    exit: { opacity: 0, x: 100, scale: 0.9, transition: transition.fast },
  } as Variants,
} as const;

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

// ============================================
// V7 STAGGER UTILITIES
// ============================================

/**
 * Standard stagger gap for Phase 22+ (80ms between items)
 */
export const STAGGER_GAP = 0.08;

/**
 * Standard viewport trigger amount for Phase 22+ (25% visible)
 */
export const VIEWPORT_AMOUNT = 0.25;

/**
 * Maximum stagger delay cap (500ms) - items beyond index 6 get same delay
 * Prevents excessively long stagger animations on large lists
 */
export const MAX_STAGGER_DELAY = 0.5;

/**
 * Create staggered container variants
 */
export function staggerContainer(
  staggerDelay = 0.06,
  delayChildren = 0.08
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Create Phase 22 standard stagger container (80ms gap, capped at 500ms)
 * Use for menu items, order history, and other scrolling lists
 */
export function staggerContainer80(
  delayChildren = 0.08
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_GAP,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: STAGGER_GAP / 2,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Stagger item variants
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring.default },
  exit: { opacity: 0, y: -8, transition: transition.fast },
};

/**
 * Stagger item with rotation
 */
export const staggerItemRotate: Variants = {
  hidden: { opacity: 0, y: 16, rotate: -3 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: spring.default },
  exit: { opacity: 0, y: -8, rotate: 3, transition: transition.fast },
};

/**
 * Calculate stagger delay with cap
 * Items beyond index 6 get same delay (500ms max) per RESEARCH pitfall
 */
export function staggerDelay(
  index: number,
  baseDelay = STAGGER_GAP,
  maxDelay = MAX_STAGGER_DELAY
): number {
  return Math.min(index * baseDelay, maxDelay);
}

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
// V7 CELEBRATION ANIMATIONS
// ============================================

export const celebration = {
  /** Success checkmark */
  success: {
    initial: { scale: 0, rotate: -45 },
    animate: { scale: 1, rotate: 0, transition: spring.ultraBouncy },
  } as Variants,

  /** Confetti particle (use with stagger) */
  confettiParticle: (index: number) => ({
    initial: { y: 0, x: 0, scale: 0, rotate: 0 },
    animate: {
      y: -100 - Math.random() * 100,
      x: (Math.random() - 0.5) * 200,
      scale: [0, 1, 1, 0],
      rotate: Math.random() * 720 - 360,
      transition: {
        duration: 1 + Math.random() * 0.5,
        ease: easing.out,
        delay: index * 0.02,
      },
    },
  }),

  /** Badge earned */
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0, transition: spring.dramatic },
  } as Variants,

  /** Counter increment */
  counter: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.3, 1],
      transition: { duration: duration.normal, ease: easing.elastic },
    },
  } as Variants,

  /** Star rating fill */
  starFill: (index: number) => ({
    initial: { scale: 0, rotate: -30 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: { ...spring.ultraBouncy, delay: index * 0.1 },
    },
  }),
} as const;

// ============================================
// V7 FLOATING ANIMATIONS
// (For hero elements, decoratives)
// ============================================

/**
 * Float animation with BOUNDED repeat count to prevent mobile crashes.
 * Use sparingly on hero sections only.
 */
export function float(index: number) {
  return {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 3, 0],
      scale: [1, 1.02, 1],
    },
    transition: {
      duration: 5 + index * 0.7,
      repeat: 3, // Bounded to prevent mobile memory issues
      ease: "easeInOut" as const,
      delay: index * 0.4,
    },
  };
}

/**
 * Gentle float animation with BOUNDED repeat count to prevent mobile crashes.
 * Use sparingly on hero sections only.
 */
export function floatGentle(index: number) {
  return {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 1.5, 0],
    },
    transition: {
      duration: 6 + index * 0.5,
      repeat: 3, // Bounded to prevent mobile memory issues
      ease: "easeInOut" as const,
      delay: index * 0.3,
    },
  };
}

// ============================================
// V7 MORPHING ANIMATIONS
// (For hamburger menu, icons)
// ============================================

export const morph = {
  /** Hamburger to X morphing */
  hamburgerTop: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 8, transition: spring.snappy },
  } as Variants,

  hamburgerMiddle: {
    closed: { opacity: 1, scaleX: 1 },
    open: { opacity: 0, scaleX: 0, transition: transition.fast },
  } as Variants,

  hamburgerBottom: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -8, transition: spring.snappy },
  } as Variants,
} as const;

// ============================================
// V7 PRICE TICKER
// ============================================

export const priceTicker = {
  /** Digit change */
  digit: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1, transition: spring.snappy },
    exit: { y: "-100%", opacity: 0, transition: transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 ROUTE DRAWING
// (For map polylines)
// ============================================

export const routeDraw = {
  /** Path drawing animation */
  path: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: easing.out },
        opacity: { duration: 0.3 },
      },
    },
  } as Variants,

  /** Marker pulse - bounded repeat to prevent mobile crashes */
  markerPulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: 5, // Bounded to prevent mobile memory issues
        ease: "easeInOut",
      },
    },
  },
} as const;

// ============================================
// V7 VIEWPORT CONFIG
// ============================================

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

// ============================================
// CART ANIMATIONS (from @/lib/animations/cart)
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
    transition: spring.default,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
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
    transition: spring.ultraBouncy,
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
