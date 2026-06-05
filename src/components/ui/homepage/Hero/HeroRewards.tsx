"use client";

/**
 * HeroRewards — Morning Star Rewards showcase (replaces the generic taglines).
 * Gem tier ladder (New Friend → Jade → Ruby → Gold) on a shimmer rail, an
 * illustrative tier-progress ring, and the earn line. Value-prop (no auth).
 */

import { m } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";

function TierRing({ animate }: { animate: boolean }) {
  return (
    <span className="relative inline-grid h-14 w-14 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--hero-line)" strokeWidth="3" />
        <m.circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="var(--hero-clay)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: animate ? 1.3 : 0, ease: "easeOut" }}
        />
      </svg>
      <Star className="absolute h-5 w-5 fill-amber-500 text-amber-500" />
    </span>
  );
}

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  const topReward = Math.round(
    (LOYALTY_TIERS[LOYALTY_TIERS.length - 1]?.rewardCents ?? 1200) / 100
  );

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl hero-surface-vellum px-5 py-6 md:px-8",
        className
      )}
    >
      <HeroCardLayers accent="clay" radius="rounded-3xl" />

      {/* Kicker */}
      <div className="relative mb-3 flex items-center justify-center gap-2 text-hero-accent">
        <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} />
        <span className="text-2xs font-semibold uppercase tracking-[0.2em] md:text-xs">
          Morning Star Rewards · ကြယ်ဆုလက်ဆောင်
        </span>
      </div>

      {/* Earn line + progress ring */}
      <div className="relative mb-5 flex items-center justify-center gap-4">
        <TierRing animate={shouldAnimate} />
        <p className="text-left text-base font-medium text-hero-ink md:text-lg">
          Earn a <span className="font-semibold text-hero-accent">Star</span> with every order — a
          thank-you reward every{" "}
          <span className="rounded bg-hero-card px-1 font-semibold text-hero-accent">5 orders</span>
          .
        </p>
      </div>

      {/* Gem tier ladder on a shimmer rail */}
      <div className="relative">
        <div className="absolute inset-x-6 top-5 h-1 overflow-hidden rounded-full bg-gradient-to-r from-hero-clay/30 via-hero-blue/30 to-hero-sage/40">
          {shouldAnimate && (
            <span className="animate-hero-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          )}
        </div>
        <ol className="relative flex items-start justify-between">
          {LOYALTY_TIERS.map((tier, i) => (
            <m.li
              key={tier.id}
              className="flex w-1/4 flex-col items-center gap-1 text-center"
              initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.8 } : undefined}
              whileInView={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 240, damping: 18 }}
            >
              <span className="hero-surface-paper grid h-10 w-10 place-items-center rounded-full text-lg">
                {tier.emoji}
              </span>
              <span className="text-2xs font-semibold text-hero-ink">{tier.english}</span>
              <span className="font-burmese text-[0.625rem] leading-tight text-hero-ink-muted">
                {tier.name}
              </span>
            </m.li>
          ))}
        </ol>
      </div>

      {/* Reward teaser */}
      <p className="relative mt-4 text-center text-sm text-hero-ink-muted">
        Climb the gem ladder — unlock up to{" "}
        <span className="font-semibold text-hero-accent">${topReward} off</span>.
      </p>
    </div>
  );
}
