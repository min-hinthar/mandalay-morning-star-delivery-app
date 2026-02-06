"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export function AnimatedCheckmark() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { scale: 0 } : undefined}
      animate={shouldAnimate ? { scale: 1 } : undefined}
      transition={getSpring(spring.ultraBouncy)}
      className="relative"
    >
      {/* Outer glow */}
      <m.div
        animate={shouldAnimate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.2, 0.5],
        } : undefined}
        transition={{
          duration: 2,
          repeat: 5,
        }}
        className="absolute inset-0 rounded-full bg-green/30"
      />

      {/* Circle background */}
      <m.div
        initial={shouldAnimate ? { scale: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1 } : undefined}
        transition={{ ...getSpring(spring.ultraBouncy), delay: 0.2 }}
        className={cn(
          "relative w-24 h-24 rounded-full",
          "bg-gradient-to-br from-green to-accent-green-hover",
          "flex items-center justify-center",
          "shadow-xl shadow-green/30"
        )}
      >
        {/* Checkmark SVG */}
        <svg
          className="w-12 h-12 text-text-inverse"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <m.path
            d="M5 12l5 5L20 7"
            initial={shouldAnimate ? { pathLength: 0 } : undefined}
            animate={shouldAnimate ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </m.div>
    </m.div>
  );
}
