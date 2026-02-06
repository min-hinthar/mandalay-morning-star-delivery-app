/**
 * Modal Constants
 *
 * Size configurations and animation variants for Modal component.
 */

// ============================================
// SIZE CONFIGURATIONS
// ============================================

export const sizeConfig = {
  sm: { maxWidth: "max-w-sm", padding: "p-4" },
  md: { maxWidth: "max-w-md", padding: "p-5" },
  lg: { maxWidth: "max-w-lg", padding: "p-6" },
  xl: { maxWidth: "max-w-xl", padding: "p-6" },
  full: { maxWidth: "max-w-[calc(100vw-2rem)]", padding: "p-6" },
};

// ============================================
// ANIMATION VARIANTS
// ============================================

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const desktopVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Simplified mobile variants - removed opacity animation to reduce GPU load on mobile
export const mobileVariants = {
  hidden: {
    y: "100%",
  },
  visible: {
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    y: "100%",
    transition: {
      duration: 0.15,
      ease: "easeIn" as const,
    },
  },
};

export const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
