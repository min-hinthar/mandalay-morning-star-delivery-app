"use client";

import React, { useRef, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, duration as motionDuration, easing } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type PageTransitionVariant =
  | "fade"
  | "slide"
  | "slideUp"
  | "slideDown"
  | "scale"
  | "reveal"
  | "flip"
  | "morphBlur"
  | "stagger";

type NavigationDirection = "forward" | "backward" | "none";

export interface PageTransitionProps {
  children: ReactNode;
  /** Transition variant */
  variant?: PageTransitionVariant;
  /** Custom className */
  className?: string;
  /** Disable transitions entirely */
  disabled?: boolean;
  /** Custom transition key (defaults to pathname) */
  transitionKey?: string;
  /** Callback when transition starts */
  onTransitionStart?: () => void;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
  /** Preserve scroll position between pages */
  preserveScroll?: boolean;
  /** Custom spring config */
  springConfig?: typeof spring.default;
}

// ============================================
// VARIANT DEFINITIONS
// ============================================

const createVariants = (
  direction: NavigationDirection,
  variant: PageTransitionVariant
): Variants => {
  const springTransition = spring.default;
  const fastExit = { duration: motionDuration.fast, ease: easing.in };

  switch (variant) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: motionDuration.normal } },
        exit: { opacity: 0, transition: fastExit },
      };

    case "slide":
      return {
        initial: {
          x: direction === "forward" ? 60 : direction === "backward" ? -60 : 0,
          opacity: 0,
        },
        animate: {
          x: 0,
          opacity: 1,
          transition: springTransition,
        },
        exit: {
          x: direction === "forward" ? -40 : direction === "backward" ? 40 : 0,
          opacity: 0,
          transition: fastExit,
        },
      };

    case "slideUp":
      return {
        initial: { y: 50, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: springTransition },
        exit: { y: -30, opacity: 0, transition: fastExit },
      };

    case "slideDown":
      return {
        initial: { y: -50, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: springTransition },
        exit: { y: 30, opacity: 0, transition: fastExit },
      };

    case "scale":
      return {
        initial: { scale: 0.92, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: spring.gentle },
        exit: { scale: 0.95, opacity: 0, transition: fastExit },
      };

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
            clipPath: { duration: motionDuration.slow, ease: easing.out },
            opacity: { duration: motionDuration.fast },
          },
        },
        exit: {
          clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
          opacity: 0,
          transition: fastExit,
        },
      };

    case "flip":
      return {
        initial: {
          rotateY: direction === "forward" ? 15 : -15,
          scale: 0.95,
          opacity: 0,
          transformPerspective: 1200,
        },
        animate: {
          rotateY: 0,
          scale: 1,
          opacity: 1,
          transition: spring.gentle,
        },
        exit: {
          rotateY: direction === "forward" ? -15 : 15,
          scale: 0.95,
          opacity: 0,
          transition: fastExit,
        },
      };

    case "morphBlur":
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
            opacity: { duration: motionDuration.normal },
            scale: springTransition,
            filter: { duration: motionDuration.slow },
          },
        },
        exit: {
          opacity: 0,
          scale: 0.98,
          filter: "blur(8px)",
          transition: fastExit,
        },
      };

    case "stagger":
      return {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            staggerChildren: 0.03,
            staggerDirection: -1,
          },
        },
      };

    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

// ============================================
// SCROLL RESTORATION
// ============================================

const scrollPositions = new Map<string, number>();

function saveScrollPosition(key: string) {
  scrollPositions.set(key, window.scrollY);
}

function restoreScrollPosition(key: string) {
  const position = scrollPositions.get(key);
  if (position !== undefined) {
    window.scrollTo(0, position);
  } else {
    window.scrollTo(0, 0);
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PageTransition({
  children,
  variant = "slide",
  className,
  disabled = false,
  transitionKey,
  onTransitionStart,
  onTransitionComplete,
  preserveScroll = false,
  springConfig: _springConfig,
}: PageTransitionProps) {
  const { shouldAnimate } = useAnimationPreference();
  const pathname = usePathname();
  const key = transitionKey ?? pathname;

  const prevPathname = useRef(pathname);
  const navigationHistory = useRef<string[]>([pathname]);
  const isFirstRender = useRef(true);

  // Determine navigation direction
  const getDirection = (): NavigationDirection => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return "none";
    }

    const history = navigationHistory.current;
    const prevIndex = history.indexOf(prevPathname.current);
    const currentIndex = history.indexOf(pathname);

    if (currentIndex !== -1 && currentIndex < prevIndex) {
      return "backward";
    }

    return "forward";
  };

  // Update navigation history
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Save scroll position for previous page
      if (preserveScroll) {
        saveScrollPosition(prevPathname.current);
      }

      const history = navigationHistory.current;
      const existingIndex = history.indexOf(pathname);

      if (existingIndex === -1) {
        history.push(pathname);
      }

      prevPathname.current = pathname;

      // Restore scroll position for current page
      if (preserveScroll) {
        setTimeout(() => restoreScrollPosition(pathname), 50);
      }
    }
  }, [pathname, preserveScroll]);

  const direction = getDirection();
  const variants = createVariants(direction, variant);

  // Skip animations if disabled or reduced motion
  if (disabled || !shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={onTransitionComplete}
    >
      <motion.div
        key={key}
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

// ============================================
// STAGGER CHILD WRAPPER
// Use with variant="stagger" on parent
// ============================================

export interface StaggerChildProps {
  children: ReactNode;
  className?: string;
}

export function StaggerChild({ children, className }: StaggerChildProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      }}
      transition={getSpring(spring.default)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// FADE TRANSITION (Simple alternative)
// ============================================

export interface FadeTransitionProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function FadeTransition({
  children,
  className,
  duration = motionDuration.normal,
}: FadeTransitionProps) {
  const { shouldAnimate } = useAnimationPreference();
  const pathname = usePathname();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// SLIDE TRANSITION (For modals/drawers)
// ============================================

export type SlideDirection = "up" | "down" | "left" | "right";

export interface SlideTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  direction?: SlideDirection;
  className?: string;
  onExitComplete?: () => void;
}

export function SlideTransition({
  children,
  isVisible,
  direction = "up",
  className,
  onExitComplete,
}: SlideTransitionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const getSlideConfig = (dir: SlideDirection) => {
    switch (dir) {
      case "up": return { y: "100%" };
      case "down": return { y: "-100%" };
      case "left": return { x: "100%" };
      case "right": return { x: "-100%" };
    }
  };

  const slideConfig = getSlideConfig(direction);

  if (!shouldAnimate) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ ...slideConfig, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ ...slideConfig, opacity: 0 }}
          transition={getSpring(spring.default)}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SCALE TRANSITION (For dialogs)
// ============================================

export interface ScaleTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  onExitComplete?: () => void;
}

export function ScaleTransition({
  children,
  isVisible,
  className,
  onExitComplete,
}: ScaleTransitionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (!shouldAnimate) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={getSpring(spring.gentle)}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MORPH BLUR TRANSITION (Premium feel)
// ============================================

export interface MorphBlurTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  onExitComplete?: () => void;
}

export function MorphBlurTransition({
  children,
  isVisible,
  className,
  onExitComplete,
}: MorphBlurTransitionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (!shouldAnimate) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          transition={{
            opacity: { duration: motionDuration.normal },
            scale: getSpring(spring.gentle),
            filter: { duration: motionDuration.slow },
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageTransition;
