"use client";

import { Star, Gift, Sparkles, Crown, Clock, Check, Lock } from "lucide-react";
import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, TIER_PERKS, type LoyaltyTierId, type LoyaltyPerk } from "@/lib/loyalty";
import { tierAccent } from "./tierStyle";

const PERK_ICON = {
  star: Star,
  gift: Gift,
  sparkles: Sparkles,
  crown: Crown,
  clock: Clock,
} as const;

function PerkRow({ perk, reached }: { perk: LoyaltyPerk; reached: boolean }) {
  const Icon = PERK_ICON[perk.icon];
  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn(
          "mt-0.5 h-3.5 w-3.5 shrink-0",
          reached ? "text-text-secondary" : "text-text-muted"
        )}
        aria-hidden="true"
      />
      <span
        className={cn("text-xs leading-snug", reached ? "text-text-secondary" : "text-text-muted")}
      >
        {perk.en}
        <span lang="my" className="block opacity-80">
          {perk.my}
        </span>
      </span>
    </li>
  );
}

/**
 * The Burmese-gem tier ladder with each tier's perks — makes the loyalty program
 * legible: where you are, what you've unlocked, and what's next. The current
 * tier is highlighted; tiers below are "reached", tiers above are previewed.
 * Display-only; tier is computed server-side from the real order count.
 */
export function TierLadder({ currentTierId }: { currentTierId: LoyaltyTierId }) {
  const { shouldAnimate } = useAnimationPreference();
  const currentIndex = LOYALTY_TIERS.findIndex((t) => t.id === currentTierId);

  return (
    <section
      aria-label="Loyalty tiers and perks"
      className="rounded-card border border-border-subtle bg-surface-primary p-5"
    >
      <h3 className="text-base font-semibold text-text-primary">Tiers &amp; perks</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Every order moves you up the ladder
        <span lang="my" className="block text-text-muted">
          အော်ဒါတိုင်း အဆင့်တက်လာမယ်နော်
        </span>
      </p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LOYALTY_TIERS.map((tier, i) => {
          const accent = tierAccent(tier.id);
          const isCurrent = tier.id === currentTierId;
          const reached = i <= currentIndex;
          const perks = TIER_PERKS[tier.id];
          return (
            <m.li
              key={tier.id}
              initial={shouldAnimate ? { opacity: 0, y: 8 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl border p-3",
                isCurrent
                  ? cn(accent.bg, "border-transparent ring-2", accent.ring)
                  : "border-border",
                !reached && "opacity-75"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-semibold",
                    accent.text
                  )}
                >
                  <span aria-hidden="true">{tier.emoji}</span>
                  {tier.name}
                </span>
                {reached ? (
                  <Check className={cn("h-4 w-4", accent.text)} aria-label="Reached" />
                ) : (
                  <Lock className="h-4 w-4 text-text-muted" aria-hidden="true" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-muted">
                {tier.english}
                {tier.minOrders > 0 && ` · ${tier.minOrders} orders`}
                {isCurrent && (
                  <span className={cn("ml-1 font-semibold", accent.text)}>· You&apos;re here</span>
                )}
              </p>
              <ul className="mt-2 space-y-1.5">
                {perks.map((perk, p) => (
                  <PerkRow key={p} perk={perk} reached={reached} />
                ))}
              </ul>
            </m.li>
          );
        })}
      </ol>
    </section>
  );
}

export default TierLadder;
