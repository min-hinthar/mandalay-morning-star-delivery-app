"use client";

/**
 * Hero Sub-Components
 *
 * AnimatedHeadline, StatItem, GradientFallback - used by Hero and HeroContent.
 */

import React from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// ANIMATED HEADLINE
// ============================================

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
}

export function AnimatedHeadline({ text, className }: AnimatedHeadlineProps) {
  return <h1 className={cn(className, "animate-fade-in-up")}>{text}</h1>;
}

// ============================================
// HERO STATS BAR
// ============================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  index?: number;
}

export function StatItem({ icon, label, value, subValue, index = 0 }: StatItemProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <m.div
      className="relative"
      initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { delay: 0.1 * index, ...spring.gentle } : undefined}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-2xl bg-secondary/8 blur-xl" aria-hidden="true" />
      <m.div
        className={cn(
          "relative flex items-start gap-3 rounded-2xl p-4",
          "bg-hero-stat-bg/70 sm:backdrop-blur-md",
          "border border-hero-text/25",
          "shadow-md shadow-black/10",
          "transition-shadow duration-300 hover:shadow-xl hover:shadow-black/15"
        )}
        whileHover={shouldAnimate ? { scale: 1.04, y: -3 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={spring.snappy}
      >
        {/* MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes) */}
        <m.div
          className="p-2.5 rounded-full bg-hero-stat-bg/80 sm:backdrop-blur-sm ring-1 ring-secondary/20"
          whileHover={shouldAnimate ? { rotate: 8, scale: 1.1 } : undefined}
          animate={shouldAnimate ? { scale: [1, 1.08, 1] } : undefined}
          transition={shouldAnimate ? { duration: 3, repeat: Infinity, repeatDelay: 5 } : undefined}
        >
          {icon}
        </m.div>
        <div className="text-left">
          <div className="text-xs text-hero-text-muted uppercase tracking-wide">{label}</div>
          <div className="text-xs md:text-sm font-bold text-hero-text leading-tight">{value}</div>
          {subValue && (
            <span className="block text-xs text-hero-text/60 font-body mt-0.5">{subValue}</span>
          )}
        </div>
      </m.div>
    </m.div>
  );
}

// ============================================
// GRADIENT FALLBACK BACKGROUND
// ============================================

interface GradientFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientFallback({ children, className }: GradientFallbackProps) {
  return (
    <div className={cn("relative w-full min-h-[100svh] min-h-[100dvh]", className)}>
      {/* Muted warm gradient background */}
      <div
        className="absolute inset-0 hero-gradient-transition"
        style={{
          background: `linear-gradient(180deg, var(--hero-bg-end) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-start) 100%)`,
        }}
      />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 animate-hero-shimmer"
          style={{
            background: `linear-gradient(45deg, transparent 40%, var(--hero-shimmer) 50%, transparent 60%)`,
            width: "200%",
            height: "200%",
            top: "-50%",
            left: "-50%",
          }}
        />
      </div>

      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-secondary/15 via-transparent to-transparent" />

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
        style={{ ["--tw-gradient-from" as string]: "var(--hero-overlay)" }}
      />

      {/* Content layer */}
      <div
        className="relative flex flex-col items-center justify-center min-h-[100svh] min-h-[100dvh]"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 5 }}
      >
        {children}
      </div>
    </div>
  );
}
