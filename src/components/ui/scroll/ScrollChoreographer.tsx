"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapDuration, gsapEase } from "@/lib/gsap/presets";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface ScrollChoreographerProps {
  /** Content to wrap */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Stagger delay between items (seconds) */
  stagger?: number;
  /** CSS selector for animated items */
  selector?: string;
  /** Initial Y offset for animation */
  yOffset?: number;
  /** ScrollTrigger start position */
  start?: string;
  /** Toggle actions for scroll triggers */
  toggleActions?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * ScrollChoreographer
 *
 * Container that orchestrates GSAP ScrollTrigger animations for children.
 * Children with the specified selector class will animate on scroll.
 *
 * @example
 * <ScrollChoreographer stagger={0.08}>
 *   <div className="scroll-item">Item 1</div>
 *   <div className="scroll-item">Item 2</div>
 *   <div className="scroll-item">Item 3</div>
 * </ScrollChoreographer>
 */
export function ScrollChoreographer({
  children,
  className,
  stagger = 0.06,
  selector = ".scroll-item",
  yOffset = 40,
  start = "top 85%",
  toggleActions = "play none none reverse",
}: ScrollChoreographerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  useGSAP(
    () => {
      if (!shouldAnimate || !containerRef.current) return;

      const items = gsap.utils.toArray<HTMLElement>(selector, containerRef.current);

      if (items.length === 0) return;

      items.forEach((item, i) => {
        gsap.from(item, {
          y: yOffset,
          opacity: 0,
          duration: gsapDuration.normal,
          ease: gsapEase.default,
          delay: i * stagger,
          scrollTrigger: {
            trigger: item,
            start,
            toggleActions,
          },
        });
      });

      // Cleanup is handled automatically by useGSAP with scope
    },
    {
      scope: containerRef,
      dependencies: [shouldAnimate, selector, stagger, yOffset, start, toggleActions],
    }
  );

  // Skip animation setup if disabled, just render children
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn("scroll-choreographer", className)}>
      {children}
    </div>
  );
}

// Re-export ScrollTrigger for convenience if needed externally
export { ScrollTrigger };

export default ScrollChoreographer;
