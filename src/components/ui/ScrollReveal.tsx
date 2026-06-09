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
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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
  const { shouldAnimate } = useAnimationPreference();

  return (
    <m.div
      ref={ref}
      // Reduced motion / app-level "none": render at rest immediately (initial
      // false → natural DOM state, no opacity:0 hold), matching sibling primitives.
      initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
      animate={shouldAnimate ? (inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }) : undefined}
      transition={shouldAnimate ? { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } : undefined}
      className={className}
    >
      {children}
    </m.div>
  );
}

export default ScrollReveal;
