"use client";

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface ConnectorProps {
  index: number;
  orientation: "horizontal" | "vertical";
}

export function Connector({ index, orientation }: ConnectorProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);
  // Fixed: once: true to prevent infinite update loops
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  if (orientation === "horizontal") {
    return (
      <div ref={ref} className="hidden md:flex items-center justify-center w-16 lg:w-20">
        <div className="relative h-1 w-full bg-border/20 rounded-full overflow-hidden">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-sm bg-gradient-to-r from-amber-400/30 to-orange-400/30" />

          {/* Animated fill */}
          <m.div
            className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full"
            initial={{ scaleX: 0 }}
            animate={isInView && shouldAnimate ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.2 }}
            style={{ transformOrigin: "left" }}
          />

          {/* Traveling light dot */}
          <m.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{ left: "0%", opacity: 0 }}
            animate={
              isInView && shouldAnimate
                ? { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }
                : { opacity: 0 }
            }
            transition={{ duration: 1.5, delay: 0.8 + index * 0.2, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  // Vertical connector for mobile
  return (
    <div
      ref={ref}
      className="md:hidden w-1 h-10 mx-auto bg-border/20 rounded-full overflow-hidden my-3 relative"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 blur-sm bg-gradient-to-b from-amber-400/30 to-orange-400/30" />

      <m.div
        className="absolute inset-0 bg-gradient-to-b from-amber-400 via-orange-400 to-rose-400 rounded-full"
        initial={{ scaleY: 0 }}
        animate={isInView && shouldAnimate ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
        style={{ transformOrigin: "top" }}
      />

      {/* Traveling light dot */}
      <m.div
        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        initial={{ top: "0%", opacity: 0 }}
        animate={
          isInView && shouldAnimate
            ? { top: ["0%", "100%"], opacity: [0, 1, 1, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 1, delay: 0.6 + index * 0.15, ease: "easeInOut" }}
      />
    </div>
  );
}
