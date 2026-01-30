"use client";

/**
 * Route-Aware Overlay Close Hook
 * Automatically closes overlays when the route changes
 *
 * Stores the pathname when overlay opens and closes if it changes.
 * This prevents overlays from persisting across navigation.
 *
 * Uses queueMicrotask to defer the close call, preventing React state
 * update cascades during render cycles.
 *
 * @example
 * function Modal({ isOpen, onClose, children }) {
 *   useRouteChangeClose(isOpen, onClose);
 *   return isOpen ? <div>{children}</div> : null;
 * }
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Close overlay when pathname changes while open.
 *
 * @param isOpen - Whether the overlay is currently open
 * @param onClose - Callback to close the overlay
 */
export function useRouteChangeClose(
  isOpen: boolean,
  onClose: () => void
): void {
  const pathname = usePathname();
  const openedPathnameRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Store pathname when overlay opens
  useEffect(() => {
    if (isOpen) {
      openedPathnameRef.current = pathname;
    } else {
      // Reset when overlay closes
      openedPathnameRef.current = null;
    }
  }, [isOpen, pathname]);

  // Close if pathname changed after opening
  useEffect(() => {
    if (
      isOpen &&
      openedPathnameRef.current !== null &&
      pathname !== openedPathnameRef.current
    ) {
      // Defer close to next microtask to avoid React state update cascades
      queueMicrotask(() => {
        if (isMountedRef.current) {
          onClose();
          openedPathnameRef.current = null;
        }
      });
    }
  }, [isOpen, pathname, onClose]);
}
