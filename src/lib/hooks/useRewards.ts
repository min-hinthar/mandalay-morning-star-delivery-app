"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { LoyaltyTierId } from "@/lib/loyalty";

export interface RewardsTier {
  id: LoyaltyTierId;
  name: string;
  english: string;
  emoji: string;
}

export interface RewardsWalletItem {
  id: string;
  code: string;
  kind: "loyalty" | "referral";
  amountCents: number;
  label: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface RewardsReferral {
  code: string;
  shareUrl: string;
  rewardCents: number;
  stats: { pending: number; completed: number; earnedCents: number };
}

export interface RewardsData {
  stars: number;
  milestoneStep: number;
  nextMilestone: number;
  ordersToNext: number;
  progressInCycle: number;
  nextRewardCents: number;
  tier: RewardsTier;
  nextTier: (RewardsTier & { minOrders: number }) | null;
  ordersToNextTier: number | null;
  justUnlocked: { code: string; amountCents: number; kind: string } | null;
  wallet: RewardsWalletItem[];
  referral: RewardsReferral;
}

/**
 * Full rewards hub data (Stars, tier, wallet, referral). React Query so the hub,
 * header pill, and teaser share one cache. Throws on failure so the hub can show
 * a real error + retry (vs. the previous raw-fetch path that conflated states).
 */
export function useRewards(enabled = true) {
  return useQuery({
    queryKey: ["rewards", "full"],
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<RewardsData> => {
      const res = await fetch("/api/rewards", { credentials: "include" });
      if (!res.ok) throw new Error(`rewards failed: ${res.status}`);
      const json = await res.json();
      const data = json?.data as RewardsData | undefined;
      if (!data) throw new Error("rewards: empty payload");
      return data;
    },
  });
}

/**
 * Referral code + share link + stats for the refer-a-friend card when it isn't
 * handed pre-fetched data by the rewards hub. Throws on failure so the card can
 * show a retry instead of silently vanishing.
 */
export function useReferral(enabled = true) {
  return useQuery({
    queryKey: ["referral"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<RewardsReferral> => {
      const res = await fetch("/api/referrals", { credentials: "include" });
      if (!res.ok) throw new Error(`referrals failed: ${res.status}`);
      const json = await res.json();
      const data = json?.data as RewardsReferral | undefined;
      if (!data) throw new Error("referrals: empty payload");
      return data;
    },
  });
}

/**
 * Mark all of the customer's unacknowledged rewards as seen (fires the in-app
 * celebration once). Invalidates summary + full caches so the header pill and
 * hub reflect the cleared state.
 */
export function useAcknowledgeRewards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/rewards/acknowledge", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
