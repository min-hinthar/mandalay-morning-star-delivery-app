"use client";

import { useEffect, useCallback, useState } from "react";

interface UseViewportTriggerOptions {
  /** Fall back to eager loading when IntersectionObserver is unavailable (default: true) */
  fallbackToEager?: boolean;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number;
  /** Bypass viewport detection entirely, trigger immediately (default: false) */
  eager?: boolean;
}

/**
 * Viewport-based loading trigger.
 * Returns a callback ref to attach to a container and a `triggered` boolean
 * that becomes true when the element enters the viewport (and stays true).
 *
 * Uses a callback ref so that elements rendered after initial mount
 * (e.g. after async data loads) are still observed correctly.
 *
 * @example
 * const { ref, triggered } = useViewportTrigger();
 * // triggered === true once the element is visible
 */
export function useViewportTrigger(options: UseViewportTriggerOptions = {}) {
  const { fallbackToEager = true, threshold = 0, eager = false } = options;
  const [triggered, setTriggered] = useState(eager);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (triggered || !element) return;

    if (typeof IntersectionObserver === "undefined") {
      if (fallbackToEager) {
        setTriggered(true);
      }
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [triggered, element, threshold, fallbackToEager]);

  return { ref, triggered };
}
