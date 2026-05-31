"use client";

import { Star } from "lucide-react";
import { m } from "framer-motion";

import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/currency";

interface StarsProgressProps {
  stars: number;
  milestoneStep: number;
  ordersToNext: number;
  progressInCycle: number;
  rewardCents: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Animated Stars ring — lifetime Stars in the center, the arc fills toward the
 * next $5 reward (progress within the current milestone cycle).
 */
export function StarsProgress({
  stars,
  milestoneStep,
  ordersToNext,
  progressInCycle,
  rewardCents,
}: StarsProgressProps) {
  const { shouldAnimate } = useAnimationPreference();
  const fraction = progressInCycle / milestoneStep;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const reward = formatPrice(rewardCents);

  return (
    <section className="rounded-card bg-gradient-to-br from-primary/5 to-accent-orange/10 border border-primary/15 p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {/* Ring */}
        <div className="relative h-36 w-36 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              className="stroke-current text-border-subtle"
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
            />
            <m.circle
              className="stroke-current text-primary"
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={shouldAnimate ? { strokeDashoffset: CIRCUMFERENCE } : false}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Star className="h-5 w-5 fill-accent-orange text-accent-orange" />
            <span className="mt-0.5 text-3xl font-bold leading-none text-text-primary">
              {stars}
            </span>
            <span className="text-xs text-text-secondary">Stars</span>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold text-text-primary">Morning Star Rewards</h3>
          <p className="mt-1 text-sm text-text-secondary">
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
          <p className="mt-1 text-sm text-accent-orange">
            နောက်ထပ် {ordersToNext} ခါ မှာရင် {reward} ပြန်ရမယ်နော် 💛
          </p>
          <div className="mt-3 flex items-center justify-center gap-1 sm:justify-start">
            {Array.from({ length: milestoneStep }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < progressInCycle
                    ? "h-4 w-4 fill-accent-orange text-accent-orange"
                    : "h-4 w-4 text-border-strong"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StarsProgress;
