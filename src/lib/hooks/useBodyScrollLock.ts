"use client";

/**
 * Body Scroll Lock Hook
 * Prevents background scrolling when overlays are open
 *
 * Uses position: fixed technique to prevent iOS scroll issues.
 * Preserves and restores scroll position on lock/unlock.
 *
 * IMPORTANT: On mobile Safari, immediate scroll restoration during
 * AnimatePresence exit animations can cause layout thrashing and
 * "Can't open page" crashes. Use deferScrollRestore option when
 * used with animated overlays, and call restoreScroll() in
 * AnimatePresence's onExitComplete callback.
 *
 * @example
 * // Basic usage (immediate restore)
 * function Modal({ isOpen, children }) {
 *   useBodyScrollLock(isOpen);
 *   return isOpen ? <div>{children}</div> : null;
 * }
 *
 * @example
 * // Deferred restore for animated overlays
 * function AnimatedModal({ isOpen, children }) {
 *   const { restoreScroll } = useBodyScrollLock(isOpen, { deferScrollRestore: true });
 *   return (
 *     <AnimatePresence onExitComplete={restoreScroll}>
 *       {isOpen && <motion.div>{children}</motion.div>}
 *     </AnimatePresence>
 *   );
 * }
 */

import { useEffect, useRef, useCallback } from "react";

export interface UseBodyScrollLockOptions {
  /**
   * If true, scroll restoration is deferred until restoreScroll() is called.
   * Use this when the overlay has exit animations to prevent iOS Safari crashes.
   * @default false
   */
  deferScrollRestore?: boolean;
}

export interface UseBodyScrollLockReturn {
  /**
   * Manually restore scroll position. Call this in onExitComplete
   * when deferScrollRestore is true.
   */
  restoreScroll: () => void;
}

// Track active locks globally to prevent conflicts between multiple overlays
let activeLockCount = 0;
let globalScrollY = 0;

/**
 * Lock/unlock body scroll with scroll position preservation.
 *
 * @param isLocked - Whether scroll should be locked
 * @param options - Configuration options
 * @returns Object containing restoreScroll function for deferred restoration
 */
export function useBodyScrollLock(
  isLocked: boolean,
  options: UseBodyScrollLockOptions = {}
): UseBodyScrollLockReturn {
  const { deferScrollRestore = false } = options;
  const scrollYRef = useRef<number>(0);
  const wasLockedRef = useRef<boolean>(false);
  const needsRestoreRef = useRef<boolean>(false);

  // Restore scroll position - can be called manually or from cleanup
  const restoreScroll = useCallback(() => {
    if (!needsRestoreRef.current) return;

    // Only restore if this was the last lock
    if (activeLockCount === 0) {
      // Use requestAnimationFrame to ensure DOM is stable
      requestAnimationFrame(() => {
        const storedScrollY = globalScrollY;

        // Reset all body styles
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";

        // Restore scroll position on next frame to ensure layout is complete
        requestAnimationFrame(() => {
          window.scrollTo(0, storedScrollY);
        });
      });
    }

    needsRestoreRef.current = false;
  }, []);

  useEffect(() => {
    if (isLocked && !wasLockedRef.current) {
      // First lock - store scroll position
      if (activeLockCount === 0) {
        globalScrollY = window.scrollY;
        scrollYRef.current = globalScrollY;

        // Lock body scroll
        document.body.style.position = "fixed";
        document.body.style.top = `-${globalScrollY}px`;
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

      activeLockCount++;
      wasLockedRef.current = true;
      needsRestoreRef.current = false;
    }

    return () => {
      if (wasLockedRef.current) {
        activeLockCount = Math.max(0, activeLockCount - 1);
        wasLockedRef.current = false;
        needsRestoreRef.current = true;

        if (!deferScrollRestore) {
          // Immediate restore - but still use rAF for stability
          restoreScroll();
        }
        // If deferScrollRestore is true, caller must call restoreScroll()
      }
    };
  }, [isLocked, deferScrollRestore, restoreScroll]);

  return { restoreScroll };
}
