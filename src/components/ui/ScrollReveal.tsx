"use client";

/**
 * ScrollReveal — reveal-on-scroll wrapper for the long After Dark surfaces
 * (orders detail, account tabs) so sections rise in as they enter the viewport
 * instead of all-at-once on mount. Level-up kit primitive.
 *
 * IntersectionObserver via framer `useInView` (`once`), transform/opacity only.
 * No-ops under reduced motion (renders children at rest immediately). The
 * `useScrollReveal` hook is exposed for custom reveals.
 */

import { useRef, type ReactNode } from "react";
import { m, useInView } from "framer-motion";

const REVEAL_MARGIN = "0px 0px -12% 0px";

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: REVEAL_MARGIN });
  return { ref, inView };
}

export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Stagger offset (s) when several reveal together. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: REVEAL_MARGIN });

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export default ScrollReveal;
