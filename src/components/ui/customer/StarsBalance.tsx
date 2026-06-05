"use client";

/**
 * StarsBalance — the loyalty balance, made felt.
 *
 * The loyalty engine mints Stars on delivery; most apps bury that in a number.
 * This renders the balance as a small constellation filling toward the next
 * reward, with an optional tier badge — status people actually want to glance
 * at. Presentational; feed it the current balance and the next reward target.
 */

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Star, Gift } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export interface StarsBalanceProps {
  /** Current Star balance. */
  stars: number;
  /** Stars required for the next reward milestone. */
  nextRewardAt: number;
  /** Optional tier name, e.g. "Moon". */
  tierLabel?: string;
  /** Max star glyphs to render in the constellation row. */
  maxGlyphs?: number;
  className?: string;
}

/** Count-up from 0 to `value`, honoring the motion preference. */
function useCountUp(value: number, enabled: boolean) {
  const [display, setDisplay] = useState(enabled ? 0 : value);

  useEffect(() => {
    if (!enabled) {
      setDisplay(value);
      return;
    }
    const duration = 600;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, enabled]);

  return display;
}

export function StarsBalance({
  stars,
  nextRewardAt,
  tierLabel,
  maxGlyphs = 7,
  className,
}: StarsBalanceProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const display = useCountUp(stars, shouldAnimate);

  const remaining = Math.max(0, nextRewardAt - stars);
  const reached = remaining === 0;
  const percent = nextRewardAt > 0 ? Math.min(100, (stars / nextRewardAt) * 100) : 0;

  // Constellation: one glyph per Star up to the next milestone, capped.
  const glyphCount = Math.min(maxGlyphs, Math.max(1, nextRewardAt));
  const filledGlyphs = Math.round((percent / 100) * glyphCount);

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-surface-primary/40 p-5 shadow-card backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <m.span
            key={display}
            className="font-display text-3xl font-bold tabular-nums text-text-primary"
          >
            {display}
          </m.span>
          <span className="font-body text-sm font-medium text-text-secondary">Stars</span>
        </div>

        {tierLabel && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            {tierLabel}
          </span>
        )}
      </div>

      {/* Constellation row */}
      <div className="mt-4 flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: glyphCount }).map((_, i) => {
          const isFilled = i < filledGlyphs;
          return (
            <m.span
              key={i}
              initial={shouldAnimate ? { scale: 0, opacity: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
              transition={{ ...getSpring(spring.ultraBouncy), delay: i * 0.06 }}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors duration-fast",
                  isFilled ? "fill-primary text-primary" : "text-text-muted/40"
                )}
              />
            </m.span>
          );
        })}
      </div>

      {/* Next-reward line */}
      <div className="mt-4 flex items-center gap-2 font-body text-sm">
        <Gift
          className={cn("h-4 w-4 shrink-0", reached ? "text-green" : "text-primary")}
          aria-hidden
        />
        <span className={cn("font-semibold", reached ? "text-green" : "text-text-primary")}>
          {reached
            ? "Reward unlocked — redeem it at checkout!"
            : `${remaining} more ${remaining === 1 ? "Star" : "Stars"} to your next reward`}
        </span>
      </div>
    </div>
  );
}

export default StarsBalance;
