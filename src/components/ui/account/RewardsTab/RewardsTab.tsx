"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { RotateCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Bilingual } from "@/components/ui/Bilingual";
import { ReferAFriendCard } from "@/components/ui/referrals/ReferAFriendCard";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useRewards, useAcknowledgeRewards } from "@/lib/hooks/useRewards";
import { formatPrice } from "@/lib/utils/currency";
import { duration, easing } from "@/lib/motion-tokens";
import { LOAD_ERROR, RETRY, unlockedAnnounce } from "@/lib/loyalty/copy";
import { StarsProgress } from "./StarsProgress";
import { CouponWallet } from "./CouponWallet";
import { TierLadder } from "./TierLadder";
import { Confetti } from "./Confetti";

function RewardsSkeleton() {
  return (
    <div className="space-y-4">
      <span className="sr-only" role="status">
        Loading your rewards…
      </span>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton height={180} radius="lg" />
        <Skeleton height={120} radius="lg" />
        <Skeleton height={160} radius="lg" />
      </div>
    </div>
  );
}

function CelebrationBanner({ amountCents }: { amountCents: number }) {
  const { shouldAnimate } = useAnimationPreference();
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: -12, scale: 0.98 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: duration.slow, ease: easing.out }}
      className="rounded-card border border-accent-orange/30 bg-gradient-to-br from-accent-orange/15 to-primary/10 p-4 text-center"
    >
      <p className="text-base font-semibold text-text-primary">
        🎉 Kyay-Zu-Par! You unlocked {formatPrice(amountCents)} off!
      </p>
      <p lang="my" className="mt-0.5 text-sm text-text-secondary">
        သင့်ပိုက်ဆံအိတ်ထဲမှာ စောင့်နေတယ်နော် 💛
      </p>
    </m.div>
  );
}

/**
 * Morning Star Rewards hub — Stars progress, coupon wallet, and refer-a-friend.
 * Celebrates a freshly unlocked reward once (confetti + banner + SR announcement),
 * then acknowledges it so the burst doesn't repeat. Shares one React Query cache
 * with the header pill and confirmation teaser.
 */
export function RewardsTab() {
  const { data, isPending, isError, refetch, isFetching } = useRewards(true);
  const acknowledge = useAcknowledgeRewards();
  const [celebrate, setCelebrate] = useState<{ amountCents: number } | null>(null);
  const acknowledgedRef = useRef(false);

  const justUnlocked = data?.justUnlocked ?? null;
  useEffect(() => {
    if (justUnlocked && !acknowledgedRef.current) {
      acknowledgedRef.current = true;
      setCelebrate({ amountCents: justUnlocked.amountCents });
      acknowledge.mutate();
    }
  }, [justUnlocked, acknowledge]);

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-card border border-border-subtle bg-surface-primary p-6 text-center"
      >
        <Bilingual text={LOAD_ERROR} className="text-sm text-text-secondary" />
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <RotateCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {RETRY.en}
        </button>
      </div>
    );
  }

  if (isPending || !data) return <RewardsSkeleton />;

  return (
    <div className="relative space-y-4">
      {/* SR-only announcement for the unlock (confetti itself is decorative) */}
      <span role="status" aria-live="assertive" className="sr-only">
        {celebrate ? unlockedAnnounce(formatPrice(celebrate.amountCents)).en : ""}
      </span>
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
      <TierLadder currentTierId={data.tier.id} />
      <ReferAFriendCard data={data.referral} />
    </div>
  );
}

export default RewardsTab;
