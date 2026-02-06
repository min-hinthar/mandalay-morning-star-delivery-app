"use client";

/**
 * Hero Sub-Components
 *
 * AnimatedHeadline, StatItem, GradientFallback - used by Hero and HeroContent.
 */

import React from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// ANIMATED HEADLINE
// ============================================

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
}

export function AnimatedHeadline({ text, className }: AnimatedHeadlineProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const words = text.split(" ");

  if (!shouldAnimate) {
    return <h1 className={className}>{text}</h1>;
  }

  return (
    <m.h1
      className={cn("flex flex-wrap justify-center gap-x-3 gap-y-1", className)}
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <m.span
          key={`${word}-${index}`}
          className="inline-block"
          variants={{
            hidden: {
              opacity: 0,
              y: 40,
              rotateX: -90,
              // eslint-disable-next-line no-restricted-syntax -- FM animation interpolation requires numeric blur (~--blur-md)
              filter: "blur(10px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              // eslint-disable-next-line no-restricted-syntax -- FM animation interpolation requires numeric blur
              filter: "blur(0px)",
            },
          }}
          transition={getSpring(spring.rubbery)}
        >
          {word}
        </m.span>
      ))}
    </m.h1>
  );
}

// ============================================
// HERO STATS BAR
// ============================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay?: number;
}

export function StatItem({ icon, label, value, delay = 0 }: StatItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      className="flex items-center gap-3 px-4 py-2"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { ...getSpring(spring.default), delay } : undefined}
    >
      {/* MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes) */}
      <div className="p-2 rounded-full bg-hero-stat-bg sm:backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-xs text-hero-text-muted uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-hero-text">{value}</div>
      </div>
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
    <div className={cn("relative w-full min-h-[100svh] min-h-[100dvh] overflow-hidden", className)}>
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
        style={{ ['--tw-gradient-from' as string]: 'var(--hero-overlay)' }}
      />

      {/* Content layer */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 4 }}
      >
        {children}
      </div>
    </div>
  );
}
