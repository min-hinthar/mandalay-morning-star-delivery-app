"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type ParallaxDirection = "vertical" | "horizontal";

export interface ParallaxLayerProps {
  /** Content to parallax */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Parallax speed (0-1, higher = more movement) */
  speed?: number;
  /** Direction of parallax movement */
  direction?: ParallaxDirection;
  /** ScrollTrigger start position */
  start?: string;
  /** ScrollTrigger end position */
  end?: string;
  /** Scrub value for smoothness (1 = smooth, true = instant) */
  scrub?: number | boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * ParallaxLayer
 *
 * Creates a parallax scrolling effect for background elements.
 * Uses GSAP ScrollTrigger with scrub for smooth scroll-linked movement.
 *
 * @example
 * <div className="relative">
 *   <ParallaxLayer speed={0.3} className="absolute inset-0">
 *     <BackgroundImage />
 *   </ParallaxLayer>
 *   <div className="relative z-10">
 *     <MainContent />
 *   </div>
 * </div>
 */
export function ParallaxLayer({
  children,
  className,
  speed = 0.5,
  direction = "vertical",
  start = "top bottom",
  end = "bottom top",
  scrub = 1,
}: ParallaxLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  useGSAP(
    () => {
      if (!shouldAnimate || !containerRef.current || !elementRef.current) return;

      // Calculate parallax offset based on speed (0-1 range)
      // Higher speed = more movement relative to scroll
      const offset = speed * 30;

      gsap.to(elementRef.current, {
        yPercent: direction === "vertical" ? -offset : 0,
        xPercent: direction === "horizontal" ? -offset : 0,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start,
          end,
          scrub,
        },
      });
    },
    {
      scope: containerRef,
      dependencies: [shouldAnimate, speed, direction, start, end, scrub],
    }
  );

  // Skip animation setup if disabled, just render children
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("parallax-container overflow-hidden", className)}
    >
      <div ref={elementRef} className="parallax-layer will-change-transform">
        {children}
      </div>
    </div>
  );
}

export default ParallaxLayer;
