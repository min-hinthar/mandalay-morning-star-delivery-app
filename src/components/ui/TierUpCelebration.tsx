"use client";

/**
 * TierUpCelebration — fires once when a customer crosses into a higher loyalty
 * tier: confetti + a bilingual wax-seal "new tier" stamp. Level-up kit capstone.
 *
 * Detection: compares the live `useRewards` tier to a localStorage-persisted
 * last-seen tier (rank-ordered new < jade < ruby < gold). Celebrates only on an
 * upgrade (never on first sight or a downgrade), evaluated once per mount, and
 * persists the new tier so it won't re-fire. Real data only. Reduced-motion: no
 * confetti, the stamp still appears (transform-only) and auto-dismisses; tap to
 * dismiss. Mount it on a surface where rewards are fresh (account / confirmation).
 */

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useRewards } from "@/lib/hooks/useRewards";
import { useConfetti } from "@/components/ui/Confetti";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import type { LoyaltyTierId } from "@/lib/loyalty";

const RANK: Record<LoyaltyTierId, number> = { new: 0, jade: 1, ruby: 2, gold: 3 };
const STORAGE_KEY = "mms_seen_tier";

interface CelebratedTier {
  name: string;
  english: string;
  emoji: string;
}

export function TierUpCelebration() {
  const { data } = useRewards(true);
  const { shouldAnimate } = useAnimationPreference();
  const { trigger, Confetti } = useConfetti();
  const [celebrate, setCelebrate] = useState<CelebratedTier | null>(null);
  const evaluated = useRef(false);

  useEffect(() => {
    if (!data?.tier || evaluated.current) return;
    evaluated.current = true;

    let seen: string | null = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, data.tier.id);
    } catch {
      return; // storage blocked → skip (can't dedupe, so don't celebrate)
    }

    const seenRank = seen && seen in RANK ? RANK[seen as LoyaltyTierId] : null;
    if (seenRank != null && RANK[data.tier.id] > seenRank) {
      setCelebrate({ name: data.tier.name, english: data.tier.english, emoji: data.tier.emoji });
      if (shouldAnimate) trigger();
    }
  }, [data, shouldAnimate, trigger]);

  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(null), 5200);
    return () => clearTimeout(t);
  }, [celebrate]);

  return (
    <>
      <Confetti particleCount={36} duration={2.6} />
      <AnimatePresence>
        {celebrate && (
          <m.div
            // z-modal (50) — named z utilities are defined as @utility rules in
            // globals.css (the JS-config zIndex scale never loads in Tailwind v4)
            className="fixed inset-0 z-modal flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Dismiss"
              className="absolute inset-0 cursor-default bg-overlay"
              onClick={() => setCelebrate(null)}
            />
            <m.div
              role="status"
              className="hero-surface-paper relative flex max-w-xs flex-col items-center gap-1.5 overflow-hidden rounded-3xl px-8 py-7 text-center"
              initial={shouldAnimate ? { scale: 0.7, rotate: -8, opacity: 0 } : undefined}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              exit={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
              transition={{ type: "spring", stiffness: 360, damping: 16 }}
            >
              <HeroSunburst className="h-6 w-6 text-hero-gold" rays={12} />
              <span className="text-4xl" aria-hidden="true">
                {celebrate.emoji}
              </span>
              <p className="text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
                New tier unlocked
              </p>
              <p className={cn("font-display text-xl font-bold text-hero-accent")}>
                You&apos;re now {celebrate.name}!
              </p>
              <p className="font-burmese text-sm text-hero-ink-muted" lang="my">
                {celebrate.english} · ဂုဏ်ယူပါတယ်
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default TierUpCelebration;
