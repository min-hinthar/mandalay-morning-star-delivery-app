"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapDuration, gsapEase } from "@/lib/gsap/presets";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type RevealDirection = "up" | "down" | "left" | "right";

export interface RevealOnScrollProps {
  /** Content to reveal */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Direction to reveal from */
  direction?: RevealDirection;
  /** Animation delay (seconds) */
  delay?: number;
  /** Travel distance in pixels */
  distance?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Animate only once (won't reverse on scroll back) */
  once?: boolean;
  /** ScrollTrigger start position */
  start?: string;
}

// ============================================
// HELPERS
// ============================================

function getDirectionOffset(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: distance };
  }
}

// ============================================
// COMPONENT
// ============================================

/**
 * RevealOnScroll
 *
 * Individual reveal component that animates content into view on scroll.
 * Uses GSAP ScrollTrigger for performant scroll-linked animations.
 *
 * @example
 * <RevealOnScroll direction="left" delay={0.2}>
 *   <Card>Content slides in from left</Card>
 * </RevealOnScroll>
 */
export function RevealOnScroll({
  children,
  className,
  direction = "up",
  delay = 0,
  distance = 40,
  duration = gsapDuration.normal,
  once = true,
  start = "top 85%",
}: RevealOnScrollProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  useGSAP(
    () => {
      if (!shouldAnimate || !elementRef.current) return;

      const { x, y } = getDirectionOffset(direction, distance);

      gsap.from(elementRef.current, {
        x,
        y,
        opacity: 0,
        duration,
        ease: gsapEase.default,
        delay,
        scrollTrigger: {
          trigger: elementRef.current,
          start,
          toggleActions: once
            ? "play none none none" // Play once, never reverse
            : "play none none reverse", // Play/reverse on scroll
        },
      });
    },
    {
      scope: elementRef,
      dependencies: [shouldAnimate, direction, delay, distance, duration, once, start],
    }
  );

  // Skip animation setup if disabled, just render children
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={elementRef} className={cn("reveal-on-scroll", className)}>
      {children}
    </div>
  );
}

export default RevealOnScroll;
