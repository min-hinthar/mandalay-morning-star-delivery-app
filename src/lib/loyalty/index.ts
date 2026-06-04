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

/**
 * Order statuses that count toward loyalty (Stars + spend). Deliberately
 * EXCLUDES `pending_approval`: a COD order hasn't been paid/approved yet, so it
 * must not inflate Stars or tier. COD counts once approved (→ `confirmed`).
 */
export const STAR_EARNING_STATUSES = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const;

/**
 * Net loyalty spend for one order: food subtotal minus any discount, floored at
 * 0. Excludes tax (goes to the state), tip (goes to the driver), and delivery
 * fee — only what the customer actually spent on our food counts toward tier.
 */
export function orderSpendCents(subtotalCents: number, discountCents: number): number {
  return Math.max(0, subtotalCents - discountCents);
}

export type LoyaltyTierId = "new" | "jade" | "ruby" | "gold";

export interface LoyaltyTier {
  id: LoyaltyTierId;
  /** Burmese name, e.g. "Kyauk Sein". */
  name: string;
  /** English gloss, e.g. "Jade". */
  english: string;
  emoji: string;
  /** Lifetime net spend (cents) required to reach this tier. */
  minSpendCents: number;
  /** Milestone coupon size (cents) earned while in this tier. */
  rewardCents: number;
}

/**
 * The Burmese-gem tier ladder, ascending — earned by LIFETIME NET SPEND, not
 * order count. Spend-based tiers reward real contribution and can't be farmed
 * with tiny orders. Per-order milestone coupons (every 5 orders) are separate.
 */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "new",
    name: "New Friend",
    english: "New Friend",
    emoji: "⭐",
    minSpendCents: 0,
    rewardCents: 500,
  },
  {
    id: "jade",
    name: "Kyauk Sein",
    english: "Jade",
    emoji: "💚",
    minSpendCents: 25000,
    rewardCents: 800,
  },
  {
    id: "ruby",
    name: "Padamya",
    english: "Ruby",
    emoji: "❤️",
    minSpendCents: 75000,
    rewardCents: 1000,
  },
  {
    id: "gold",
    name: "Shwe",
    english: "Gold",
    emoji: "💛",
    minSpendCents: 150000,
    rewardCents: 1200,
  },
];

/** The customer's current tier for a given lifetime net spend (cents). */
export function tierForSpend(spendCents: number): LoyaltyTier {
  let current = LOYALTY_TIERS[0];
  for (const tier of LOYALTY_TIERS) {
    if (spendCents >= tier.minSpendCents) current = tier;
  }
  return current;
}

/** The next tier up, or null if already at the top. */
export function nextTier(spendCents: number): LoyaltyTier | null {
  return LOYALTY_TIERS.find((t) => t.minSpendCents > spendCents) ?? null;
}

/** Net spend (cents) remaining until the next tier, or null at the top. */
export function spendToNextTierCents(spendCents: number): number | null {
  const next = nextTier(spendCents);
  return next ? next.minSpendCents - spendCents : null;
}

/** Milestone coupon size (cents) for the customer's current spend tier. */
export function rewardCentsForSpend(spendCents: number): number {
  return tierForSpend(spendCents).rewardCents;
}

/** The coupon size (cents) the customer earns at their next milestone. */
export function nextRewardCents(spendCents: number): number {
  return rewardCentsForSpend(spendCents);
}

/**
 * Tiers at or above which "early access" applies (Ruby, Gold). A pure,
 * server-derivable capability flag — the UI only ever displays it; any future
 * gating (e.g. early-access specials) must re-check server-side.
 */
export const EARLY_ACCESS_TIERS: LoyaltyTierId[] = ["ruby", "gold"];

/** Whether the tier at a given lifetime net spend unlocks early access. */
export function hasEarlyAccess(spendCents: number): boolean {
  return EARLY_ACCESS_TIERS.includes(tierForSpend(spendCents).id);
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

/** The perks unlocked at the tier for a given lifetime net spend. */
export function tierPerks(spendCents: number): LoyaltyPerk[] {
  return TIER_PERKS[tierForSpend(spendCents).id];
}

/** The next milestone (multiple of the step) strictly above `stars`. */
export function nextMilestone(stars: number): number {
  return (Math.floor(stars / LOYALTY_MILESTONE_STEP) + 1) * LOYALTY_MILESTONE_STEP;
}

/** Orders remaining until the next reward unlocks. */
export function ordersToNextMilestone(stars: number): number {
  return nextMilestone(stars) - stars;
}

/**
 * Every milestone (multiple of the step) at or below `orderCount` — used to
 * back-fill any milestones a count jump skipped. e.g. count 6 → [5]; 12 → [5,10].
 * Issuance dedupes via the UNIQUE(user_id, milestone) constraint, so re-issuing
 * an already-claimed milestone is a safe no-op.
 */
export function milestonesReached(orderCount: number): number[] {
  const out: number[] = [];
  for (let m = LOYALTY_MILESTONE_STEP; m <= orderCount; m += LOYALTY_MILESTONE_STEP) {
    out.push(m);
  }
  return out;
}

/** Progress (0–step) toward the next milestone, for the progress ring. */
export function progressInCycle(stars: number): number {
  return stars % LOYALTY_MILESTONE_STEP;
}
