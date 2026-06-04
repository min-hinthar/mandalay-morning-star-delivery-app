/**
 * Morning Star Rewards — loyalty constants, tiers, and pure helpers.
 *
 * Stars are simply the customer's completed-order count (no stored counter, so
 * nothing can drift). Every Nth order crosses a milestone and auto-issues a
 * tier-sized "Kyay-Zu-Par!" thank-you coupon. Tiers are the Burmese-gem ladder
 * (Mandalay, the Golden City): New Friend → Jade → Ruby → Gold.
 */

/** Base loyalty thank-you discount (cents) — the New Friend "Kyay-Zu-Par!". */
export const LOYALTY_REWARD_CENTS = 500;

/** One-time anniversary thank-you discount (cents). Flat across tiers. */
export const LOYALTY_ANNIVERSARY_CENTS = 1000;

/** A reward is issued every Nth completed order. */
export const LOYALTY_MILESTONE_STEP = 5;

/** Minimum cart subtotal (cents) required to redeem a loyalty reward. */
export const LOYALTY_MIN_SUBTOTAL_CENTS = 5000;

/** Days a loyalty reward stays valid after issue — creates gentle urgency. */
export const LOYALTY_REWARD_TTL_DAYS = 60;

/** Within this many days of expiry, the wallet flags a reward "expiring soon". */
export const LOYALTY_EXPIRING_SOON_DAYS = 7;

/** Expiry timestamp (ISO) for a reward issued now, or for an explicit issue date. */
export function rewardExpiryISO(from: Date = new Date()): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + LOYALTY_REWARD_TTL_DAYS);
  return expires.toISOString();
}

/** Whole days until `expiresAt` (rounded up), or null if no expiry. Past due → 0. */
export function daysUntilExpiry(expiresAt: string | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

/** Order statuses that count as a real (Star-earning) order. */
export const STAR_EARNING_STATUSES = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "pending_approval",
] as const;

export type LoyaltyTierId = "new" | "jade" | "ruby" | "gold";

export interface LoyaltyTier {
  id: LoyaltyTierId;
  /** Burmese name, e.g. "Kyauk Sein". */
  name: string;
  /** English gloss, e.g. "Jade". */
  english: string;
  emoji: string;
  /** Lifetime orders required to reach this tier. */
  minOrders: number;
  /** Milestone coupon size (cents) earned while in this tier. */
  rewardCents: number;
}

/** The Burmese-gem tier ladder, ascending. */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "new",
    name: "New Friend",
    english: "New Friend",
    emoji: "⭐",
    minOrders: 0,
    rewardCents: 500,
  },
  { id: "jade", name: "Kyauk Sein", english: "Jade", emoji: "💚", minOrders: 10, rewardCents: 800 },
  { id: "ruby", name: "Padamya", english: "Ruby", emoji: "❤️", minOrders: 25, rewardCents: 1000 },
  { id: "gold", name: "Shwe", english: "Gold", emoji: "💛", minOrders: 50, rewardCents: 1200 },
];

/** The customer's current tier for a given lifetime order count. */
export function tierForOrders(orderCount: number): LoyaltyTier {
  let current = LOYALTY_TIERS[0];
  for (const tier of LOYALTY_TIERS) {
    if (orderCount >= tier.minOrders) current = tier;
  }
  return current;
}

/** The next tier up, or null if already at the top. */
export function nextTier(orderCount: number): LoyaltyTier | null {
  return LOYALTY_TIERS.find((t) => t.minOrders > orderCount) ?? null;
}

/** Orders remaining until the next tier, or null at the top. */
export function ordersToNextTier(orderCount: number): number | null {
  const next = nextTier(orderCount);
  return next ? next.minOrders - orderCount : null;
}

/** Milestone coupon size (cents) for the tier at a given order count. */
export function rewardCentsForOrders(orderCount: number): number {
  return tierForOrders(orderCount).rewardCents;
}

/**
 * Tiers at or above which "early access" applies (Ruby, Gold). A pure,
 * server-derivable capability flag — the UI only ever displays it; any future
 * gating (e.g. early-access specials) must re-check server-side.
 */
export const EARLY_ACCESS_TIERS: LoyaltyTierId[] = ["ruby", "gold"];

/** Whether the tier at `orderCount` unlocks early access. */
export function hasEarlyAccess(orderCount: number): boolean {
  return EARLY_ACCESS_TIERS.includes(tierForOrders(orderCount).id);
}

export interface LoyaltyPerk {
  /** Lucide icon name the UI maps to a component. */
  icon: "star" | "gift" | "sparkles" | "crown" | "clock";
  en: string;
  my: string;
}

/**
 * Bilingual "what you get" perks per tier, cumulative (each tier inherits the
 * tiers below it plus its own). Display-only — the monetary perk (tier-sized
 * coupons) is enforced server-side at issuance; this just makes the ladder
 * legible. Keep copy in sync with LOYALTY_TIERS reward sizes.
 */
export const TIER_PERKS: Record<LoyaltyTierId, LoyaltyPerk[]> = {
  new: [
    { icon: "star", en: "1 Star for every order", my: "အော်ဒါတိုင်း Star တစ်လုံး" },
    {
      icon: "gift",
      en: "$5 Kyay-Zu-Par! reward every 5 orders",
      my: "၅ ကြိမ်တိုင်း $5 ကျေးဇူးဆု",
    },
  ],
  jade: [
    { icon: "sparkles", en: "Everything in New Friend", my: "New Friend ပါဝင်သမျှ အားလုံး" },
    {
      icon: "gift",
      en: "Bigger $8 reward every 5 orders",
      my: "၅ ကြိမ်တိုင်း $8 ဆု (ပိုကြီး)",
    },
    { icon: "star", en: "Jade tier badge on your profile", my: "ပရိုဖိုင်မှာ Jade တံဆိပ်" },
  ],
  ruby: [
    { icon: "sparkles", en: "Everything in Jade", my: "Jade ပါဝင်သမျှ အားလုံး" },
    { icon: "gift", en: "Bigger $10 reward every 5 orders", my: "၅ ကြိမ်တိုင်း $10 ဆု" },
    {
      icon: "clock",
      en: "Early access to new specials",
      my: "အထူးမီနူးအသစ်များ စောစီးစွာ ဝင်ကြည့်ခွင့်",
    },
  ],
  gold: [
    { icon: "sparkles", en: "Everything in Ruby", my: "Ruby ပါဝင်သမျှ အားလုံး" },
    {
      icon: "gift",
      en: "Biggest $12 reward every 5 orders",
      my: "၅ ကြိမ်တိုင်း $12 ဆု (အကြီးဆုံး)",
    },
    {
      icon: "crown",
      en: "Gold tier — our most loyal friends 💛",
      my: "Gold — အချစ်ဆုံး မိတ်ဆွေအရင်းများ 💛",
    },
  ],
};

/** The perks unlocked at the tier for a given order count. */
export function tierPerks(orderCount: number): LoyaltyPerk[] {
  return TIER_PERKS[tierForOrders(orderCount).id];
}

/** The next milestone (multiple of the step) strictly above `stars`. */
export function nextMilestone(stars: number): number {
  return (Math.floor(stars / LOYALTY_MILESTONE_STEP) + 1) * LOYALTY_MILESTONE_STEP;
}

/** Orders remaining until the next reward unlocks. */
export function ordersToNextMilestone(stars: number): number {
  return nextMilestone(stars) - stars;
}

/** The coupon size (cents) the customer will earn at their next milestone. */
export function nextRewardCents(stars: number): number {
  return rewardCentsForOrders(nextMilestone(stars));
}

/**
 * The milestone reached at exactly this completed-order count, or null if the
 * count isn't on a milestone boundary.
 */
export function milestoneReached(orderCount: number): number | null {
  return orderCount > 0 && orderCount % LOYALTY_MILESTONE_STEP === 0 ? orderCount : null;
}

/** Progress (0–step) toward the next milestone, for the progress ring. */
export function progressInCycle(stars: number): number {
  return stars % LOYALTY_MILESTONE_STEP;
}
