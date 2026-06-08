"use client";

import { m } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRewardsSummary, type RewardsSummary } from "@/lib/hooks/useRewardsSummary";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/currency";
import { LOYALTY_MILESTONE_STEP } from "@/lib/loyalty";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { RewardsStarArc } from "./RewardsStarArc";
import { RewardCoin } from "./RewardCoin";
import { RewardsTierLadder } from "./RewardsTierLadder";
import { TIER_TINT, rewardShort } from "./rewards-card-style";

interface CheckoutRewardsCardProps {
  className?: string;
  /** Preview override — render with mock data, skipping the auth gate + fetch. */
  previewData?: RewardsSummary;
}

/**
 * Maximal rewards card for the checkout sidebar — two motivational axes at the
 * moment of purchase: a Star-arc gauge + wax-seal reward coin (progress to the
 * next reward) on top, and the Burmese-gem tier ladder (climb to the next gem)
 * below. Self-fetches for signed-in users (real data only); renders nothing for
 * guests/loading. `previewData` forces it on for the preview page.
 */
export function CheckoutRewardsCard({ className, previewData }: CheckoutRewardsCardProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { isAuthenticated } = useAuth();
  const { data: fetched } = useRewardsSummary(isAuthenticated && !previewData);
  const data = previewData ?? fetched;

  if (!data) return null;

  const { stars, spendCents, ordersToNext, nextRewardCents, tier } = data;
  const reward = formatPrice(nextRewardCents);
  const rewardReady = ordersToNext <= 0;
  const filled = Math.max(
    0,
    Math.min(LOYALTY_MILESTONE_STEP, LOYALTY_MILESTONE_STEP - ordersToNext)
  );
  const pct = rewardReady ? 100 : Math.round((filled / LOYALTY_MILESTONE_STEP) * 100);
  const tint = TIER_TINT[tier.id];

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
      {/* Header — brand mark + tier identity (two lines, never truncates) */}
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/20">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-hero-ink">Morning Star Rewards</p>
          <p className="truncate text-2xs font-medium text-hero-ink-muted">
            <span className={cn("font-semibold", tint.text)}>
              {tier.emoji} {tier.name}
            </span>
            {tier.english !== tier.name && <> · {tier.english}</>}
          </p>
        </div>
      </div>

      {/* Reward axis — Star-arc gauge + wax-seal coin (tooltip-explained) */}
      <div className="relative mt-2 flex justify-center">
        <RewardsStarArc
          stars={stars}
          filled={filled}
          total={LOYALTY_MILESTONE_STEP}
          pct={pct}
          tierTextClass={tint.text}
          tierEmoji={tier.emoji}
          shouldAnimate={shouldAnimate}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={
                  rewardReady
                    ? `Your ${reward} reward is ready for this order`
                    : `${reward} reward — ${ordersToNext} more ${ordersToNext === 1 ? "order" : "orders"} to unlock`
                }
                className="absolute right-0 top-1 cursor-help rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
              >
                <RewardCoin
                  label={rewardShort(nextRewardCents)}
                  ready={rewardReady}
                  shouldAnimate={shouldAnimate}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[15rem] text-center">
              {rewardReady ? (
                <>Your {reward} reward is ready — applied to this order. 🎉</>
              ) : (
                <>
                  Order {ordersToNext} more {ordersToNext === 1 ? "time" : "times"} to unlock a{" "}
                  {reward} off coupon.
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="mt-1 text-center text-xs font-medium text-hero-ink">
        {rewardReady ? (
          <>
            🎉 <strong className="font-semibold text-hero-accent">{reward} off</strong> ready for
            this order!
          </>
        ) : (
          <>
            {ordersToNext} more {ordersToNext === 1 ? "order" : "orders"} →{" "}
            <strong className="font-semibold text-hero-accent">{reward} off</strong>
          </>
        )}
      </p>
      <p lang="my" className="mt-0.5 text-center font-burmese text-2xs text-hero-ink-muted">
        {rewardReady
          ? `${reward} လျှော့ အသင့်ပါ 🎉`
          : `နောက် ${ordersToNext} ခါ မှာရင် ${reward} လျှော့`}
      </p>

      {/* Tier axis — gem ladder */}
      <div className="checkout-perf my-3" aria-hidden="true" />
      <RewardsTierLadder tierId={tier.id} spendCents={spendCents} shouldAnimate={shouldAnimate} />
    </m.section>
  );
}

export default CheckoutRewardsCard;
