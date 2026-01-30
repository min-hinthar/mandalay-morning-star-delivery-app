"use client";

/**
 * Body Scroll Lock Hook
 * Prevents background scrolling when overlays are open
 *
 * Uses position: fixed technique to prevent iOS scroll issues.
 * Preserves and restores scroll position on lock/unlock.
 *
 * @example
 * function Modal({ isOpen, children }) {
 *   useBodyScrollLock(isOpen);
 *   return isOpen ? <div>{children}</div> : null;
 * }
 */

import { useEffect, useRef } from "react";

/**
 * Lock/unlock body scroll with scroll position preservation.
 *
 * @param isLocked - Whether scroll should be locked
 */
export function useBodyScrollLock(isLocked: boolean): void {
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
        // Get stored scroll position from body.style.top
        const storedScrollY = parseInt(document.body.style.top || "0", 10) * -1;

        // Reset all body styles immediately so content is visible
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";

        // Defer scroll restoration to prevent iOS Safari crashes
        // during AnimatePresence exit animations
        setTimeout(() => {
          window.scrollTo(0, storedScrollY);
        }, 0);
      }
    };
  }, [isLocked]);
}
