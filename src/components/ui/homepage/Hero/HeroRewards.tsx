"use client";

/**
 * HeroRewards — Morning Star Rewards "gem journey".
 * An asymmetric, editorial standout: a left column states the value prop + a
 * live perk panel; a right column renders the Burmese-gem tiers as an ASCENDING
 * climb on a diagonal rail (energy pulses along the path). Hover/tap/focus a gem
 * to preview its perks ($ reward + unlock + bilingual benefits). Value-prop only
 * (no auth) — every number comes from LOYALTY_TIERS / TIER_PERKS.
 *
 * Perf/a11y: gem float, facet sheen and the rail-energy pulse are transform/
 * opacity/pathLength only (60fps), gated on `shouldAnimate`, and pause offscreen
 * (.hero-anim-paused). The visible detail panel updates on hover for sighted
 * users; a separate sr-only aria-live region announces only on focus/click so a
 * mouse sweep can't spam screen readers. Small fixed-size blurs only — no
 * full-screen blur()/backdrop-filter, so it stays within the mobile GPU budget.
 */

import { useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Star, Gift, Sparkles, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, TIER_PERKS, type LoyaltyTierId, type LoyaltyPerk } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";

/** Per-gem accent for decorative shapes only (ring + halo) — never text color. */
const GEM_ACCENT: Record<LoyaltyTierId, { ring: string; halo: string }> = {
  new: { ring: "ring-hero-clay/60", halo: "bg-amber-400/35" },
  jade: { ring: "ring-hero-sage/70", halo: "bg-hero-sage/40" },
  ruby: { ring: "ring-hero-accent/70", halo: "bg-rose-400/35" },
  gold: { ring: "ring-hero-clay/70", halo: "bg-amber-400/45" },
};

/** Ascending anchor points (% of the stage) — the literal "climb" left→right. */
const GEM_POS = [
  { x: 11, y: 72 },
  { x: 37, y: 53 },
  { x: 63, y: 34 },
  { x: 89, y: 15 },
];

const RAIL_POINTS = GEM_POS.map((p) => `${p.x},${p.y}`).join(" ");

const FACET =
  "conic-gradient(from 140deg, transparent, rgba(255,255,255,0.45), transparent 40%, rgba(255,255,255,0.25), transparent 75%)";

const PERK_ICON = { star: Star, gift: Gift, sparkles: Sparkles, crown: Crown, clock: Clock };

function dollars(cents: number) {
  return Math.round(cents / 100);
}

function perkLabel(perk: LoyaltyPerk) {
  return `${perk.en} — ${perk.my}`;
}

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  // `active` drives the visual highlight + the visible detail panel (hover/focus/
  // click). `announced` drives the sr-only live region (focus/click only).
  const [active, setActive] = useState(0);
  const [announced, setAnnounced] = useState(0);
  const tier = LOYALTY_TIERS[active] ?? LOYALTY_TIERS[0];
  const perks = TIER_PERKS[tier.id];
  const announcedTier = LOYALTY_TIERS[announced] ?? LOYALTY_TIERS[0];
  const unlockText =
    tier.minSpendCents === 0
      ? "Start here — welcome aboard"
      : `Unlock at $${dollars(tier.minSpendCents)} lifetime`;

  const select = (i: number) => {
    setActive(i);
    setAnnounced(i);
  };

  return (
    <section
      aria-labelledby="hero-rewards-heading"
      className={cn(
        "relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl hero-surface-vellum px-5 py-6 md:px-8 md:py-7",
        className
      )}
    >
      <HeroCardLayers accent="clay" radius="rounded-3xl" />

      <div className="relative grid gap-6 md:grid-cols-[0.84fr_1.16fr] md:items-center md:gap-8">
        {/* LEFT — editorial value prop + live perk panel */}
        <div className="text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 text-hero-accent md:justify-start">
            <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} />
            <span className="text-2xs font-semibold uppercase tracking-[0.2em] md:text-xs">
              Morning Star Rewards
            </span>
          </div>

          <h3
            id="hero-rewards-heading"
            className="font-display text-2xl font-semibold leading-[1.1] text-hero-ink md:text-3xl"
          >
            Climb the gem ladder
            <span className="mt-0.5 block font-burmese text-sm font-normal text-hero-ink-muted md:text-base">
              ကျောက်မျက် အဆင့်များ
            </span>
          </h3>

          <p className="mt-2 text-sm font-medium text-hero-ink-muted md:text-[0.9rem]">
            Earn a{" "}
            <Star
              className="mb-0.5 inline h-4 w-4 fill-amber-500 text-amber-500"
              aria-hidden="true"
            />{" "}
            <span className="font-semibold text-hero-accent">Star</span> every order — a thank-you
            reward every <span className="font-semibold text-hero-accent">5</span>.
          </p>

          {/* Live perk panel for the active gem (visible; not a live region — see
              the sr-only announcer below so hover doesn't spam screen readers). */}
          <div className="mt-4 min-h-[6.5rem] rounded-2xl bg-hero-card/55 p-3 text-left ring-1 ring-hero-line">
            <AnimatePresence mode="wait">
              <m.div
                key={tier.id}
                initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <p className="flex items-baseline gap-1.5 text-base font-semibold text-hero-ink">
                  <span aria-hidden="true">{tier.emoji}</span>
                  {tier.english}
                  <span className="font-burmese text-sm font-normal text-hero-ink-muted">
                    {tier.name}
                  </span>
                </p>
                <p className="text-xs text-hero-ink-muted">
                  <span className="font-semibold text-hero-accent">
                    ${dollars(tier.rewardCents)} reward
                  </span>{" "}
                  · {unlockText}
                </p>
                <ul className="mt-2 space-y-1">
                  {perks.map((perk) => {
                    const Icon = PERK_ICON[perk.icon];
                    return (
                      <li key={perk.en} className="flex items-start gap-1.5">
                        <Icon
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hero-clay"
                          aria-hidden="true"
                        />
                        <span className="text-xs leading-snug text-hero-ink">
                          {perk.en}
                          <span className="ml-1 font-burmese text-hero-ink-muted">· {perk.my}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — the ascending gem climb */}
        <div className="relative h-44 w-full md:h-52">
          {/* Diagonal rail + energy pulse (pathLength = compositor-friendly) */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-rewards-rail" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hero-clay)" />
                <stop offset="55%" stopColor="var(--hero-sage)" />
                <stop offset="100%" stopColor="rgb(251 191 36)" />
              </linearGradient>
            </defs>
            <polyline
              points={RAIL_POINTS}
              fill="none"
              stroke="url(#hero-rewards-rail)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.35}
            />
            {shouldAnimate && (
              <m.polyline
                points={RAIL_POINTS}
                fill="none"
                stroke="url(#hero-rewards-rail)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>

          {/* Gems anchored on the rail */}
          <ol>
            {LOYALTY_TIERS.map((t, i) => {
              const accent = GEM_ACCENT[t.id];
              const pos = GEM_POS[i];
              const isActive = i === active;
              return (
                <li
                  key={t.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`${t.english} tier${
                      t.minSpendCents === 0
                        ? ""
                        : `, unlock at $${dollars(t.minSpendCents)} lifetime`
                    }, $${dollars(t.rewardCents)} reward`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => select(i)}
                    onClick={() => select(i)}
                    className="group relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/60"
                  >
                    {/* glow halo when active (single small blur — budget-safe) */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute -inset-2 rounded-full blur-md transition-opacity duration-300",
                        accent.halo,
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {/* faceted gem disc */}
                    <span
                      className={cn(
                        "hero-gem-float relative grid h-11 w-11 place-items-center overflow-hidden rounded-full ring-2 hero-surface-paper transition-transform duration-300 md:h-14 md:w-14",
                        accent.ring,
                        isActive ? "scale-110 ring-[3px]" : "scale-100"
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
                      <span className="relative text-lg md:text-2xl">{t.emoji}</span>
                    </span>
                    {/* label under the disc (absolute so it never shifts the disc) */}
                    <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-center">
                      <span
                        className={cn(
                          "block text-2xs font-semibold transition-colors md:text-xs",
                          isActive ? "text-hero-accent" : "text-hero-ink"
                        )}
                      >
                        {t.english}
                      </span>
                      <span className="block font-burmese text-[0.625rem] leading-tight text-hero-ink-muted">
                        {t.name}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Intentional announcements only (focus/click) — not hover. */}
      <span className="sr-only" aria-live="polite">
        {announcedTier.english} tier, ${dollars(announcedTier.rewardCents)} reward.{" "}
        {TIER_PERKS[announcedTier.id].map(perkLabel).join(". ")}
      </span>
    </section>
  );
}
