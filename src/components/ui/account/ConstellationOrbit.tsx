"use client";

/**
 * ConstellationOrbit — a ring of small stars circling the loyalty passport's
 * tier crest. The number of LIT stars mirrors the passport's reward-cycle
 * progress EXACTLY (`progressInCycle` of `milestoneStep`, the same source the
 * progress bar reads) — real data only, never fabricated.
 *
 * One slow framer rotation animates the whole GROUP (24s linear), gated by
 * `shouldAnimate && useInView` so it's a static ring under reduced motion and
 * stops ticking when it scrolls offscreen (the .hero-anim-paused CSS gate can't
 * reach a framer JS loop — see CLAUDE.md). Decorative + a11y-inert: the Stars
 * count is announced by the passport's own `sr-only` value, so this is purely
 * `aria-hidden`. Constant hero-jewel tint reads on the cream card in both themes.
 */

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface ConstellationOrbitProps {
  /** Stars earned in the current reward cycle (lit). */
  litCount: number;
  /** Stars per reward cycle (total positions on the ring). */
  totalCount: number;
  /** Constant hero-jewel text token for the lit stars (e.g. "text-hero-clay"). */
  accentClass: string;
  /** Orbit radius in px (distance of each star from the ring center). */
  radius?: number;
}

export function ConstellationOrbit({
  litCount,
  totalCount,
  accentClass,
  radius = 42,
}: ConstellationOrbitProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "0px" });
  const { shouldAnimate } = useAnimationPreference();

  // Defensive clamps: never render a degenerate ring or more lit than total.
  const total = Math.max(0, Math.min(totalCount, 12));
  const lit = Math.max(0, Math.min(litCount, total));
  if (total <= 0) return null;

  // Single rotating group → one JS loop (not N animated stars). Only spin when
  // both motion is allowed AND the ring is on screen.
  const spinning = shouldAnimate && inView;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <m.span
        className="absolute inset-0"
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spinning
            ? { duration: 24, ease: "linear", repeat: Infinity }
            : { duration: 0 }
        }
        style={{ transformOrigin: "50% 50%" }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const angle = (i / total) * 360;
          const isLit = i < lit;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                // Place each star on the circle (radius px out), then counter-
                // rotate it back so the glyph stays upright as the group spins.
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`,
              }}
            >
              <Star
                className={cn(
                  "h-2 w-2",
                  isLit
                    ? cn("fill-current", accentClass)
                    : "fill-hero-ink/10 text-hero-ink/15"
                )}
              />
            </span>
          );
        })}
      </m.span>
    </span>
  );
}

export default ConstellationOrbit;
