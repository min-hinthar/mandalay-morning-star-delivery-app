"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { ReferAFriendCard } from "@/components/ui/referrals/ReferAFriendCard";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatPrice } from "@/lib/utils/currency";
import type { LoyaltyTierId } from "@/lib/loyalty";
import { StarsProgress } from "./StarsProgress";
import { CouponWallet, type WalletItem } from "./CouponWallet";
import { Confetti } from "./Confetti";

interface TierInfo {
  id: LoyaltyTierId;
  name: string;
  english: string;
  emoji: string;
}

interface RewardsData {
  stars: number;
  milestoneStep: number;
  nextMilestone: number;
  ordersToNext: number;
  progressInCycle: number;
  nextRewardCents: number;
  tier: TierInfo;
  nextTier: (TierInfo & { minOrders: number }) | null;
  ordersToNextTier: number | null;
  justUnlocked: { code: string; amountCents: number; kind: string } | null;
  wallet: WalletItem[];
  referral: {
    code: string;
    shareUrl: string;
    rewardCents: number;
    stats: { pending: number; completed: number; earnedCents: number };
  };
}

function RewardsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton height={180} radius="lg" />
      <Skeleton height={120} radius="lg" />
      <Skeleton height={160} radius="lg" />
    </div>
  );
}

function CelebrationBanner({ amountCents }: { amountCents: number }) {
  const { shouldAnimate } = useAnimationPreference();
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: -12, scale: 0.98 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-card border border-accent-orange/30 bg-gradient-to-br from-accent-orange/15 to-primary/10 p-4 text-center"
    >
      <p className="text-base font-semibold text-text-primary">
        🎉 Kyay-Zu-Par! You unlocked {formatPrice(amountCents)} off!
      </p>
      <p className="mt-0.5 text-sm text-text-secondary">
        It&apos;s waiting in your wallet below · သင့်ပိုက်ဆံအိတ်ထဲမှာ စောင့်နေတယ်နော် 💛
      </p>
    </m.div>
  );
}

/**
 * Morning Star Rewards hub — Stars progress, coupon wallet, and refer-a-friend.
 * Celebrates freshly unlocked rewards once (confetti + banner), then marks them
 * acknowledged so the burst doesn't repeat.
 */
export function RewardsTab() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [errored, setErrored] = useState(false);
  const [celebrate, setCelebrate] = useState<{ amountCents: number } | null>(null);
  const acknowledged = useRef(false);

  useEffect(() => {
    let active = true;
    fetch("/api/rewards", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((json) => {
        if (!active) return;
        const payload = json?.data as RewardsData | undefined;
        setData(payload ?? null);
        if (payload?.justUnlocked && !acknowledged.current) {
          acknowledged.current = true;
          setCelebrate({ amountCents: payload.justUnlocked.amountCents });
          void fetch("/api/rewards/acknowledge", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      })
      .catch(() => {
        if (active) setErrored(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (errored) {
    return (
      <p className="rounded-card border border-border-subtle bg-surface-primary p-6 text-sm text-text-secondary">
        We couldn&apos;t load your rewards right now. Please try again in a moment.
      </p>
    );
  }

  if (!data) return <RewardsSkeleton />;

  return (
    <div className="relative space-y-4">
      {celebrate && <Confetti />}
      {celebrate && <CelebrationBanner amountCents={celebrate.amountCents} />}
      <StarsProgress
        stars={data.stars}
        milestoneStep={data.milestoneStep}
        ordersToNext={data.ordersToNext}
        progressInCycle={data.progressInCycle}
        nextRewardCents={data.nextRewardCents}
        tier={data.tier}
        nextTier={data.nextTier}
        ordersToNextTier={data.ordersToNextTier}
      />
      <CouponWallet items={data.wallet} />
      <ReferAFriendCard data={data.referral} />
    </div>
  );
}

export default RewardsTab;
