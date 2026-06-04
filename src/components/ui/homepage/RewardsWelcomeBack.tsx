"use client";

/**
 * RewardsWelcomeBack
 * A warm, branded "welcome back" pill on the homepage for signed-in customers.
 * Shows their tier badge, Stars, and progress to the next reward, linking to the
 * rewards hub. Keeps the Hero itself a pure/SSR-friendly component — this is a
 * separate client island that renders nothing for guests or brand-new customers.
 */

import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRewardsSummary } from "@/lib/hooks/useRewardsSummary";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { duration, easing } from "@/lib/motion-tokens";
import { ordersToReward } from "@/lib/loyalty/copy";
import { formatPrice } from "@/lib/utils/currency";
import { TierBadge } from "@/components/ui/TierBadge";
import { tierAccent } from "@/components/ui/account/RewardsTab/tierStyle";

export function RewardsWelcomeBack() {
  const { shouldAnimate } = useAnimationPreference();
  const { user, isLoading: authLoading } = useAuth();
  const { data: rewards } = useRewardsSummary(!!user);

  // Render nothing for guests, while loading, or for customers with no Stars yet
  // (the OfferBanner already welcomes brand-new/first-order customers).
  if (authLoading || !user || !rewards || rewards.stars < 1) return null;

  const accent = tierAccent(rewards.tier.id);
  const reward = formatPrice(rewards.nextRewardCents);
  const progress = ordersToReward(rewards.ordersToNext, reward);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <AnimatePresence>
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: duration.normal, ease: easing.out }}
        >
          <Link
            href="/account?tab=rewards"
            aria-label={`Welcome back. You have ${rewards.stars} Stars, ${rewards.tier.english} tier. ${progress.en}. View your rewards.`}
            className="group flex items-center gap-3 rounded-card border border-primary/15 bg-gradient-to-br from-primary/5 via-surface-primary to-accent-orange/10 p-4 transition-colors hover:border-primary/30"
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2",
                accent.bg,
                accent.ring
              )}
              aria-hidden="true"
            >
              <Star className={cn("h-5 w-5 fill-current", accent.text)} />
            </span>

            <div className="min-w-0 flex-1" aria-hidden="true">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-text-primary">Welcome back!</span>
                <TierBadge tier={rewards.tier} variant="mini" />
                {rewards.earlyAccess && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-accent-orange">
                    <Sparkles className="h-3 w-3" /> Early access
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-text-secondary">
                <span className={cn("font-semibold", accent.text)}>{rewards.stars} ⭐</span> ·{" "}
                {progress.en} 🎁
              </p>
            </div>

            <ArrowRight
              className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </m.div>
      </AnimatePresence>
    </div>
  );
}

export default RewardsWelcomeBack;
