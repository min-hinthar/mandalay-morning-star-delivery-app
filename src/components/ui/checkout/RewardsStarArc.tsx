"use client";

import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";

const SIZE = 124;
const R = 50;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;

interface RewardsStarArcProps {
  /** Lifetime Stars (center reel). */
  stars: number;
  /** Ticks lit in the current milestone cycle. */
  filled: number;
  /** Total ticks (milestone step). */
  total: number;
  /** Arc fill 0–100. */
  pct: number;
  /** Tier text-color class (drives arc + lit ticks via currentColor). */
  tierTextClass: string;
  tierEmoji: string;
  shouldAnimate: boolean;
}

/**
 * Circular Star gauge — a tier-tinted arc fills toward the next reward, with one
 * tick per order in the cycle (lit as completed) and the tier gem + live Stars
 * count glowing at the center. Entrance-only motion (arc draw, tick pops, gem
 * spring, Stars reel); reduced-motion renders the resolved end state.
 */
export function RewardsStarArc({
  stars,
  filled,
  total,
  pct,
  tierTextClass,
  tierEmoji,
  shouldAnimate,
}: RewardsStarArcProps) {
  const offset = C * (1 - pct / 100);
  const ticks = Array.from({ length: total }, (_, i) => {
    const angle = (-90 + (i * 360) / total) * (Math.PI / 180);
    return {
      i,
      x: CENTER + R * Math.cos(angle),
      y: CENTER + R * Math.sin(angle),
      lit: i < filled,
    };
  });

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={cn("block", tierTextClass)}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="var(--hero-line)"
          strokeWidth={7}
        />
        {/* Progress arc */}
        <m.circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={C}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          initial={shouldAnimate ? { strokeDashoffset: C } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Per-order ticks */}
        {ticks.map((t) => (
          <m.circle
            key={t.i}
            cx={t.x}
            cy={t.y}
            r={4.5}
            className={t.lit ? "fill-current" : "fill-[var(--hero-line)]"}
            stroke="var(--hero-card-bg)"
            strokeWidth={2}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={shouldAnimate ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + t.i * 0.08, type: "spring", stiffness: 400, damping: 16 }}
          />
        ))}
      </svg>

      {/* Center: tier gem + live Stars */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn("relative inline-grid place-items-center", tierTextClass)}>
          {/* Idle breath glow behind the gem (motion-safe) */}
          <span
            aria-hidden="true"
            className="rewards-pulse pointer-events-none absolute h-9 w-9 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, currentColor 32%, transparent), transparent 70%)",
            }}
          />
          <m.span
            aria-hidden="true"
            className="relative text-2xl leading-none"
            style={{
              filter: "drop-shadow(0 1px 5px color-mix(in srgb, currentColor 38%, transparent))",
            }}
            initial={shouldAnimate ? { scale: 0, rotate: -20 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 380, damping: 14 }}
          >
            {tierEmoji}
          </m.span>
        </span>
        <span className="mt-0.5 font-display text-xl font-bold leading-none text-hero-ink">
          <RollingNumber value={stars} animate={shouldAnimate} />
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
          Stars
        </span>
      </div>
    </div>
  );
}
