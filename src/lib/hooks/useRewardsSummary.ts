"use client";

import { useQuery } from "@tanstack/react-query";

import type { LoyaltyTierId } from "@/lib/loyalty";

export interface RewardsSummary {
  stars: number;
  ordersToNext: number;
  nextRewardCents: number;
  tier: { id: LoyaltyTierId; name: string; english: string; emoji: string };
}

/**
 * Lightweight Stars + tier for the header pill. Cached for 5 minutes and only
 * fetched when the caller passes `enabled` (i.e. a signed-in customer), so it
 * stays cheap across navigation.
 */
export function useRewardsSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["rewards", "summary"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RewardsSummary | null> => {
      const res = await fetch("/api/rewards/summary", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data as RewardsSummary) ?? null;
    },
  });
}
