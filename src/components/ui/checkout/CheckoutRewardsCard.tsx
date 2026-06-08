"use client";

import { m } from "framer-motion";
import { Star, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRewardsSummary, type RewardsSummary } from "@/lib/hooks/useRewardsSummary";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/currency";
import { LOYALTY_MILESTONE_STEP, type LoyaltyTierId } from "@/lib/loyalty";
import { TierBadge } from "@/components/ui/TierBadge";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";

/** Progress-bar fill, tinted by tier (matches tierAccent text colors). */
const TIER_FILL: Record<LoyaltyTierId, string> = {
  new: "bg-hero-accent",
  jade: "bg-accent-teal",
  ruby: "bg-magenta",
  gold: "bg-accent-orange",
};

interface CheckoutRewardsCardProps {
  className?: string;
  /** Preview override — render with mock data, skipping the auth gate + fetch. */
  previewData?: RewardsSummary;
}

/**
 * Positive-reinforcement rewards card for the checkout sidebar. Surfaces the
 * customer's live Stars + tier and how close this order brings them to the next
 * reward — a purchase-moment nudge ("one more order → $5 off"). Self-fetches for
 * signed-in users (real data only); renders nothing for guests/loading so it
 * never shows a hollow shell. `previewData` forces it on for the preview page.
 */
export function CheckoutRewardsCard({ className, previewData }: CheckoutRewardsCardProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { isAuthenticated } = useAuth();
  const { data: fetched } = useRewardsSummary(isAuthenticated && !previewData);
  const data = previewData ?? fetched;

  if (!data) return null;

  const { stars, ordersToNext, nextRewardCents, tier } = data;
  const reward = formatPrice(nextRewardCents);
  const rewardReady = ordersToNext <= 0;
  const filled = Math.max(
    0,
    Math.min(LOYALTY_MILESTONE_STEP, LOYALTY_MILESTONE_STEP - ordersToNext)
  );
  const pct = rewardReady ? 100 : Math.round((filled / LOYALTY_MILESTONE_STEP) * 100);
  const fill = TIER_FILL[tier.id] ?? TIER_FILL.new;

  return (
    <m.section
      aria-label="Your Morning Star Rewards"
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl hero-surface-paper px-4 py-3.5 ring-1 ring-hero-line",
        "transition-shadow duration-300 hover:shadow-md",
        className
      )}
    >
      {/* Header — brand mark + live tier badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold text-hero-ink">Morning Star Rewards</span>
        </div>
        <TierBadge tier={tier} className="shrink-0" />
      </div>

      {/* Live Stars — odometer reel rolls up on mount */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <Star
          className="h-5 w-5 shrink-0 translate-y-0.5 fill-amber-400 text-amber-400"
          aria-hidden="true"
        />
        <span className="font-display text-2xl font-bold leading-none text-hero-ink">
          <RollingNumber value={stars} animate={shouldAnimate} />
        </span>
        <span className="text-sm font-medium text-hero-ink-muted">Stars</span>
      </div>

      {/* Progress to next reward — fills on mount, tinted by tier */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hero-line/60"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to next reward"
      >
        <m.span
          className={cn("block h-full rounded-full", fill)}
          initial={shouldAnimate ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-hero-ink">
        {rewardReady ? (
          <>
            🎉 <strong className="font-semibold text-hero-accent">{reward} off</strong> is ready for
            this order!
          </>
        ) : (
          <>
            {ordersToNext} more {ordersToNext === 1 ? "order" : "orders"} →{" "}
            <strong className="font-semibold text-hero-accent">{reward} off</strong>
          </>
        )}
      </p>
      <p lang="my" className="mt-0.5 font-burmese text-2xs text-hero-ink-muted">
        {rewardReady
          ? `${reward} လျှော့ အသင့်ပါ 🎉`
          : `နောက် ${ordersToNext} ခါ မှာရင် ${reward} လျှော့`}
      </p>
    </m.section>
  );
}

export default CheckoutRewardsCard;
