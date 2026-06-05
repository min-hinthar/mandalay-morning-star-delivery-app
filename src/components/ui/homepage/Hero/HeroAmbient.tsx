"use client";

/**
 * HeroAmbient — layered Anthropic atmosphere behind the hero content.
 * Parallax dot-grids + morphing clay/blue/sage mesh orbs + drifting multi-grain
 * + a twinkling triad constellation. Driven by pointer / scroll / device tilt
 * via useHeroParallax. Fully decorative (pointer-events-none) + motion-gated.
 */

import { useRef, type CSSProperties } from "react";
import { m, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useHeroParallax } from "./interactions";

type MV = MotionValue<number>;

// ---- Parallax dot-grid layer ----
function ParallaxDots({
  x,
  y,
  scrollY,
  depth,
  scroll,
  className,
}: {
  x: MV;
  y: MV;
  scrollY: MV;
  depth: number;
  scroll: number;
  className?: string;
}) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(
    [y, scrollY] as [MV, MV],
    ([vy, vs]: number[]) => vy * depth + vs * scroll
  );
  return (
    <m.div
      aria-hidden="true"
      style={{ x: tx, y: ty }}
      className={cn("hero-dotgrid absolute -inset-16", className)}
    />
  );
}

// ---- Morphing mesh orb ----
interface OrbConfig {
  color: string;
  size: number;
  top: string;
  left: string;
  depth: number;
  delay: string;
}

function Orb({ x, y, cfg }: { x: MV; y: MV; cfg: OrbConfig }) {
  const tx = useTransform(x, (v) => v * cfg.depth);
  const ty = useTransform(y, (v) => v * cfg.depth);
  return (
    <m.div
      aria-hidden="true"
      className="absolute"
      style={{ x: tx, y: ty, top: cfg.top, left: cfg.left }}
    >
      <span
        className="hero-orb-morph block"
        style={{
          width: cfg.size,
          height: cfg.size,
          background: `radial-gradient(circle at 50% 50%, ${cfg.color}, transparent 70%)`,
          filter: "blur(var(--blur-3xl))",
          animationDelay: cfg.delay,
          opacity: 0.5,
        }}
      />
    </m.div>
  );
}

const ORBS: OrbConfig[] = [
  { color: "var(--hero-clay)", size: 380, top: "8%", left: "4%", depth: 30, delay: "0s" },
  { color: "var(--hero-blue)", size: 320, top: "48%", left: "66%", depth: 46, delay: "-7s" },
  { color: "var(--hero-sage)", size: 280, top: "70%", left: "16%", depth: 20, delay: "-13s" },
];

// ---- Twinkling triad constellation (deterministic) ----
const STAR_COLORS = ["bg-hero-clay", "bg-hero-blue", "bg-hero-sage"];
const STARS = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  return {
    top: `${8 + r(1) * 84}%`,
    left: `${5 + r(2) * 90}%`,
    size: 3 + Math.round(r(3) * 3),
    color: STAR_COLORS[i % 3],
    dur: `${3 + r(4) * 4}s`,
    delay: `${r(5) * 4}s`,
  };
});

export function HeroAmbient() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y, scrollY } = useHeroParallax(ref);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Morphing mesh orbs */}
      {ORBS.map((cfg) => (
        <Orb key={cfg.color + cfg.top} x={x} y={y} cfg={cfg} />
      ))}

      {/* Parallax dot-grids (two depths) */}
      <ParallaxDots
        x={x}
        y={y}
        scrollY={scrollY}
        depth={26}
        scroll={0.05}
        className="opacity-40 mix-blend-soft-light"
      />
      <ParallaxDots
        x={x}
        y={y}
        scrollY={scrollY}
        depth={54}
        scroll={0.12}
        className="opacity-30 mix-blend-soft-light [background-size:30px_30px]"
      />

      {/* Drifting multi-grain */}
      <div className="hero-paper-grain hero-grain-drift-slow absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      <div className="hero-paper-grain hero-grain-drift-rev absolute -inset-10 opacity-[0.04] mix-blend-soft-light" />

      {/* Twinkling constellation */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className={cn("hero-twinkle absolute rounded-full", s.color)}
          style={
            {
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              "--twinkle-dur": s.dur,
              "--twinkle-delay": s.delay,
            } as CSSProperties
          }
        />
      ))}

      {/* Soft vignette to seat the layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 28%, transparent 55%, rgba(20,20,19,0.16) 100%)",
        }}
      />
    </div>
  );
}
