"use client";

import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

interface RewardCoinProps {
  /** Coin face, e.g. "$5". */
  label: string;
  /** Reward unlocked for this order → ignite. */
  ready: boolean;
  shouldAnimate: boolean;
  className?: string;
}

/**
 * Wax-seal reward coin — ties the checkout/confirmation seal motif to the
 * rewards card. Stamps in on mount; when the reward is ready it ignites (vivid
 * clay fill + one-shot expanding ring). Muted/outlined while still being earned.
 */
export function RewardCoin({ label, ready, shouldAnimate, className }: RewardCoinProps) {
  return (
    <div className={cn("relative h-12 w-12", className)}>
      {/* Ignite ring — one-shot when the reward unlocks */}
      {ready && shouldAnimate && (
        <m.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-hero-clay"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
        />
      )}
      <m.div
        initial={shouldAnimate ? { scale: 0, rotate: -25 } : false}
        animate={{ scale: 1, rotate: ready ? -8 : 0 }}
        whileHover={{ scale: 1.1, rotate: ready ? -4 : 4 }}
        whileTap={{ scale: 0.94 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 420, damping: 15 }}
        className={cn(
          "relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2",
          ready ? "border-hero-clay/70" : "border-hero-line"
        )}
        style={{
          background: ready
            ? "radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--hero-clay) 30%, transparent), color-mix(in srgb, var(--hero-clay) 8%, transparent) 72%)"
            : "radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--hero-ink) 7%, transparent), transparent 72%)",
        }}
      >
        <HeroSunburst
          className={cn("absolute h-10 w-10", ready ? "text-hero-clay/40" : "text-hero-ink/10")}
          rays={12}
        />
        <span
          className={cn(
            "relative font-display text-sm font-bold leading-none",
            ready ? "text-hero-accent" : "text-hero-ink-muted"
          )}
        >
          {label}
        </span>
      </m.div>
    </div>
  );
}
