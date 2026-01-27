"use client";

import { useMemo } from "react";
import {
  useScrollDirectionWithVelocity,
  type UseScrollDirectionWithVelocityOptions,
} from "./useScrollDirectionWithVelocity";
import { spring } from "@/lib/motion-tokens";
import type { Transition } from "framer-motion";

/**
 * Options for header visibility hook
 */
export interface UseHeaderVisibilityOptions extends UseScrollDirectionWithVelocityOptions {
  /**
   * Whether an overlay (drawer, modal, command palette) is open
   * When true, header stays visible (pinned) and isCollapsed resets to false
   * @default false
   */
  overlayOpen?: boolean;
}

/**
 * Return type for header visibility hook
 */
export interface UseHeaderVisibilityReturn {
  /** Whether the header should be visible */
  isVisible: boolean;
  /** Whether the header should be collapsed (scrolled down past threshold) */
  isCollapsed: boolean;
  /** Whether the current scroll is "fast" */
  isFastScroll: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether user is at the top of the page */
  isAtTop: boolean;
  /** Get appropriate transition based on scroll velocity */
  getTransition: () => Transition;
}

/**
 * Get header animation transition based on scroll velocity
 *
 * Fast scrolling = near-instant hide (duration: 0.1)
 * Slow scrolling = smooth spring animation (spring.snappy)
 *
 * @param isFastScroll - Whether the scroll is fast
 * @returns Framer Motion transition config
 */
export function getHeaderTransition(isFastScroll: boolean): Transition {
  if (isFastScroll) {
    return { duration: 0.1 };
  }
  return spring.snappy;
}

/**
 * Combined header visibility logic
 *
 * Wraps useScrollDirectionWithVelocity and adds overlay pinning behavior.
 * When an overlay is open, the header stays visible regardless of scroll state.
 *
 * @example
 * ```tsx
 * const { isDrawerOpen } = useCartDrawer();
 * const [isCommandPaletteOpen] = useState(false);
 *
 * const { isVisible, isCollapsed, getTransition } = useHeaderVisibility({
 *   overlayOpen: isDrawerOpen || isCommandPaletteOpen,
 * });
 *
 * return (
 *   <motion.header
 *     animate={{ y: isVisible && !isCollapsed ? 0 : -72 }}
 *     transition={getTransition()}
 *   >
 *     ...
 *   </motion.header>
 * );
 * ```
 */
export function useHeaderVisibility(
  options: UseHeaderVisibilityOptions = {}
): UseHeaderVisibilityReturn {
  const { overlayOpen = false, ...scrollOptions } = options;

  const scrollState = useScrollDirectionWithVelocity(scrollOptions);

  // When overlay is open, header is always visible and not collapsed
  const isVisible = useMemo(() => {
    if (overlayOpen) return true;
    return !scrollState.isCollapsed || scrollState.isAtTop;
  }, [overlayOpen, scrollState.isCollapsed, scrollState.isAtTop]);

  const isCollapsed = useMemo(() => {
    if (overlayOpen) return false;
    return scrollState.isCollapsed;
  }, [overlayOpen, scrollState.isCollapsed]);

  // Memoize getTransition function to prevent unnecessary re-renders
  const getTransition = useMemo(() => {
    return () => getHeaderTransition(scrollState.isFastScroll);
  }, [scrollState.isFastScroll]);

  return {
    isVisible,
    isCollapsed,
    isFastScroll: scrollState.isFastScroll,
    scrollY: scrollState.scrollY,
    isAtTop: scrollState.isAtTop,
    getTransition,
  };
}

export default useHeaderVisibility;
