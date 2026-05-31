"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ReferAFriendCard } from "@/components/ui/referrals/ReferAFriendCard";
import { StarsProgress } from "./StarsProgress";
import { CouponWallet, type WalletItem } from "./CouponWallet";

interface RewardsData {
  stars: number;
  milestoneStep: number;
  nextMilestone: number;
  ordersToNext: number;
  progressInCycle: number;
  loyaltyRewardCents: number;
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

/**
 * Morning Star Rewards hub — Stars progress, coupon wallet, and refer-a-friend,
 * all in one place. Lightweight self-fetch so it loads independently of the
 * other account tabs.
 */
export function RewardsTab() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/rewards", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((json) => {
        if (active) setData(json?.data ?? null);
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
    <div className="space-y-4">
      <StarsProgress
        stars={data.stars}
        milestoneStep={data.milestoneStep}
        ordersToNext={data.ordersToNext}
        progressInCycle={data.progressInCycle}
        rewardCents={data.loyaltyRewardCents}
      />
      <CouponWallet items={data.wallet} />
      <ReferAFriendCard data={data.referral} />
    </div>
  );
}

export default RewardsTab;
