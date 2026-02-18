"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <m.div
      whileHover={shouldAnimate ? { y: -8, scale: 1.02, transition: spring.snappy } : undefined}
      className={cn(
        "relative rounded-3xl p-6 md:p-8",
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile
        "bg-surface-primary dark:bg-gray-900 md:bg-surface-primary/85 md:dark:bg-surface-primary/70",
        "md:backdrop-blur-2xl",
        "border-2 border-white/40 dark:border-white/20",
        "shadow-[0_8px_32px_rgba(0,0,0,0.15),0_16px_48px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "hover:shadow-[0_16px_48px_rgba(0,0,0,0.2),0_24px_64px_rgba(0,0,0,0.15),0_0_60px_rgba(251,191,36,0.15)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-t-3xl" />
      {/* Inner glow layer */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
      {children}
    </m.div>
  );
}
