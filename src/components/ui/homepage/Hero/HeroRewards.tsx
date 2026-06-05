"use client";

/**
 * HeroRewards — Morning Star Rewards "gem journey".
 * An interactive Burmese-gem tier ladder: faceted gems that shimmer + float on
 * a progress rail with a traveling spark; hover/tap/focus a gem to reveal its
 * perk ($ reward + unlock threshold) in a live detail line. Value-prop (no auth).
 */

import { useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, type LoyaltyTierId } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";

/** Per-gem accent (ring + halo) — gem-appropriate, not the strict triad */
const GEM_ACCENT: Record<LoyaltyTierId, { ring: string; halo: string }> = {
  new: { ring: "ring-hero-clay/60", halo: "bg-amber-400/35" },
  jade: { ring: "ring-hero-sage/70", halo: "bg-hero-sage/35" },
  ruby: { ring: "ring-hero-accent/70", halo: "bg-rose-400/35" },
  gold: { ring: "ring-hero-clay/70", halo: "bg-amber-400/40" },
};

const FACET =
  "conic-gradient(from 140deg, transparent, rgba(255,255,255,0.45), transparent 40%, rgba(255,255,255,0.25), transparent 75%)";

function dollars(cents: number) {
  return Math.round(cents / 100);
}

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  const [active, setActive] = useState(0);
  const tier = LOYALTY_TIERS[active] ?? LOYALTY_TIERS[0];
  const unlockText =
    tier.minSpendCents === 0
      ? "Start here — welcome aboard"
      : `Unlock at $${dollars(tier.minSpendCents)} lifetime`;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl hero-surface-vellum px-5 py-6 md:px-8",
        className
      )}
    >
      <HeroCardLayers accent="clay" radius="rounded-3xl" />

      {/* Kicker */}
      <div className="relative mb-2 flex items-center justify-center gap-2 text-hero-accent">
        <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} />
        <span className="text-2xs font-semibold uppercase tracking-[0.2em] md:text-xs">
          Morning Star Rewards · ကြယ်ဆုလက်ဆောင်
        </span>
      </div>

      {/* Earn line */}
      <p className="relative mb-6 text-center text-sm font-medium text-hero-ink md:text-base">
        Earn a{" "}
        <Star className="mb-0.5 inline h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />{" "}
        <span className="font-semibold text-hero-accent">Star</span> every order — a thank-you
        reward every{" "}
        <span className="rounded bg-hero-card px-1 font-semibold text-hero-accent">5</span>.
      </p>

      {/* Gem journey rail */}
      <div className="relative">
        {/* rail + traveling spark */}
        <div className="absolute inset-x-[12%] top-7 h-0.5 rounded-full bg-gradient-to-r from-hero-clay/30 via-hero-sage/30 to-amber-400/50">
          {shouldAnimate && (
            <span
              className="hero-rail-spark absolute left-0 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <span className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/70 blur-sm" />
              <span className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200" />
            </span>
          )}
        </div>

        <ol className="relative flex items-start justify-between">
          {LOYALTY_TIERS.map((t, i) => {
            const accent = GEM_ACCENT[t.id];
            const isActive = i === active;
            return (
              <li key={t.id} className="flex w-1/4 justify-center">
                <button
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${t.english} tier${t.minSpendCents === 0 ? "" : `, unlock at $${dollars(t.minSpendCents)}`}, $${dollars(t.rewardCents)} reward`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="group flex flex-col items-center gap-1.5 rounded-2xl px-1 pt-0.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
                >
                  <span
                    className={cn(
                      "relative grid place-items-center transition-transform duration-300",
                      isActive ? "scale-110" : "scale-100"
                    )}
                  >
                    {/* glow halo when active */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute -inset-1.5 rounded-full blur-md transition-opacity duration-300",
                        accent.halo,
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {/* faceted gem disc */}
                    <span
                      className={cn(
                        "hero-gem-float relative grid h-12 w-12 place-items-center overflow-hidden rounded-full ring-2 hero-surface-paper md:h-14 md:w-14",
                        accent.ring,
                        isActive && "ring-[3px]"
                      )}
                      style={
                        {
                          "--gem-dur": `${3.4 + i * 0.4}s`,
                          "--gem-delay": `${i * 0.3}s`,
                        } as CSSProperties
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="hero-gem-spin absolute inset-0 opacity-50 mix-blend-overlay"
                        style={{ background: FACET }}
                      />
                      <span className="relative text-xl md:text-2xl">{t.emoji}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-2xs font-semibold transition-colors md:text-xs",
                      isActive ? "text-hero-accent" : "text-hero-ink"
                    )}
                  >
                    {t.english}
                  </span>
                  <span className="font-burmese text-[0.625rem] leading-tight text-hero-ink-muted">
                    {t.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Live perk detail for the active gem */}
      <div className="relative mt-5 min-h-[2.75rem] text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <m.div
            key={tier.id}
            initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p className="text-base font-semibold text-hero-ink">
              {tier.emoji} {tier.english}{" "}
              <span className="font-burmese text-sm font-normal text-hero-ink-muted">
                {tier.name}
              </span>
            </p>
            <p className="text-sm text-hero-ink-muted">
              <span className="font-semibold text-hero-accent">
                ${dollars(tier.rewardCents)} reward
              </span>{" "}
              · {unlockText}
            </p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
