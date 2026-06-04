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
 * Lightweight Stars + tier for the header pill. Cached for 60s (so a freshly
 * earned Star surfaces soon after an order) and refetched on window focus. Only
 * fetched when `enabled` (a signed-in customer), so it stays cheap.
 *
 * Throws on fetch failure so callers can distinguish loading (`isPending`) from
 * error (`isError`) — the header pill simply hides on either, but the rewards
 * hub surfaces a retry.
 */
export function useRewardsSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["rewards", "summary"],
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<RewardsSummary | null> => {
      const res = await fetch("/api/rewards/summary", { credentials: "include" });
      if (!res.ok) throw new Error(`rewards summary failed: ${res.status}`);
      const json = await res.json();
      return (json?.data as RewardsSummary) ?? null;
    },
  });
}
