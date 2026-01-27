"use client";

import { useState, useRef, useEffect } from "react";
import { useScroll, useVelocity, useMotionValueEvent } from "framer-motion";

type ScrollDirection = "up" | "down" | "idle";

/**
 * Options for the velocity-aware scroll direction hook
 */
export interface UseScrollDirectionWithVelocityOptions {
  /**
   * Minimum scroll delta to trigger direction change (prevents jitter)
   * @default 50
   */
  threshold?: number;
  /**
   * Velocity threshold (px/s) to consider scrolling "fast"
   * Fast scrolling triggers instant hide, slow triggers gradual spring
   * @default 300
   */
  velocityThreshold?: number;
}

/**
 * Return type for the velocity-aware scroll direction hook
 */
export interface UseScrollDirectionWithVelocityReturn {
  /** Current scroll direction */
  direction: ScrollDirection;
  /** Whether the header should be collapsed */
  isCollapsed: boolean;
  /** Whether the current scroll is "fast" (above velocity threshold) */
  isFastScroll: boolean;
  /** Current scroll position (MotionValue) */
  scrollY: number;
  /** Whether user is at the top of the page */
  isAtTop: boolean;
}

/**
 * Velocity-aware scroll direction detection hook
 *
 * Uses Framer Motion's useScroll and useVelocity for physics-based
 * scroll tracking. Returns isFastScroll to enable velocity-based
 * animation timing (fast = instant hide, slow = spring animation).
 *
 * @example
 * ```tsx
 * const { direction, isCollapsed, isFastScroll, isAtTop } = useScrollDirectionWithVelocity({
 *   threshold: 50,
 *   velocityThreshold: 300,
 * });
 *
 * // Use isFastScroll to pick animation duration
 * const transition = isFastScroll ? { duration: 0.1 } : spring.snappy;
 *
 * return (
 *   <motion.header
 *     animate={{ y: isCollapsed ? -72 : 0 }}
 *     transition={transition}
 *   >
 *     ...
 *   </motion.header>
 * );
 * ```
 */
export function useScrollDirectionWithVelocity(
  options: UseScrollDirectionWithVelocityOptions = {}
): UseScrollDirectionWithVelocityReturn {
  const { threshold = 50, velocityThreshold = 300 } = options;

  const [state, setState] = useState<Omit<UseScrollDirectionWithVelocityReturn, "scrollY"> & { scrollY: number }>({
    direction: "idle",
    isCollapsed: false,
    isFastScroll: false,
    scrollY: 0,
    isAtTop: true,
  });

  // Use Framer Motion's scroll hooks
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Track previous scroll position
  const lastScrollY = useRef(0);

  // Handle scroll changes with velocity awareness
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = lastScrollY.current;
    const velocity = scrollVelocity.get();
    const isFast = Math.abs(velocity) > velocityThreshold;
    const delta = current - previous;

    // Update last position
    lastScrollY.current = current;

    // At the top of the page - always show header, reset state
    if (current <= threshold) {
      setState({
        direction: "idle",
        isCollapsed: false,
        isFastScroll: false,
        scrollY: current,
        isAtTop: true,
      });
      return;
    }

    // Only update direction if delta exceeds threshold (prevents jitter)
    if (Math.abs(delta) >= threshold) {
      const direction: ScrollDirection = delta > 0 ? "down" : "up";
      const isCollapsed = direction === "down";

      setState({
        direction,
        isCollapsed,
        isFastScroll: isFast,
        scrollY: current,
        isAtTop: false,
      });
    } else {
      // Update scrollY and velocity without changing direction
      setState((prev) => ({
        ...prev,
        scrollY: current,
        isFastScroll: isFast,
        isAtTop: false,
      }));
    }
  });

  // Initialize with current scroll position
  useEffect(() => {
    const initialY = window.scrollY;
    lastScrollY.current = initialY;
    setState((prev) => ({
      ...prev,
      scrollY: initialY,
      isAtTop: initialY <= threshold,
    }));
  }, [threshold]);

  return state;
}

export default useScrollDirectionWithVelocity;
