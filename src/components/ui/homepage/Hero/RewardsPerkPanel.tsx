"use client";

/**
 * RewardsPerkPanel — the "what you get" detail for one loyalty tier, revealed
 * when the Rewards Rail is expanded. Reward + unlock line (count-up), bilingual
 * EN/MY, and the tier's cumulative perk list in a two-column grid (keeps the
 * expanded height short). Numbers from LOYALTY_TIERS / TIER_PERKS — never faked.
 */

import { Star, Gift, Sparkles, Crown, Clock } from "lucide-react";
import { TIER_PERKS, type LoyaltyTier } from "@/lib/loyalty";
import { RollingNumber } from "./RollingDigits";

const PERK_ICON = { star: Star, gift: Gift, sparkles: Sparkles, crown: Crown, clock: Clock };

const MY_DIGITS = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

function dollars(cents: number) {
  return Math.round(cents / 100);
}
/** Latin integer → Burmese numerals (e.g. 1500 → ၁၅၀၀). */
function toMyanmar(n: number): string {
  return String(n).replace(/\d/g, (d) => MY_DIGITS[Number(d)]);
}

export function RewardsPerkPanel({
  tier,
  my,
  animate,
}: {
  tier: LoyaltyTier;
  /** Native-script Burmese tier name (from the rail's TIER map). */
  my: string;
  animate: boolean;
}) {
  const perks = TIER_PERKS[tier.id];
  const isStart = tier.minSpendCents === 0;

  return (
    <>
      <p className="flex items-center gap-1.5 text-base font-semibold text-hero-ink">
        <span aria-hidden="true" className="text-xl">
          {tier.emoji}
        </span>
        {tier.english}
        <span className="font-burmese text-[0.95rem] font-normal leading-none text-hero-ink/70">
          {my}
        </span>
      </p>
      <p className="mt-1 text-xs text-hero-ink-muted">
        <span className="font-semibold text-hero-accent">
          $<RollingNumber value={dollars(tier.rewardCents)} animate={animate} /> reward
        </span>{" "}
        ·{" "}
        {isStart ? (
          "Start here — welcome aboard"
        ) : (
          <>
            Unlock at $<RollingNumber value={dollars(tier.minSpendCents)} animate={animate} />{" "}
            lifetime
          </>
        )}
      </p>
      <p className="mt-1 font-burmese text-[0.95rem] leading-relaxed text-hero-accent/85">
        {isStart
          ? "ယခု စတင်လိုက်ပါ"
          : `တစ်သက်တာ $${toMyanmar(dollars(tier.minSpendCents))} ဖိုးအားပေးလျှင်`}
      </p>
      <ul className="mt-2.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {perks.map((perk) => {
          const Icon = PERK_ICON[perk.icon];
          return (
            <li key={perk.en} className="flex items-start gap-1.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hero-clay" aria-hidden="true" />
              <span className="text-xs leading-snug text-hero-ink">
                {perk.en}
                <span className="ml-1 font-burmese text-[0.88rem] leading-relaxed text-hero-ink/65">
                  · {perk.my}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
