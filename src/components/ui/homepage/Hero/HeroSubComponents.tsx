"use client";

/**
 * Hero Sub-Components
 *
 * AnimatedHeadline, GradientFallback - used by Hero and HeroContent.
 */

import React from "react";
import { cn } from "@/lib/utils/cn";

// ============================================
// ANIMATED HEADLINE
// ============================================

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
  /** Word/phrase to render with a warm saffron gradient accent */
  highlight?: string;
}

export function AnimatedHeadline({ text, className, highlight }: AnimatedHeadlineProps) {
  const content =
    highlight && text.includes(highlight) ? (
      <>
        {text.slice(0, text.indexOf(highlight))}
        <span className="bg-gradient-to-r from-amber-200 via-secondary to-amber-300 bg-clip-text text-transparent">
          {highlight}
        </span>
        {text.slice(text.indexOf(highlight) + highlight.length)}
      </>
    ) : (
      text
    );

  return <h1 className={cn(className, "animate-fade-in-up")}>{content}</h1>;
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

      {/* Setting-sun glow — evokes a literal sunset at the horizon, flows into the next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(58% 80% at 50% 108%, rgba(254,215,170,0.55) 0%, rgba(251,146,60,0.34) 32%, rgba(244,114,182,0.12) 58%, transparent 74%)",
        }}
      />

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
