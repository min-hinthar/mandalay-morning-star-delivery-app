"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, duration, easing } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type PageTransitionVariant = "fade" | "slide" | "morph" | "reveal" | "scale";

export interface PageTransitionProps {
  /** Page content */
  children: ReactNode;
  /** Transition variant type */
  variant?: PageTransitionVariant;
  /** Additional CSS classes */
  className?: string;
  /** Maintain scroll position between pages */
  preserveScroll?: boolean;
  /** Callback when transition starts */
  onTransitionStart?: () => void;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
}

// ============================================
// VARIANT DEFINITIONS
// Uses spring for entrance, fast duration for exit
// (per Phase 2 pattern: "overlayMotion uses spring for open, duration for close")
// ============================================

const springEntrance = spring.default;
const fastExit = { duration: duration.fast, ease: easing.in };

function getVariants(variant: PageTransitionVariant): Variants {
  switch (variant) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: { duration: duration.normal },
        },
        exit: {
          opacity: 0,
          transition: fastExit,
        },
      };

    case "slide":
      return {
        initial: { x: 30, opacity: 0 },
        animate: {
          x: 0,
          opacity: 1,
          transition: springEntrance,
        },
        exit: {
          x: -20,
          opacity: 0,
          transition: fastExit,
        },
      };

    case "morph":
      // Premium morph variant with blur + scale
      /* eslint-disable no-restricted-syntax -- FM animation needs numeric blur for interpolation */
      return {
        initial: {
          opacity: 0,
          scale: 1.02,
          filter: "blur(12px)",
        },
        animate: {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            opacity: { duration: duration.normal },
            scale: springEntrance,
            filter: { duration: duration.slow },
          },
        },
        exit: {
          opacity: 0,
          scale: 0.98,
          filter: "blur(8px)",
          transition: fastExit,
        },
      };
    /* eslint-enable no-restricted-syntax */

    case "reveal":
      return {
        initial: {
          clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
          opacity: 0,
        },
        animate: {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
          opacity: 1,
          transition: {
            clipPath: { duration: duration.slow, ease: easing.out },
            opacity: { duration: duration.fast },
          },
        },
        exit: {
          clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
          opacity: 0,
          transition: fastExit,
        },
      };

    case "scale":
      return {
        initial: { scale: 0.95, opacity: 0 },
        animate: {
          scale: 1,
          opacity: 1,
          transition: spring.gentle,
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          transition: fastExit,
        },
      };

    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

// ============================================
// COMPONENT
// ============================================

/**
 * PageTransition
 *
 * Enhanced page transitions using V8 motion tokens.
 * Uses pathname as AnimatePresence key for route change detection.
 *
 * Key differences from existing PageTransition:
 * - Uses V8 motion tokens (spring.default, spring.snappy)
 * - Adds 'morph' variant with blur + scale for premium feel
 * - Ensures no layout shift (min-h-screen on container)
 * - Respects useAnimationPreference
 *
 * @example
 * // In layout.tsx
 * <PageTransition variant="morph">
 *   {children}
 * </PageTransition>
 */
export function PageTransition({
  children,
  variant = "slide",
  className,
  preserveScroll = false,
  onTransitionStart,
  onTransitionComplete,
}: PageTransitionProps) {
  const pathname = usePathname();
  const { shouldAnimate } = useAnimationPreference();

  // Handle scroll restoration
  const handleExitComplete = () => {
    if (!preserveScroll) {
      window.scrollTo(0, 0);
    }
    onTransitionComplete?.();
  };

  // Skip animations if disabled
  if (!shouldAnimate) {
    return <div className={cn("min-h-screen", className)}>{children}</div>;
  }

  const variants = getVariants(variant);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("min-h-screen", className)}
        onAnimationStart={onTransitionStart}
        style={{
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
