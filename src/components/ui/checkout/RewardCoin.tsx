"use client";

import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

interface RewardCoinProps {
  /** Coin face, e.g. "$5". */
  label: string;
  shouldAnimate: boolean;
  className?: string;
}

/**
 * Wax-seal reward coin — the goal you're earning toward, tying the
 * checkout/confirmation seal motif into the rewards card. Stamps in on mount,
 * with a hover/tap micro-interaction. (Milestone rewards are issued as coupons
 * server-side, so there is no client "ready" state to celebrate here — the
 * coupon wallet / confirmation owns that moment.)
 */
export function RewardCoin({ label, shouldAnimate, className }: RewardCoinProps) {
  return (
    <div className={cn("relative h-12 w-12", className)}>
      <m.div
        initial={shouldAnimate ? { scale: 0, rotate: -25 } : false}
        animate={{ scale: 1, rotate: -8 }}
        whileHover={{ scale: 1.1, rotate: -4 }}
        whileTap={{ scale: 0.94 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 420, damping: 15 }}
        className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2 border-hero-clay/55"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--hero-clay) 22%, transparent), color-mix(in srgb, var(--hero-clay) 6%, transparent) 72%)",
        }}
      >
        <HeroSunburst className="absolute h-10 w-10 text-hero-clay/35" rays={12} />
        <span className="relative font-display text-sm font-bold leading-none text-hero-accent">
          {label}
        </span>
      </m.div>
    </div>
  );
}
