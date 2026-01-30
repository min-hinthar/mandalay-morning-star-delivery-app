"use client";

/**
 * Body Scroll Lock Hook
 * Prevents background scrolling when overlays are open
 *
 * Uses position: fixed technique to prevent iOS scroll issues.
 * Preserves and restores scroll position on lock/unlock.
 *
 * For components with exit animations (Modal, Drawer), use deferRestore: true
 * and call restoreScrollPosition in AnimatePresence's onExitComplete callback.
 * This prevents iOS Safari crashes during DOM transitions.
 *
 * @example
 * // Simple usage (auto-restore on unlock)
 * function Overlay({ isOpen }) {
 *   useBodyScrollLock(isOpen);
 *   return isOpen ? <div>...</div> : null;
 * }
 *
 * @example
 * // With AnimatePresence (deferred restore)
 * function Modal({ isOpen }) {
 *   const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });
 *   return (
 *     <AnimatePresence onExitComplete={restoreScrollPosition}>
 *       {isOpen && <motion.div>...</motion.div>}
 *     </AnimatePresence>
 *   );
 * }
 */

import { useEffect, useRef, useCallback } from "react";

export interface UseBodyScrollLockOptions {
  /**
   * If true, skip scroll restoration in cleanup.
   * Caller must call restoreScrollPosition() manually (e.g., in onExitComplete).
   * Use this for components with exit animations to prevent iOS Safari crashes.
   * @default false
   */
  deferRestore?: boolean;
}

export interface UseBodyScrollLockReturn {
  /**
   * Manually restore scroll position.
   * Call this in AnimatePresence's onExitComplete when using deferRestore: true.
   */
  restoreScrollPosition: () => void;
}

/**
 * Lock/unlock body scroll with scroll position preservation.
 *
 * @param isLocked - Whether scroll should be locked
 * @param options - Configuration options
 * @returns Object with restoreScrollPosition function for deferred restoration
 */
export function useBodyScrollLock(
  isLocked: boolean,
  options: UseBodyScrollLockOptions = {}
): UseBodyScrollLockReturn {
  const { deferRestore = false } = options;
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (isLocked) {
      // Store current scroll position
      scrollYRef.current = window.scrollY;

      // Lock body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      // Account for scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      if (isLocked) {
        // Reset all body styles immediately so content is visible
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";

        // Only restore scroll if NOT deferred
        // When deferred, caller uses restoreScrollPosition in onExitComplete
        if (!deferRestore) {
          const storedScrollY = scrollYRef.current;
          setTimeout(() => {
            window.scrollTo(0, storedScrollY);
          }, 0);
        }
      }
    };
  }, [isLocked, deferRestore]);

  // Manual scroll restoration for deferred mode
  const restoreScrollPosition = useCallback(() => {
    window.scrollTo(0, scrollYRef.current);
  }, []);

  return { restoreScrollPosition };
}
