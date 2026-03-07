"use client";

/**
 * Hero Sub-Components
 *
 * AnimatedHeadline, StatItem, GradientFallback - used by Hero and HeroContent.
 */

import React from "react";
import { cn } from "@/lib/utils/cn";

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
}

export function StatItem({ icon, label, value, subValue }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 bg-hero-stat-bg/60 sm:backdrop-blur-md border border-hero-text/15 rounded-2xl p-4">
      {/* MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes) */}
      <div className="p-2.5 rounded-full bg-hero-stat-bg sm:backdrop-blur-sm">{icon}</div>
      <div className="text-left min-w-0">
        <div className="text-xs text-hero-text-muted uppercase tracking-wide">{label}</div>
        <div className="text-base font-bold text-hero-text leading-tight">{value}</div>
        {subValue && (
          <span className="block text-xs text-hero-text/50 font-body mt-0.5 truncate">
            {subValue}
          </span>
        )}
      </div>
    </div>
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
