"use client";

/**
 * RewardsRailNode — one loyalty tier in the horizontal Rewards Rail: an emoji in
 * a warm-paper faceted disc (rotating facet sheen + gentle float), a per-tier
 * radial glow, magnetic hover, and a small label below. Compact horizontal
 * sibling of the arc TierNode, sized for the slim rail; the label sits in normal
 * flow (not absolute) so the track keeps its height. Glow is a gradient falloff
 * (no blur). Extracted so each node owns its own `useMagnetic` (hooks can't run
 * inside a map).
 */

import { type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useMagnetic } from "./interactions";
import { HeroSunburst } from "./HeroSunburst";

const FACET =
  "conic-gradient(from 140deg, transparent, rgba(255,255,255,0.5), transparent 40%, rgba(255,255,255,0.28), transparent 75%)";

interface RewardsRailNodeProps {
  emoji: string;
  english: string;
  my: string;
  ring: string;
  glow: string;
  glowSize: number;
  isGold: boolean;
  isActive: boolean;
  earned: boolean;
  /** Whether continuous loops may run (shouldAnimate && stage in view). */
  loop: boolean;
  index: number;
  ariaLabel: string;
  /** Pointer hover — updates the visible panel only (no SR announce). */
  onHover: () => void;
  /** Keyboard focus — intentional, so it announces to the sr-only live region. */
  onFocus: () => void;
  onSelect: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function RewardsRailNode({
  emoji,
  english,
  my,
  ring,
  glow,
  glowSize,
  isGold,
  isActive,
  earned,
  loop,
  index,
  ariaLabel,
  onHover,
  onFocus,
  onSelect,
}: RewardsRailNodeProps) {
  const mag = useMagnetic(0.22);

  return (
    <m.button
      type="button"
      aria-pressed={isActive}
      aria-label={ariaLabel}
      onPointerEnter={onHover}
      onFocus={onFocus}
      onClick={onSelect}
      onPointerMove={mag.onPointerMove}
      onPointerLeave={mag.onPointerLeave}
      style={{ x: mag.x, y: mag.y }}
      className="group relative flex flex-col items-center gap-1.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/60"
    >
      <span className="relative grid place-items-center">
        {/* Soft radial glow (no blur — gradient falloff); pulses only when active */}
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: glowSize,
            height: glowSize,
            background: `radial-gradient(circle, ${glow} 0%, transparent 66%)`,
          }}
          animate={
            loop && isActive
              ? { opacity: [0.5, 0.85, 0.5] }
              : { opacity: isActive ? 0.75 : earned ? 0.42 : 0.16 }
          }
          transition={
            loop && isActive
              ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />

        {/* Sunburst rays behind the Gold apex */}
        {isGold && (
          <HeroSunburst
            className={cn(
              "pointer-events-none absolute h-12 w-12 text-amber-500 transition-opacity duration-300",
              isActive ? "opacity-80" : "opacity-50"
            )}
            rays={12}
          />
        )}

        {/* Faceted gem disc with the tier emoji — disc stays opaque so the emoji
            reads crisp; non-active tiers recede via glow/ring, never a faded disc. */}
        <span
          className={cn(
            "hero-gem-float relative grid h-11 w-11 place-items-center overflow-hidden rounded-full ring-2 hero-surface-paper md:h-[3.25rem] md:w-[3.25rem]",
            ring,
            isActive ? "ring-[3px]" : "ring-2"
          )}
          style={
            {
              "--gem-dur": `${3.6 + index * 0.5}s`,
              "--gem-delay": `${index * 0.35}s`,
            } as CSSProperties
          }
        >
          <span
            aria-hidden="true"
            className="hero-gem-spin absolute inset-0 opacity-20 mix-blend-overlay"
            style={{ background: FACET }}
          />
          <span className="relative text-xl md:text-2xl">{emoji}</span>
        </span>
      </span>

      {/* Label below (normal flow) */}
      <span className="flex flex-col items-center leading-none">
        <span
          className={cn(
            "text-2xs font-semibold transition-colors md:text-xs",
            isActive ? "text-hero-accent" : "text-hero-ink"
          )}
        >
          {english}
        </span>
        <span className="mt-0.5 font-burmese text-[0.7rem] leading-snug text-hero-ink/55">
          {my}
        </span>
      </span>
    </m.button>
  );
}
