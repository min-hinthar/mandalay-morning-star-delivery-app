"use client";

import { Star } from "lucide-react";
import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/currency";
import type { LoyaltyTierId } from "@/lib/loyalty";
import { ordersToReward, ordersToTier } from "@/lib/loyalty/copy";
import { tierAccent } from "./tierStyle";

interface TierInfo {
  id: LoyaltyTierId;
  name: string;
  english: string;
  emoji: string;
}

interface StarsProgressProps {
  stars: number;
  milestoneStep: number;
  ordersToNext: number;
  progressInCycle: number;
  nextRewardCents: number;
  tier: TierInfo;
  nextTier: (TierInfo & { minOrders: number }) | null;
  ordersToNextTier: number | null;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Animated Stars ring — lifetime Stars in the center, the arc (tinted by tier)
 * fills toward the next reward, with the current tier badge and the climb to
 * the next gem.
 */
export function StarsProgress({
  stars,
  milestoneStep,
  ordersToNext,
  progressInCycle,
  nextRewardCents,
  tier,
  nextTier,
  ordersToNextTier,
}: StarsProgressProps) {
  const { shouldAnimate } = useAnimationPreference();
  const fraction = progressInCycle / milestoneStep;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const reward = formatPrice(nextRewardCents);
  const accent = tierAccent(tier.id);
  const progressCopy = ordersToReward(ordersToNext, reward);
  const ringLabel = `${stars} Stars. ${progressCopy.en}. Current tier: ${tier.english}.`;

  return (
    <section
      aria-label="Morning Star Rewards progress"
      className="rounded-card bg-gradient-to-br from-primary/5 to-accent-orange/10 border border-primary/15 p-6"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {/* Ring — exposed to AT as a single labeled image */}
        <div className="relative h-36 w-36 shrink-0" role="img" aria-label={ringLabel}>
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
            <circle
              className="stroke-current text-border-subtle"
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
            />
            <m.circle
              className={cn("stroke-current", accent.text)}
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={shouldAnimate ? { strokeDashoffset: CIRCUMFERENCE } : false}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0, 0.7, 0.2, 1] }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            aria-hidden="true"
          >
            <Star className={cn("h-5 w-5 fill-current", accent.text)} />
            <span className="mt-0.5 text-3xl font-bold leading-none text-text-primary">
              {stars}
            </span>
            <span className="text-xs text-text-secondary">Stars</span>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h3 className="text-lg font-semibold text-text-primary">Morning Star Rewards</h3>
          </div>

          {/* Current tier badge */}
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
              accent.bg,
              accent.text
            )}
          >
            <span aria-hidden="true">{tier.emoji}</span>
            {tier.name}
            {tier.english !== tier.name && (
              <span className="font-normal opacity-80">· {tier.english}</span>
            )}
          </span>

          <p className="mt-2 text-sm text-text-secondary">
            {ordersToNext === 1 ? (
              <>
                Just <strong className="text-text-primary">1 more order</strong> to your next{" "}
                {reward} reward 🎁
              </>
            ) : (
              <>
                <strong className="text-text-primary">{ordersToNext} more orders</strong> to your
                next {reward} reward 🎁
              </>
            )}
          </p>
          <p lang="my" className="mt-1 text-sm text-accent-orange">
            {progressCopy.my} 💛
          </p>

          {/* Climb to the next tier */}
          {nextTier && ordersToNextTier != null && (
            <p className="mt-2 text-xs text-text-muted">
              <span aria-hidden="true">{nextTier.emoji} </span>
              {ordersToTier(ordersToNextTier, `${nextTier.name} (${nextTier.english})`).en}
            </p>
          )}

          {/* Milestone dots — decorative; the ring's aria-label conveys progress */}
          <div
            className="mt-3 flex items-center justify-center gap-1 sm:justify-start"
            aria-hidden="true"
          >
            {Array.from({ length: milestoneStep }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < progressInCycle ? cn("fill-current", accent.text) : "text-border-strong"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StarsProgress;
