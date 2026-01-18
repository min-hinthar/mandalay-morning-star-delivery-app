"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type ScrollDirection = "up" | "down" | "idle";

interface UseScrollDirectionOptions {
  /**
   * Minimum scroll delta to trigger direction change (prevents jitter)
   * @default 10
   */
  threshold?: number;
  /**
   * Initial scroll position to consider as "top of page"
   * @default 0
   */
  initialScrollTop?: number;
  /**
   * Throttle interval in milliseconds
   * @default 100
   */
  throttleMs?: number;
}

interface UseScrollDirectionReturn {
  /** Current scroll direction */
  scrollDirection: ScrollDirection;
  /** Whether the header should be collapsed */
  isCollapsed: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether user is at the top of the page */
  isAtTop: boolean;
}

/**
 * Hook to track scroll direction for collapsible headers
 *
 * @example
 * ```tsx
 * const { scrollDirection, isCollapsed } = useScrollDirection({ threshold: 10 });
 *
 * return (
 *   <header className={cn(
 *     "transition-transform duration-200",
 *     isCollapsed ? "-translate-y-full" : "translate-y-0"
 *   )}>
 *     ...
 *   </header>
 * );
 * ```
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 10, initialScrollTop = 0, throttleMs = 100 } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("idle");
  const [scrollY, setScrollY] = useState(0);

  const lastScrollY = useRef(initialScrollTop);
  const lastScrollTime = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY.current;

    // Update scroll position state
    setScrollY(currentScrollY);

    // At the top of the page - always show header
    if (currentScrollY <= threshold) {
      setScrollDirection("idle");
      lastScrollY.current = currentScrollY;
      ticking.current = false;
      return;
    }

    // Only update if delta exceeds threshold (prevents jitter)
    if (Math.abs(delta) >= threshold) {
      const direction: ScrollDirection = delta > 0 ? "down" : "up";
      setScrollDirection(direction);
      lastScrollY.current = currentScrollY;
    }

    ticking.current = false;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    const now = Date.now();

    // Throttle scroll events
    if (now - lastScrollTime.current < throttleMs) {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateScrollDirection);
      }
      return;
    }

    lastScrollTime.current = now;

    if (!ticking.current) {
      ticking.current = true;
      requestAnimationFrame(updateScrollDirection);
    }
  }, [throttleMs, updateScrollDirection]);

  useEffect(() => {
    // Set initial scroll position
    lastScrollY.current = window.scrollY;
    setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Determine collapse state
  const isCollapsed = scrollDirection === "down" && scrollY > threshold;
  const isAtTop = scrollY <= threshold;

  return {
    scrollDirection,
    isCollapsed,
    scrollY,
    isAtTop,
  };
}

export default useScrollDirection;
