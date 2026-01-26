"use client";

import { useCallback, useRef } from "react";

/**
 * Hook for animated theme transitions using View Transitions API.
 *
 * Features:
 * - Circular reveal expanding from click location
 * - Spring easing with slight overshoot
 * - Debounce rapid toggles (300ms)
 * - Graceful fallback for unsupported browsers
 * - Respects prefers-reduced-motion
 */

export function useThemeTransition() {
  const lastToggleRef = useRef(0);
  const DEBOUNCE_MS = 300;

  const toggleWithTransition = useCallback(
    async (
      event: React.MouseEvent,
      toggleFn: () => void
    ): Promise<void> => {
      // Debounce rapid toggles
      const now = Date.now();
      if (now - lastToggleRef.current < DEBOUNCE_MS) return;
      lastToggleRef.current = now;

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Feature detection + reduced motion check
      if (!document.startViewTransition || prefersReducedMotion) {
        toggleFn();
        return;
      }

      // Get click coordinates for circular reveal origin
      const x = event.clientX;
      const y = event.clientY;

      // Calculate max radius to cover entire viewport
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Start view transition
      const transition = document.startViewTransition(() => {
        toggleFn();
      });

      try {
        await transition.ready;

        // Animate with circular clip-path
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 300,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Spring overshoot
            pseudoElement: "::view-transition-new(root)",
          }
        );
      } catch {
        // Transition failed, theme still changes via toggleFn()
      }
    },
    []
  );

  return { toggleWithTransition };
}
