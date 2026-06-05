"use client";

/**
 * ScrollProgress — slim triad gradient bar tracking page scroll progress.
 */

import { m, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <m.div
      aria-hidden="true"
      className="fixed left-0 top-0 h-1 w-full origin-left bg-gradient-to-r from-hero-clay via-hero-blue to-hero-sage"
      // eslint-disable-next-line no-restricted-syntax -- fixed global progress bar above content
      style={{ scaleX, zIndex: 65 }}
    />
  );
}
