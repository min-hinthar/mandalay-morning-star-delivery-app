"use client";

import { Fragment } from "react";
import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { LOYALTY_TIERS, nextTier, spendToNextTierCents, type LoyaltyTierId } from "@/lib/loyalty";
import { TIER_TINT } from "./rewards-card-style";

interface RewardsTierLadderProps {
  tierId: LoyaltyTierId;
  spendCents: number;
  shouldAnimate: boolean;
}

/**
 * The Burmese-gem tier ladder as a connected ribbon — current gem lit + ringed,
 * passed segments tinted, future gems faint. Sublabel teases the climb to the
 * next gem by net spend (bilingual), or celebrates the top tier. Drives bigger
 * orders without fabricating data (net spend is live from the summary).
 */
export function RewardsTierLadder({ tierId, spendCents, shouldAnimate }: RewardsTierLadderProps) {
  const tiers = LOYALTY_TIERS;
  const currentIndex = Math.max(
    0,
    tiers.findIndex((t) => t.id === tierId)
  );
  const next = nextTier(spendCents);
  const toNext = spendToNextTierCents(spendCents);
  const tint = TIER_TINT[tierId];

  return (
    <div>
      <ul className="flex items-center" aria-label="Loyalty tier ladder">
        {tiers.map((t, i) => {
          const reached = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <Fragment key={t.id}>
              <li>
                <m.span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border bg-hero-card text-sm leading-none",
                    reached
                      ? cn("border-current", TIER_TINT[t.id].text)
                      : "border-hero-line text-hero-ink-muted opacity-50",
                    isCurrent && "ring-2 ring-current"
                  )}
                  initial={shouldAnimate ? { scale: 0 } : false}
                  animate={{ scale: isCurrent ? 1.12 : 1 }}
                  transition={{
                    delay: 0.35 + i * 0.07,
                    type: "spring",
                    stiffness: 380,
                    damping: 15,
                  }}
                  aria-label={`${t.english}${isCurrent ? " — current tier" : ""}`}
                >
                  <span aria-hidden="true">{t.emoji}</span>
                </m.span>
              </li>
              {i < tiers.length - 1 && (
                <li className="flex-1">
                  <m.span
                    aria-hidden="true"
                    className={cn(
                      "mx-1.5 block h-0.5 origin-left rounded-full",
                      i < currentIndex ? tint.bg : "bg-hero-line"
                    )}
                    initial={shouldAnimate ? { scaleX: 0 } : false}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>

      <p className="mt-2 text-center text-2xs font-medium text-hero-ink">
        {next && toNext != null ? (
          <>
            <strong className={cn("font-bold", tint.text)}>{formatPrice(toNext)}</strong> more spend
            → {next.english} <span aria-hidden="true">{next.emoji}</span>
          </>
        ) : (
          <>Top tier — every perk is yours 👑</>
        )}
      </p>
      <p lang="my" className="mt-0.5 text-center font-burmese text-2xs text-hero-ink-muted">
        {next && toNext != null
          ? `${formatPrice(toNext)} ထပ်သုံးရင် ${next.english} ဖြစ်မယ်`
          : "အမြင့်ဆုံးအဆင့် — အကျိုးခံစားခွင့်အားလုံးရပြီ"}
      </p>
    </div>
  );
}
