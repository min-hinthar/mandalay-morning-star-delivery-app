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
 * @example
 * import { v7Spring, v7Variants, v7Hover } from '@/lib/motion-tokens-v7';
 * <motion.div {...v7Hover.lift} variants={v7Variants.popIn} />
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion";

// ============================================
// V7 DURATION TOKENS (Faster for 120fps)
// ============================================

export const v7Duration = {
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
// V7 EASING TOKENS (More dramatic curves)
// ============================================

export const v7Easing = {
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

export const v7Spring = {
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
} as const;

// ============================================
// V7 TRANSITION PRESETS
// ============================================

export const v7Transition = {
  /** Instant - no animation */
  instant: { duration: 0 } as Transition,

  /** Micro - tiny interactions */
  micro: {
    duration: v7Duration.micro,
    ease: v7Easing.default,
  } as Transition,

  /** Fast - quick feedback */
  fast: {
    duration: v7Duration.fast,
    ease: v7Easing.default,
  } as Transition,

  /** Normal - standard transitions */
  normal: {
    duration: v7Duration.normal,
    ease: v7Easing.default,
  } as Transition,

  /** Slow - dramatic reveals */
  slow: {
    duration: v7Duration.slow,
    ease: v7Easing.out,
  } as Transition,

  /** Spring default */
  spring: v7Spring.default,

  /** Spring bouncy */
  springBouncy: v7Spring.ultraBouncy,

  /** Spring snappy */
  springSnappy: v7Spring.snappy,
} as const;

// ============================================
// V7 ANIMATION VARIANTS
// ============================================

export const v7Variants = {
  /** Fade in */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: v7Transition.normal },
    exit: { opacity: 0, transition: v7Transition.fast },
  } as Variants,

  /** Slide up with fade */
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: v7Spring.default },
    exit: { opacity: 0, y: -12, transition: v7Transition.fast },
  } as Variants,

  /** Slide down with fade */
  slideDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0, transition: v7Spring.default },
    exit: { opacity: 0, y: 12, transition: v7Transition.fast },
  } as Variants,

  /** Slide in from right */
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: v7Spring.default },
    exit: { opacity: 0, x: -20, transition: v7Transition.fast },
  } as Variants,

  /** Slide in from left */
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: v7Spring.default },
    exit: { opacity: 0, x: 20, transition: v7Transition.fast },
  } as Variants,

  /** Scale in with spring */
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: v7Spring.default },
    exit: { opacity: 0, scale: 0.9, transition: v7Transition.fast },
  } as Variants,

  /** Pop in with bounce */
  popIn: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1, transition: v7Spring.ultraBouncy },
    exit: { opacity: 0, scale: 0.7, transition: v7Transition.fast },
  } as Variants,

  /** Bounce in from below */
  bounceUp: {
    initial: { opacity: 0, y: 60, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1, transition: v7Spring.rubbery },
    exit: { opacity: 0, y: -30, transition: v7Transition.fast },
  } as Variants,

  /** Rotate in with scale */
  rotateIn: {
    initial: { opacity: 0, scale: 0.8, rotate: -8 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: v7Spring.default },
    exit: { opacity: 0, scale: 0.8, rotate: 8, transition: v7Transition.fast },
  } as Variants,

  /** Wobble entrance */
  wobbleIn: {
    initial: { opacity: 0, scale: 0.9, rotate: -3 },
    animate: { opacity: 1, scale: 1, rotate: 0, transition: v7Spring.wobbly },
    exit: { opacity: 0, scale: 0.9, transition: v7Transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 HOVER EFFECTS
// ============================================

export const v7Hover = {
  /** Lift up with shadow */
  lift: {
    whileHover: { y: -6, scale: 1.02 },
    whileTap: { scale: 0.97, y: 0 },
    transition: v7Spring.snappy,
  },

  /** Scale up */
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: v7Spring.snappy,
  },

  /** Gentle scale */
  scaleGentle: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: v7Spring.gentle,
  },

  /** Tilt effect */
  tilt: {
    whileHover: { rotate: 2, scale: 1.02 },
    whileTap: { rotate: -1, scale: 0.98 },
    transition: v7Spring.snappy,
  },

  /** Bounce on hover */
  bounce: {
    whileHover: { y: -8, scale: 1.03 },
    whileTap: { y: 0, scale: 0.95 },
    transition: v7Spring.ultraBouncy,
  },

  /** Glow effect (use with CSS shadow) */
  glow: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: v7Spring.gentle,
  },

  /** Image zoom */
  imageZoom: {
    whileHover: { scale: 1.08 },
    transition: { duration: v7Duration.slow, ease: v7Easing.out },
  },
} as const;

// ============================================
// V7 TAP EFFECTS
// ============================================

export const v7Tap = {
  /** Button tap */
  button: {
    scale: 0.96,
    transition: { duration: v7Duration.micro },
  } as TargetAndTransition,

  /** Icon tap */
  icon: {
    scale: 0.85,
    transition: { duration: v7Duration.micro },
  } as TargetAndTransition,

  /** Card tap */
  card: {
    scale: 0.98,
    transition: v7Spring.snappy,
  } as TargetAndTransition,

  /** Bouncy tap */
  bouncy: {
    scale: 0.9,
    transition: v7Spring.rubbery,
  } as TargetAndTransition,
} as const;

// ============================================
// V7 OVERLAY VARIANTS
// ============================================

export const v7Overlay = {
  /** Backdrop with blur (use with CSS backdrop-filter) */
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: v7Transition.normal },
    exit: { opacity: 0, transition: v7Transition.fast },
  } as Variants,

  /** Modal scale + blur in */
  modal: {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: v7Spring.default },
    exit: { opacity: 0, scale: 0.92, y: 20, transition: v7Transition.fast },
  } as Variants,

  /** Glassmorphism modal */
  glass: {
    initial: { opacity: 0, scale: 0.95, backdropFilter: "blur(0px)" },
    animate: {
      opacity: 1,
      scale: 1,
      backdropFilter: "blur(20px)",
      transition: v7Spring.gentle,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      backdropFilter: "blur(0px)",
      transition: v7Transition.fast,
    },
  } as Variants,

  /** Drawer from right */
  drawer: {
    initial: { x: "100%" },
    animate: { x: 0, transition: v7Spring.default },
    exit: { x: "100%", transition: v7Transition.normal },
  } as Variants,

  /** Bottom sheet */
  bottomSheet: {
    initial: { y: "100%" },
    animate: { y: 0, transition: v7Spring.default },
    exit: { y: "100%", transition: v7Transition.normal },
  } as Variants,

  /** Toast slide in */
  toast: {
    initial: { opacity: 0, x: 100, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1, transition: v7Spring.default },
    exit: { opacity: 0, x: 100, scale: 0.9, transition: v7Transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 3D FLIP CARD VARIANTS
// (Accordion replacement)
// ============================================

export const v7FlipCard = {
  /** Container (needs perspective: 1000px) */
  container: {
    style: { perspective: 1000 },
  },

  /** Front face */
  front: {
    initial: { rotateY: 0 },
    flipped: { rotateY: 180, transition: v7Spring.default },
  } as Variants,

  /** Back face */
  back: {
    initial: { rotateY: -180 },
    flipped: { rotateY: 0, transition: v7Spring.default },
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

export const v7ExpandingCard = {
  /** Collapsed state */
  collapsed: {
    height: "auto",
  },

  /** Expanded state */
  expanded: {
    height: "auto",
    transition: {
      height: v7Spring.gentle,
      opacity: { duration: v7Duration.fast, delay: 0.05 },
    },
  },

  /** Content reveal */
  content: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.1, ...v7Spring.gentle } },
    exit: { opacity: 0, y: -10, transition: v7Transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 STAGGER UTILITIES
// ============================================

/**
 * Create staggered container variants
 */
export function v7StaggerContainer(
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
 * Stagger item variants
 */
export const v7StaggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: v7Spring.default },
  exit: { opacity: 0, y: -8, transition: v7Transition.fast },
};

/**
 * Stagger item with rotation
 */
export const v7StaggerItemRotate: Variants = {
  hidden: { opacity: 0, y: 16, rotate: -3 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: v7Spring.default },
  exit: { opacity: 0, y: -8, rotate: 3, transition: v7Transition.fast },
};

/**
 * Calculate stagger delay
 */
export function v7StaggerDelay(
  index: number,
  baseDelay = 0.06,
  maxDelay = 0.5
): number {
  return Math.min(index * baseDelay, maxDelay);
}

// ============================================
// V7 SCROLL REVEAL
// ============================================

export const v7ScrollReveal = {
  /** Fade up on scroll */
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0, transition: v7Spring.gentle },
    viewport: { once: true, margin: "-80px" },
  },

  /** Scale in on scroll */
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    whileInView: { opacity: 1, scale: 1, transition: v7Spring.default },
    viewport: { once: true, margin: "-50px" },
  },

  /** Slide from left */
  slideLeft: {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0, transition: v7Spring.default },
    viewport: { once: true, margin: "-50px" },
  },

  /** Slide from right */
  slideRight: {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0, transition: v7Spring.default },
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
export function v7ParallaxLayer(speed: number) {
  return {
    style: {
      willChange: "transform" as const,
    },
    // Use with useScroll + useTransform from framer-motion
    speedFactor: speed,
  };
}

export const v7ParallaxPresets = {
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

export const v7Celebration = {
  /** Success checkmark */
  success: {
    initial: { scale: 0, rotate: -45 },
    animate: { scale: 1, rotate: 0, transition: v7Spring.ultraBouncy },
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
        ease: v7Easing.out,
        delay: index * 0.02,
      },
    },
  }),

  /** Badge earned */
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0, transition: v7Spring.dramatic },
  } as Variants,

  /** Counter increment */
  counter: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.3, 1],
      transition: { duration: v7Duration.normal, ease: v7Easing.elastic },
    },
  } as Variants,

  /** Star rating fill */
  starFill: (index: number) => ({
    initial: { scale: 0, rotate: -30 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: { ...v7Spring.ultraBouncy, delay: index * 0.1 },
    },
  }),
} as const;

// ============================================
// V7 FLOATING ANIMATIONS
// (For hero elements, decoratives)
// ============================================

export function v7Float(index: number) {
  return {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 3, 0],
      scale: [1, 1.02, 1],
    },
    transition: {
      duration: 5 + index * 0.7,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: index * 0.4,
    },
  };
}

export function v7FloatGentle(index: number) {
  return {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 1.5, 0],
    },
    transition: {
      duration: 6 + index * 0.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: index * 0.3,
    },
  };
}

// ============================================
// V7 MORPHING ANIMATIONS
// (For hamburger menu, icons)
// ============================================

export const v7Morph = {
  /** Hamburger to X morphing */
  hamburgerTop: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 8, transition: v7Spring.snappy },
  } as Variants,

  hamburgerMiddle: {
    closed: { opacity: 1, scaleX: 1 },
    open: { opacity: 0, scaleX: 0, transition: v7Transition.fast },
  } as Variants,

  hamburgerBottom: {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -8, transition: v7Spring.snappy },
  } as Variants,
} as const;

// ============================================
// V7 PRICE TICKER
// ============================================

export const v7PriceTicker = {
  /** Digit change */
  digit: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1, transition: v7Spring.snappy },
    exit: { y: "-100%", opacity: 0, transition: v7Transition.fast },
  } as Variants,
} as const;

// ============================================
// V7 ROUTE DRAWING
// (For map polylines)
// ============================================

export const v7RouteDraw = {
  /** Path drawing animation */
  path: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: v7Easing.out },
        opacity: { duration: 0.3 },
      },
    },
  } as Variants,

  /** Marker pulse */
  markerPulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
} as const;

// ============================================
// V7 VIEWPORT CONFIG
// ============================================

export const v7Viewport = {
  /** Once only, standard margin */
  once: { once: true, margin: "-50px" as const },
  /** Once only, larger margin */
  onceLarge: { once: true, margin: "-100px" as const },
  /** Repeat on every view */
  repeat: { once: false, margin: "-50px" as const },
  /** Amount visible before trigger */
  half: { once: true, amount: 0.5 as const },
} as const;
