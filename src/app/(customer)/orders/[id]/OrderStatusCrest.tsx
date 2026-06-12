"use client";

/**
 * OrderStatusCrest — a small (~28px) tier-tinted crest on the order-detail
 * status card. Carries `view-transition-name: wax-seal` so it morphs to/from the
 * confirmation page's big wax seal (and the skeleton placeholder disc) during a
 * vt-nav navigation. Mirrors the confirmation seal's `tierSeal` styling.
 *
 * Tier defaults to clay for new/guest/loading — real data only, never fabricated.
 */

import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { useRewardsSummary } from "@/lib/hooks/useRewardsSummary";
import type { LoyaltyTierId } from "@/lib/loyalty";

const TIER_SEAL: Record<LoyaltyTierId, { ring: string; sun: string; varName: string }> = {
  new: { ring: "border-hero-clay/55", sun: "text-hero-clay", varName: "--hero-clay" },
  jade: { ring: "border-hero-blue/55", sun: "text-hero-blue", varName: "--hero-blue" },
  ruby: { ring: "border-hero-ruby/55", sun: "text-hero-ruby", varName: "--hero-ruby" },
  gold: { ring: "border-hero-gold/60", sun: "text-hero-gold", varName: "--hero-gold" },
};

export function OrderStatusCrest() {
  const { data: rewards } = useRewardsSummary(true);
  const tierId: LoyaltyTierId = rewards?.tier?.id ?? "new";
  const seal = TIER_SEAL[tierId];

  return (
    <span
      aria-hidden="true"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${seal.ring}`}
      style={{
        background: `radial-gradient(circle at 35% 28%, color-mix(in srgb, var(${seal.varName}) 22%, transparent), transparent 72%)`,
        viewTransitionName: "wax-seal",
      }}
    >
      <HeroSunburst className={`h-3.5 w-3.5 ${seal.sun}`} rays={10} />
    </span>
  );
}

export default OrderStatusCrest;
