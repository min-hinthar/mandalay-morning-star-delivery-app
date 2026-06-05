"use client";

/**
 * HeroFactChips — vibrant frosted "fact" chips (delivery days, free threshold,
 * coverage, rating). Triad-accented icons, auto sheen, pointer tilt, tap ripple,
 * scroll-reveal. Reduced-motion safe.
 */

import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useTilt, useRipple } from "./interactions";

type ChipAccent = "clay" | "blue" | "sage" | "amber";

const ACCENT_TEXT: Record<ChipAccent, string> = {
  clay: "text-hero-clay",
  blue: "text-hero-blue",
  sage: "text-hero-sage",
  amber: "text-amber-500",
};

export interface FactChip {
  icon: LucideIcon;
  label: string;
  sub?: string;
  accent: ChipAccent;
}

function Chip({ chip, index }: { chip: FactChip; index: number }) {
  const { shouldAnimate } = useAnimationPreference();
  const tilt = useTilt(9);
  const { ripples, onPointerDown } = useRipple();
  const Icon = chip.icon;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ delay: 0.05 * index, type: "spring", stiffness: 220, damping: 20 }}
      whileHover={shouldAnimate ? { y: -3 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.96 } : undefined}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      onPointerDown={onPointerDown}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 500 }}
      className="hero-surface-paper relative inline-flex items-center gap-2 overflow-hidden rounded-full px-3.5 py-2"
    >
      {shouldAnimate && (
        <span
          aria-hidden="true"
          className="animate-hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          style={{ animationDelay: `${index * 0.7}s` }}
        />
      )}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          aria-hidden="true"
          className="animate-hero-ripple pointer-events-none absolute h-14 w-14 rounded-full bg-hero-clay/25"
          style={{ left: rp.x, top: rp.y }}
        />
      ))}
      <Icon className={cn("h-4 w-4 shrink-0", ACCENT_TEXT[chip.accent])} aria-hidden="true" />
      <span className="relative text-sm font-semibold text-hero-ink">{chip.label}</span>
      {chip.sub && (
        <span className="relative text-xs font-medium text-hero-ink-muted">{chip.sub}</span>
      )}
    </m.div>
  );
}

export function HeroFactChips({ chips, className }: { chips: FactChip[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2.5", className)}>
      {chips.map((c, i) => (
        <Chip key={c.label} chip={c} index={i} />
      ))}
    </div>
  );
}
