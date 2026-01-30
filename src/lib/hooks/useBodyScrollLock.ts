"use client";

/**
 * Body Scroll Lock Hook
 * Prevents background scrolling when overlays are open
 *
 * Uses position: fixed technique to prevent iOS scroll issues.
 * Preserves and restores scroll position on lock/unlock.
 *
 * IMPORTANT: Scroll restoration is deferred using requestAnimationFrame
 * to prevent iOS Safari crashes during AnimatePresence exit animations.
 *
 * @example
 * function Modal({ isOpen, children }) {
 *   useBodyScrollLock(isOpen);
 *   return isOpen ? <div>{children}</div> : null;
 * }
 */

import { useEffect, useRef } from "react";

// Global lock count to handle nested overlays (modal inside drawer, etc.)
let activeLockCount = 0;
let globalScrollY = 0;

/**
 * Lock/unlock body scroll with scroll position preservation.
 *
 * @param isLocked - Whether scroll should be locked
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const wasLockedRef = useRef(false);

  useEffect(() => {
    if (isLocked && !wasLockedRef.current) {
      // First lock - store scroll position globally
      if (activeLockCount === 0) {
        globalScrollY = window.scrollY;

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
    }

    return () => {
      if (wasLockedRef.current) {
        wasLockedRef.current = false;
        activeLockCount = Math.max(0, activeLockCount - 1);

        // Only restore when last lock is released
        if (activeLockCount === 0) {
          const scrollY = globalScrollY;

          // Reset body styles immediately so content is visible
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.left = "";
          document.body.style.right = "";
          document.body.style.overflow = "";
          document.body.style.paddingRight = "";

          // Defer scroll restoration to next frame to let DOM stabilize
          // This prevents iOS Safari crashes during AnimatePresence exit
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        }
      }
    };
  }, [isLocked]);
}
