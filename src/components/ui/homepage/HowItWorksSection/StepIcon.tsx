"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Step } from "./variants";

interface StepIconProps {
  step: Step;
  index: number;
}

export function StepIcon({ step, index }: StepIconProps) {
  const { shouldAnimate } = useAnimationPreference();
  const Icon = step.icon;

  return (
    <m.div
      className={cn(
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center",
        "border-2 md:backdrop-blur-lg",
        "bg-surface-primary md:bg-gradient-to-br md:from-surface-primary/60 md:to-surface-primary/40",
        step.iconBorder,
        "shadow-[0_4px_16px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.08)]"
      )}
      whileHover={
        shouldAnimate
          ? { scale: 1.1, transition: spring.snappy }
          : undefined
      }
      whileTap={shouldAnimate ? { scale: 0.95, transition: spring.snappy } : undefined}
    >
      {/* Background glow */}
      <div className={cn("absolute inset-0 rounded-2xl", step.iconBg, "opacity-40")} />

      {/* Larger icon */}
      <Icon className={cn("w-9 h-9 md:w-10 md:h-10 relative z-10", step.color)} strokeWidth={2} />

      {/* Enhanced step number badge */}
      <span
        className={cn(
          "absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center",
          "font-display font-black text-sm",
          "bg-surface-primary text-text-primary",
          "border-2 border-white/60",
          "shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        )}
      >
        {index + 1}
      </span>
    </m.div>
  );
}
