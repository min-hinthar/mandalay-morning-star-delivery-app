/**
 * V3 Sprint 6: Page Transition Component
 *
 * Direction-aware page transitions for navigation polish.
 * Forward: slide left, Backward: slide right
 */

"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

type NavigationDirection = "forward" | "backward" | "none";

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** Disable transitions */
  disabled?: boolean;
}

// ============================================
// PAGE TRANSITION COMPONENT
// ============================================

export function PageTransition({
  children,
  className,
  disabled = false,
}: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const navigationHistory = useRef<string[]>([pathname]);
  const prefersReducedMotion = useReducedMotion();
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

    // Going back in history
    if (currentIndex !== -1 && currentIndex < prevIndex) {
      return "backward";
    }

    return "forward";
  };

  // Update history on pathname change
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      const history = navigationHistory.current;
      const existingIndex = history.indexOf(pathname);

      if (existingIndex === -1) {
        // New page, add to history
        history.push(pathname);
      }
      // If going back, don't modify history

      prevPathname.current = pathname;
    }
  }, [pathname]);

  const direction = getDirection();

  // Skip animations if disabled or reduced motion
  if (disabled || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    initial: (dir: NavigationDirection) => ({
      x: dir === "forward" ? 30 : dir === "backward" ? -30 : 0,
      opacity: dir === "none" ? 1 : 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: NavigationDirection) => ({
      x: dir === "forward" ? -30 : dir === "backward" ? 30 : 0,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("min-h-screen", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// FADE TRANSITION (for simpler pages)
// ============================================

export interface FadeTransitionProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function FadeTransition({
  children,
  className,
  duration = 0.3,
}: FadeTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
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
// SLIDE TRANSITION (for modals/drawers)
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
  const prefersReducedMotion = useReducedMotion();

  const getSlideConfig = (dir: SlideDirection) => {
    switch (dir) {
      case "up":
        return { y: "100%" };
      case "down":
        return { y: "-100%" };
      case "left":
        return { x: "100%" };
      case "right":
        return { x: "-100%" };
    }
  };

  const slideConfig = getSlideConfig(direction);

  if (prefersReducedMotion) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ ...slideConfig, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ ...slideConfig, opacity: 0 }}
          transition={{
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SCALE TRANSITION (for dialogs)
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
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
