/**
 * HeroCardLayers — stacked Anthropic card-backdrop textures.
 * Drop inside any positioned (relative) card: dot-grid backdrop + paper grain
 * + editorial corner ticks + a triad edge-glow. All decorative + clip to the
 * card's radius. Accent cycles clay / blue / sage.
 */

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type Accent = "clay" | "blue" | "sage";

const ACCENT: Record<Accent, { text: string; ring: string; varName: string }> = {
  clay: { text: "text-hero-clay", ring: "ring-hero-clay/25", varName: "--hero-clay" },
  blue: { text: "text-hero-blue", ring: "ring-hero-blue/25", varName: "--hero-blue" },
  sage: { text: "text-hero-sage", ring: "ring-hero-sage/25", varName: "--hero-sage" },
};

interface HeroCardLayersProps {
  accent?: Accent;
  /** Tailwind rounded-* class matching the host card */
  radius?: string;
  dots?: boolean;
  grain?: boolean;
  ticks?: boolean;
  glow?: boolean;
  className?: string;
}

export function HeroCardLayers({
  accent = "clay",
  radius = "rounded-2xl",
  dots = true,
  grain = true,
  ticks = true,
  glow = true,
  className,
}: HeroCardLayersProps) {
  const a = ACCENT[accent];

  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {dots && (
        <span
          className={cn("hero-dotgrid absolute inset-0 opacity-[0.55]", radius)}
          style={
            {
              "--dot-color": "rgba(20,20,19,0.11)",
              "--dot-gap": "14px",
              "--dot-r": "1px",
            } as CSSProperties
          }
        />
      )}
      {grain && (
        <span
          className={cn(
            "hero-paper-grain absolute inset-0 opacity-[0.13] mix-blend-multiply",
            radius
          )}
        />
      )}
      {glow && (
        <>
          <span className={cn("absolute inset-0 ring-1 ring-inset", radius, a.ring)} />
          <span
            className={cn("absolute inset-0 opacity-[0.14]", radius)}
            style={{
              background: `radial-gradient(75% 60% at 12% 0%, var(${a.varName}), transparent 70%)`,
            }}
          />
        </>
      )}
      {ticks && (
        <span className={cn("absolute inset-2 opacity-60", a.text)}>
          <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-current" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-current" />
          <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-current" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-current" />
        </span>
      )}
    </span>
  );
}
