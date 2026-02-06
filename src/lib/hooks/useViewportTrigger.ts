"use client";

import { useEffect, useRef, useState } from "react";

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
 * Returns a ref to attach to a container and a `triggered` boolean
 * that becomes true when the element enters the viewport (and stays true).
 *
 * @example
 * const { ref, triggered } = useViewportTrigger();
 * // triggered === true once the element is visible
 */
export function useViewportTrigger(options: UseViewportTriggerOptions = {}) {
  const { fallbackToEager = true, threshold = 0, eager = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(eager);

  useEffect(() => {
    // Already triggered (eager mode or previous trigger) -- nothing to do
    if (triggered) return;

    // IntersectionObserver not available -- fall back to eager if configured
    if (typeof IntersectionObserver === "undefined") {
      if (fallbackToEager) {
        setTriggered(true);
      }
      return;
    }

    const element = ref.current;
    if (!element) return;

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
  }, [triggered, threshold, fallbackToEager]);

  return { ref, triggered };
}
