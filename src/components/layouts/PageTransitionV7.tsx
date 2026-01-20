"use client";

import React, { useRef, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { v7Spring, v7Duration, v7Easing } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

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

export interface PageTransitionV7Props {
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
  springConfig?: typeof v7Spring.default;
}

// ============================================
// VARIANT DEFINITIONS
// ============================================

const createVariants = (
  direction: NavigationDirection,
  variant: PageTransitionVariant
): Variants => {
  const springTransition = v7Spring.default;
  const fastExit = { duration: v7Duration.fast, ease: v7Easing.in };

  switch (variant) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: v7Duration.normal } },
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
        animate: { scale: 1, opacity: 1, transition: v7Spring.gentle },
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
            clipPath: { duration: v7Duration.slow, ease: v7Easing.out },
            opacity: { duration: v7Duration.fast },
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
          transition: v7Spring.gentle,
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
            opacity: { duration: v7Duration.normal },
            scale: springTransition,
            filter: { duration: v7Duration.slow },
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

export function PageTransitionV7({
  children,
  variant = "slide",
  className,
  disabled = false,
  transitionKey,
  onTransitionStart,
  onTransitionComplete,
  preserveScroll = false,
  springConfig: _springConfig,
}: PageTransitionV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
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
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

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
      transition={getSpring(v7Spring.default)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// FADE TRANSITION (Simple alternative)
// ============================================

export interface FadeTransitionV7Props {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function FadeTransitionV7({
  children,
  className,
  duration = v7Duration.normal,
}: FadeTransitionV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
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

export interface SlideTransitionV7Props {
  children: ReactNode;
  isVisible: boolean;
  direction?: SlideDirection;
  className?: string;
  onExitComplete?: () => void;
}

export function SlideTransitionV7({
  children,
  isVisible,
  direction = "up",
  className,
  onExitComplete,
}: SlideTransitionV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

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
          transition={getSpring(v7Spring.default)}
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

export interface ScaleTransitionV7Props {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  onExitComplete?: () => void;
}

export function ScaleTransitionV7({
  children,
  isVisible,
  className,
  onExitComplete,
}: ScaleTransitionV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

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
          transition={getSpring(v7Spring.gentle)}
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

export interface MorphBlurTransitionV7Props {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
  onExitComplete?: () => void;
}

export function MorphBlurTransitionV7({
  children,
  isVisible,
  className,
  onExitComplete,
}: MorphBlurTransitionV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

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
            opacity: { duration: v7Duration.normal },
            scale: getSpring(v7Spring.gentle),
            filter: { duration: v7Duration.slow },
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageTransitionV7;
