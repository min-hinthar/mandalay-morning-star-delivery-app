"use client";

/**
 * AccountHero — the "loyalty passport" (After Dark).
 *
 * A warm-paper membership card opening the account: bilingual greeting, the
 * customer's loyalty tier crest (constant hero-jewel accent so it reads on the
 * cream card in both themes — mirrors the confirmation wax-seal), Stars balance
 * as rolling digits, reward-cycle progress, the climb to the next tier, and
 * member-since. Real data only (useRewards + profile); reduced-motion-safe.
 */

import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useRewards } from "@/lib/hooks/useRewards";
import { ordersToReward, spendToTier } from "@/lib/loyalty/copy";
import { formatPrice } from "@/lib/utils/currency";
import type { LoyaltyTierId } from "@/lib/loyalty";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { useTilt } from "@/components/ui/homepage/Hero/interactions";
import { GoldLeaf } from "@/components/ui/GoldLeaf";
import { ConstellationOrbit } from "./ConstellationOrbit";

interface AccountProfile {
  fullName: string | null;
  email: string | null;
  createdAt: string | null;
}

// Tier → CONSTANT hero-jewel tokens (read on the cream card in both themes).
// `aurora` is the constant CSS var driving the tier-tinted bloom behind the card
// — deliberately NOT the theme-aware RewardsTab/tierStyle accents (those flip
// bright in dark mode and would meld on this constant-cream passport).
const TIER_JEWEL: Record<
  LoyaltyTierId,
  { text: string; bg: string; layer: "clay" | "blue" | "sage"; aurora: string }
> = {
  new: { text: "text-hero-clay", bg: "bg-hero-clay/12", layer: "clay", aurora: "var(--hero-clay)" },
  jade: { text: "text-hero-blue", bg: "bg-hero-blue/12", layer: "blue", aurora: "var(--hero-blue)" },
  ruby: { text: "text-hero-ruby", bg: "bg-hero-ruby/12", layer: "clay", aurora: "var(--hero-ruby)" },
  gold: { text: "text-hero-gold", bg: "bg-hero-gold/15", layer: "sage", aurora: "var(--hero-gold)" },
};

function useAccountProfile() {
  return useQuery({
    queryKey: ["account", "profile"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AccountProfile | null> => {
      const res = await fetch("/api/account/profile", { credentials: "include" });
      if (!res.ok) throw new Error(`profile failed: ${res.status}`);
      const json = await res.json();
      return (json?.data as AccountProfile) ?? null;
    },
  });
}

export function AccountHero() {
  const { shouldAnimate } = useAnimationPreference();
  const { data: rewards } = useRewards(true);
  const { data: profile } = useAccountProfile();
  // Gentle pointer tilt (kit tactile pass). The passport body holds no primary
  // CTA (display-only greeting/crest/stars/links), so tilting the card wrapper is
  // safe — no preserve-3d (avoids the menu-card shadow-artifact + CTA-drift gotcha).
  const tilt = useTilt(3.5);

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? null;
  const memberSince = profile?.createdAt ? format(parseISO(profile.createdAt), "MMM yyyy") : null;

  const tier = rewards?.tier;
  const jewel = TIER_JEWEL[tier?.id ?? "new"];
  // Reward-cycle progress — the SINGLE source the progress bar AND the orbit read.
  const milestoneStep = rewards?.milestoneStep ?? 0;
  const progressInCycle = rewards?.progressInCycle ?? 0;
  const cycleFraction =
    milestoneStep > 0 ? Math.min(1, progressInCycle / milestoneStep) : 0;
  const reward = rewards ? formatPrice(rewards.nextRewardCents) : "";
  const progressCopy = rewards ? ordersToReward(rewards.ordersToNext, reward) : null;

  return (
    <m.div
      className="hero-surface-paper relative mb-6 overflow-hidden rounded-3xl"
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 1100 }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      {/* Slow tier-tinted aurora bloom behind the card chrome (gradient only, no
          blur — iOS GPU budget). Decorative + a11y-inert. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl">
        <span
          className="absolute -left-16 -top-20 h-64 w-72 rounded-full opacity-40"
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${jewel.aurora}, transparent 70%)`,
          }}
        />
        <span
          className="absolute -bottom-24 -right-12 h-60 w-72 rounded-full opacity-25"
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${jewel.aurora}, transparent 72%)`,
          }}
        />
      </span>

      <HeroCardLayers accent={jewel.layer} radius="rounded-3xl" />
      {/* Gold-leaf flecks + lacquer sheen (kit) — over the card layers, under content. */}
      <GoldLeaf radius="rounded-3xl" />

      <div className="relative p-5 sm:p-6">
        {/* Greeting */}
        <div className="mb-4 flex items-center gap-2.5">
          <HeroSunburst className={cn("h-5 w-5 shrink-0", jewel.text)} rays={10} />
          <div className="leading-tight">
            <h1 className="font-display text-xl font-bold text-hero-ink sm:text-2xl">
              {firstName ? `Mingalaba, ${firstName}` : "Mingalaba"}
            </h1>
            <span className="font-burmese text-sm text-hero-ink-muted" lang="my">
              မင်္ဂလာပါ
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Tier crest with a constellation orbit (lit stars = real cycle progress) */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              {milestoneStep > 0 && (
                <ConstellationOrbit
                  litCount={progressInCycle}
                  totalCount={milestoneStep}
                  accentClass={jewel.text}
                />
              )}
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl text-3xl",
                  jewel.bg
                )}
                aria-hidden="true"
              >
                {tier?.emoji ?? "⭐"}
              </span>
            </span>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
                Member
              </p>
              <p className={cn("font-display text-lg font-bold leading-tight", jewel.text)}>
                {tier?.name ?? "Morning Star"}
              </p>
              {tier?.english && tier.english !== tier.name && (
                <p className="font-burmese text-xs text-hero-ink-muted" lang="my">
                  {tier.english}
                </p>
              )}
            </div>
          </div>

          {/* Stars + progress */}
          <div className="flex-1 sm:border-l sm:border-hero-line/70 sm:pl-5">
            <div className="flex items-baseline gap-1.5">
              <Star
                className="h-5 w-5 self-center fill-amber-400 text-amber-500"
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                className="font-display text-3xl font-bold tabular-nums text-hero-ink"
              >
                <RollingNumber value={rewards?.stars ?? 0} animate={shouldAnimate} />
              </span>
              <span className="sr-only">{rewards?.stars ?? 0} Stars</span>
              <span className="text-sm font-medium text-hero-ink-muted">Stars</span>
            </div>

            {/* Reward-cycle progress */}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-hero-ink/10">
              <m.div
                className="h-full rounded-full bg-gradient-to-r from-hero-clay to-amber-400"
                initial={shouldAnimate ? { width: 0 } : undefined}
                animate={{ width: `${Math.round(cycleFraction * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {progressCopy && (
              <p className="mt-1.5 text-xs text-hero-ink-muted">
                {progressCopy.en}
                <span className="ml-1 font-burmese" lang="my">
                  · {progressCopy.my}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer: tier climb + member-since */}
        {(rewards?.nextTier || memberSince) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hero-line/60 pt-3 text-xs text-hero-ink-muted">
            {rewards?.nextTier && rewards.spendToNextTierCents != null ? (
              <span>
                <span aria-hidden="true">{rewards.nextTier.emoji} </span>
                {
                  spendToTier(
                    formatPrice(rewards.spendToNextTierCents),
                    `${rewards.nextTier.name} (${rewards.nextTier.english})`
                  ).en
                }
              </span>
            ) : (
              <span className="font-medium text-hero-accent">Top tier — thank you! 💛</span>
            )}
            {memberSince && <span>Member since {memberSince}</span>}
          </div>
        )}
      </div>
    </m.div>
  );
}

export default AccountHero;
