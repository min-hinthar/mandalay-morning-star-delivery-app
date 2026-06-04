"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useRewardsSummary } from "@/lib/hooks/useRewardsSummary";
import { ordersToReward } from "@/lib/loyalty/copy";
import { duration as motionDuration, easing } from "@/lib/motion-tokens";
import { tierAccent } from "@/components/ui/account/RewardsTab/tierStyle";

/**
 * Post-checkout rewards nudge — the highest-intent moment. Shows the customer's
 * Stars, current tier, and how close they are to the next Kyay-Zu-Par! reward,
 * with a tap-through to the rewards hub. Self-fetches the lightweight summary
 * and renders nothing until it resolves, so it never flashes an empty state.
 *
 * Note: the summary reflects star-earning orders already confirmed. A brand-new
 * order processed via webhook moments earlier is normally counted by the time
 * this renders; React Query's short cache keeps it fresh on revisit.
 */
export function OrderRewardsTeaser() {
  const { shouldAnimate } = useAnimationPreference();
  const { data, isLoading } = useRewardsSummary(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || isLoading || !data) return null;

  const accent = tierAccent(data.tier.id);
  const reward = formatPrice(data.nextRewardCents);
  const { stars, ordersToNext } = data;
  const progress = ordersToReward(ordersToNext, reward);

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.6, duration: motionDuration.dramatic, ease: easing.out }}
    >
      <Link
        href="/account?tab=rewards"
        aria-label={`You have ${stars} Stars, ${data.tier.english} tier. ${progress.en}. View your rewards.`}
        className="group flex items-center gap-4 rounded-card border border-primary/15 bg-gradient-to-br from-primary/5 to-accent-orange/10 p-4 transition-colors hover:border-primary/30"
      >
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-offset-2",
              accent.bg,
              accent.ring
            )}
          >
            <Star className={cn("h-6 w-6 fill-current", accent.text)} />
          </span>
        </div>

        <div className="min-w-0 flex-1" aria-hidden="true">
          <p className="text-sm font-semibold text-text-primary">
            You have <span className={accent.text}>{stars} Stars</span> {data.tier.emoji}{" "}
            {data.tier.name}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            {ordersToNext === 1 ? (
              <>
                <strong className="text-text-primary">1 more order</strong> unlocks your {reward}{" "}
                Kyay-Zu-Par! reward 🎁
              </>
            ) : (
              <>
                <strong className="text-text-primary">{ordersToNext} more orders</strong> to your{" "}
                {reward} Kyay-Zu-Par! reward 🎁
              </>
            )}
          </p>
          <p lang="my" className="mt-0.5 text-sm text-accent-orange">
            {progress.my} 💛
          </p>
        </div>

        <ArrowRight
          className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </m.div>
  );
}

export default OrderRewardsTeaser;
