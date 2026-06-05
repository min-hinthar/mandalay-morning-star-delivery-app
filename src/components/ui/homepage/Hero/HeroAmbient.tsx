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

// ---- Parallax grid layer (dots or lines) ----
function ParallaxGrid({
  x,
  y,
  depth,
  base,
  gridStyle,
  className,
}: {
  x: MV;
  y: MV;
  depth: number;
  base: "hero-dotgrid" | "hero-linegrid";
  gridStyle?: CSSProperties;
  className?: string;
}) {
  // Pointer/gyro parallax only — no scroll-linked translate (avoids dizziness).
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <m.div
      aria-hidden="true"
      style={{ x: tx, y: ty, ...gridStyle }}
      className={cn(base, "absolute -inset-16", className)}
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

// Faint links between constellation dots
const CONSTELLATION: [number, number][] = [
  [0, 3],
  [3, 7],
  [7, 11],
  [1, 5],
  [5, 9],
  [2, 6],
  [8, 12],
  [11, 14],
];

export function HeroAmbient() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useHeroParallax(ref);
  const spotX = useTransform(x, (v) => `${(0.5 + v) * 100}%`);
  const spotY = useTransform(y, (v) => `${(0.5 + v) * 100}%`);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Living aurora ribbons (drift + breathe, two layers) */}
      <div
        className="hero-aurora absolute left-0 top-[16%] h-[46%] w-full"
        style={{
          background:
            "linear-gradient(100deg, transparent, var(--hero-clay), var(--hero-sage), var(--hero-blue), transparent)",
          filter: "blur(var(--blur-3xl))",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="hero-aurora-2 absolute left-0 top-[40%] h-[40%] w-full"
        style={{
          background:
            "linear-gradient(80deg, transparent, var(--hero-blue), var(--hero-clay), transparent)",
          filter: "blur(var(--blur-3xl))",
          mixBlendMode: "screen",
        }}
      />

      {/* Morphing mesh orbs */}
      {ORBS.map((cfg) => (
        <Orb key={cfg.color + cfg.top} x={x} y={y} cfg={cfg} />
      ))}

      {/* Calm, layered, masked grids — pointer/gyro parallax only (no scroll dizziness) */}
      <ParallaxGrid
        x={x}
        y={y}
        depth={14}
        base="hero-dotgrid"
        className="opacity-50"
        gridStyle={
          {
            "--dot-color": "rgba(250, 249, 245, 0.42)",
            "--dot-gap": "26px",
            "--dot-r": "1.2px",
            maskImage: "radial-gradient(125% 95% at 50% 32%, transparent 26%, #000 72%)",
            WebkitMaskImage: "radial-gradient(125% 95% at 50% 32%, transparent 26%, #000 72%)",
          } as CSSProperties
        }
      />
      <ParallaxGrid
        x={x}
        y={y}
        depth={24}
        base="hero-linegrid"
        className="opacity-40"
        gridStyle={
          {
            "--line-color": "rgba(217, 119, 87, 0.14)",
            "--line-gap": "58px",
            maskImage: "linear-gradient(120deg, #000, transparent 68%)",
            WebkitMaskImage: "linear-gradient(120deg, #000, transparent 68%)",
          } as CSSProperties
        }
      />
      <ParallaxGrid
        x={x}
        y={y}
        depth={34}
        base="hero-dotgrid"
        className="opacity-[0.35]"
        gridStyle={
          {
            "--dot-color": "rgba(120, 140, 93, 0.4)",
            "--dot-gap": "46px",
            "--dot-r": "1.6px",
            maskImage: "radial-gradient(80% 70% at 82% 78%, #000, transparent 70%)",
            WebkitMaskImage: "radial-gradient(80% 70% at 82% 78%, #000, transparent 70%)",
          } as CSSProperties
        }
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

      {/* Constellation links between dots */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CONSTELLATION.map(([a, b], i) => (
          <m.line
            key={i}
            x1={parseFloat(STARS[a].left)}
            y1={parseFloat(STARS[a].top)}
            x2={parseFloat(STARS[b].left)}
            y2={parseFloat(STARS[b].top)}
            stroke="rgba(250,249,245,0.55)"
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0.06 }}
            animate={{ opacity: [0.06, 0.22, 0.06] }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          />
        ))}
      </svg>

      {/* Soft vignette to seat the layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 28%, transparent 55%, rgba(20,20,19,0.16) 100%)",
        }}
      />

      {/* Cursor spotlight — soft light that follows the pointer, revealing the
          grids/orbs/grain beneath it */}
      <m.div
        className="absolute h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
        style={{
          left: spotX,
          top: spotY,
          background:
            "radial-gradient(circle, rgba(255,247,237,0.30), rgba(217,119,87,0.12) 38%, transparent 68%)",
        }}
      />
    </div>
  );
}
