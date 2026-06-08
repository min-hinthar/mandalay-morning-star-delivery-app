import type { LoyaltyTierId } from "@/lib/loyalty";

export interface TierTint {
  /** Text color class — also used as SVG `currentColor` source. */
  text: string;
  /** Solid background class — progress fills / lit ladder segments. */
  bg: string;
}

/** Tier → brand color tokens (mirrors RewardsTab tierAccent, hero-mapped). */
export const TIER_TINT: Record<LoyaltyTierId, TierTint> = {
  new: { text: "text-hero-accent", bg: "bg-hero-accent" },
  jade: { text: "text-accent-teal", bg: "bg-accent-teal" },
  ruby: { text: "text-magenta", bg: "bg-magenta" },
  gold: { text: "text-accent-orange", bg: "bg-accent-orange" },
};

/** Compact reward label, e.g. 500 → "$5" (coin face). */
export function rewardShort(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}
