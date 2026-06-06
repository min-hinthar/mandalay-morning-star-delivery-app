"use client";

/**
 * HeroRewards — Morning Star Rewards as a "ကြယ်ဆု" (star-reward) CONSTELLATION.
 * An asymmetric editorial standout: the left column states the value prop + a
 * live perk panel; the right column is a star constellation — each loyalty tier
 * is a star, and the path lights up segment-by-segment as you climb toward the
 * apex "Morning Star" (Gold). Hover / tap / focus a star to preview its perks
 * ($ reward + unlock + bilingual benefits). Value-prop only (no auth) — every
 * number comes from LOYALTY_TIERS / TIER_PERKS.
 *
 * Perf/a11y: only the active star's halo + a single path shimmer animate
 * (transform/opacity/pathLength), gated on `shouldAnimate`, pausing offscreen
 * (.hero-anim-paused). The visible panel updates on hover for sighted users; a
 * separate sr-only aria-live region announces only on focus/click (no SR spam on
 * a mouse sweep). No full-screen blur()/backdrop-filter — within the mobile GPU
 * budget. Burmese tier names are in script (flagged for native review).
 */

import { useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Star, Gift, Sparkles, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, TIER_PERKS, type LoyaltyTierId, type LoyaltyPerk } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";

/** Per-tier star: triad + gold apex (token-pure), Burmese-script name, glyph. */
const TIER_STAR: Record<
  LoyaltyTierId,
  { text: string; halo: string; stroke: string; my: string; glyph: string }
> = {
  new: { text: "text-hero-clay", halo: "bg-hero-clay/30", stroke: "var(--hero-clay)", my: "မိတ်ဆွေသစ်", glyph: "✦" },
  jade: { text: "text-hero-sage", halo: "bg-hero-sage/35", stroke: "var(--hero-sage)", my: "ကျောက်စိမ်း", glyph: "★" },
  ruby: { text: "text-hero-blue", halo: "bg-hero-blue/35", stroke: "var(--hero-blue)", my: "ပတ္တမြား", glyph: "★" },
  gold: { text: "text-amber-500", halo: "bg-amber-400/40", stroke: "rgb(245 158 11)", my: "ရွှေ", glyph: "★" },
}; // prettier-ignore

/** Constellation anchors (% of the stage) — a non-linear climb to the Gold apex. */
const STAR_POS = [
  { x: 15, y: 72, size: "text-xl md:text-2xl" },
  { x: 39, y: 45, size: "text-2xl md:text-3xl" },
  { x: 63, y: 60, size: "text-3xl md:text-4xl" },
  { x: 86, y: 26, size: "text-4xl md:text-5xl" },
];
const LINE_POINTS = STAR_POS.map((p) => `${p.x},${p.y}`).join(" ");

/** Decorative background "sky" twinkles (deterministic). */
const SKY = Array.from({ length: 6 }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  return {
    top: `${10 + r(1) * 80}%`,
    left: `${6 + r(2) * 88}%`,
    size: 2 + Math.round(r(3) * 2),
    dur: `${3 + r(4) * 3}s`,
    delay: `${r(5) * 3}s`,
  };
});

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
  const star = TIER_STAR[tier.id];
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
              Morning Star Rewards{" "}
              <span className="font-burmese normal-case tracking-normal">· ကြယ်ဆုလက်ဆောင်</span>
            </span>
          </div>

          <h3
            id="hero-rewards-heading"
            className="font-display text-2xl font-semibold leading-[1.1] text-hero-ink md:text-3xl"
          >
            Collect stars, unlock rewards
            <span className="mt-0.5 block font-burmese text-sm font-normal text-hero-ink-muted md:text-base">
              ကြယ်ဆု · အော်ဒါတိုင်း ကြယ်တစ်လုံး
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

          {/* Live perk panel for the active star (visible; the sr-only announcer
              below carries focus/click updates so hover can't spam screen readers). */}
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
                  <span aria-hidden="true" className={cn("text-lg leading-none", star.text)}>
                    {star.glyph}
                  </span>
                  {tier.english}
                  <span className="font-burmese text-sm font-normal text-hero-ink-muted">
                    {star.my}
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

        {/* RIGHT — the ကြယ်ဆု constellation */}
        <div className="relative h-52 w-full md:h-56">
          {/* Background sky twinkles */}
          {SKY.map((s, i) => (
            <span
              key={`sky-${i}`}
              aria-hidden="true"
              className="hero-twinkle absolute rounded-full bg-hero-ink/25"
              style={
                {
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  "--twinkle-dur": s.dur,
                  "--twinkle-delay": s.delay,
                } as CSSProperties
              }
            />
          ))}

          {/* Constellation lines: faint base + segments that light up to `active` */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-constellation" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hero-clay)" />
                <stop offset="40%" stopColor="var(--hero-sage)" />
                <stop offset="70%" stopColor="var(--hero-blue)" />
                <stop offset="100%" stopColor="rgb(245 158 11)" />
              </linearGradient>
            </defs>
            <polyline
              points={LINE_POINTS}
              fill="none"
              stroke="var(--hero-ink)"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.14}
            />
            {STAR_POS.slice(0, -1).map((p, i) => {
              const next = STAR_POS[i + 1];
              const lit = active >= i + 1;
              return (
                <m.line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="url(#hero-constellation)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={false}
                  animate={{ opacity: lit ? 0.85 : 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              );
            })}
            {shouldAnimate && (
              <m.polyline
                points={LINE_POINTS}
                fill="none"
                stroke="url(#hero-constellation)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>

          {/* Tier stars */}
          <ol>
            {LOYALTY_TIERS.map((t, i) => {
              const s = TIER_STAR[t.id];
              const p = STAR_POS[i];
              const isActive = i === active;
              const earned = i <= active;
              return (
                <li
                  key={t.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
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
                    className="group relative grid place-items-center rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/60"
                  >
                    {/* Sunburst rays behind the Gold apex */}
                    {t.id === "gold" && (
                      <HeroSunburst
                        className={cn(
                          "pointer-events-none absolute h-12 w-12 text-amber-500 transition-opacity duration-300 md:h-16 md:w-16",
                          isActive ? "opacity-70" : "opacity-40"
                        )}
                        rays={12}
                      />
                    )}
                    {/* Soft halo (radial via bg + opacity; pulses only when active) */}
                    <m.span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute h-9 w-9 rounded-full blur-md md:h-11 md:w-11",
                        s.halo
                      )}
                      animate={
                        shouldAnimate && isActive
                          ? { opacity: [0.6, 1, 0.6] }
                          : { opacity: isActive ? 0.9 : earned ? 0.4 : 0.15 }
                      }
                      transition={
                        shouldAnimate && isActive
                          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                          : { duration: 0.3 }
                      }
                    />
                    {/* Star glyph */}
                    <span
                      className={cn(
                        "relative leading-none transition-all duration-300",
                        p.size,
                        s.text,
                        isActive ? "scale-110" : earned ? "scale-100" : "scale-90 opacity-45"
                      )}
                    >
                      {s.glyph}
                    </span>
                    {/* Label */}
                    <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-center">
                      <span
                        className={cn(
                          "block text-2xs font-semibold transition-colors md:text-xs",
                          isActive ? "text-hero-accent" : "text-hero-ink"
                        )}
                      >
                        {t.english}
                      </span>
                      <span className="block font-burmese text-[0.625rem] leading-tight text-hero-ink-muted">
                        {s.my}
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
