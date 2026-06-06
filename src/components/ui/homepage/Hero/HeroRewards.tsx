"use client";

/**
 * HeroRewards — Morning Star Rewards as a "ကြယ်ဆု" (star-reward) CONSTELLATION.
 * An asymmetric editorial standout: the left column states the value prop + a
 * live perk panel; the right column is a constellation of radiant GEMSTARS — each
 * loyalty tier is a luminous star in its gem's true colour (clay → jade-green →
 * ruby-red → gold), with a soft radial glow, 8-point sparkle rays and a bright
 * jewel core. The path lights up segment-by-segment as you climb to the Gold
 * apex "Morning Star" (a full sunburst). Hover / tap / focus a gemstar to preview
 * its perks. Value-prop only (no auth) — numbers come from LOYALTY_TIERS /
 * TIER_PERKS.
 *
 * Perf/a11y: glows are radial-gradients (no blur backing store); float+twinkle
 * is one CSS transform animation (pauses offscreen via .hero-anim-paused); only
 * the active glow + one path shimmer loop in JS, gated on `shouldAnimate`. The
 * visible panel updates on hover; a separate sr-only aria-live region announces
 * only on focus/click. Within the mobile GPU budget. Burmese tier names are in
 * script (flagged for native review).
 */

import { useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Star, Gift, Sparkles, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, TIER_PERKS, type LoyaltyTierId, type LoyaltyPerk } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";

/** Per-tier jewel colour (color-accurate) + Burmese-script name. */
const TIER: Record<LoyaltyTierId, { color: string; my: string }> = {
  new: { color: "#d97757", my: "မိတ်ဆွေသစ်" }, // clay
  jade: { color: "#2fa572", my: "ကျောက်စိမ်း" }, // jade green
  ruby: { color: "#d62246", my: "ပတ္တမြား" }, // ruby red
  gold: { color: "#eaa92f", my: "ရွှေ" }, // gold
};

/** Constellation anchors (% of stage) + gemstar size (px) — a non-linear climb. */
const STAR_POS = [
  { x: 18, y: 70, size: 32 },
  { x: 40, y: 45, size: 40 },
  { x: 62, y: 58, size: 48 },
  { x: 80, y: 28, size: 58 },
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

/** A luminous gemstar: 8-point sparkle rays + a bright white jewel core + glint. */
function GemStar({ color, id, className }: { color: string; id: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="78%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      {/* secondary diagonal rays (shorter, fainter) */}
      <g opacity="0.5" transform="rotate(45 24 24)">
        <polygon points="24,9 26,24 24,39 22,24" fill={color} />
        <polygon points="9,24 24,22 39,24 24,26" fill={color} />
      </g>
      {/* primary 4-point rays */}
      <polygon points="24,1 27,24 24,47 21,24" fill={color} />
      <polygon points="1,24 24,21 47,24 24,27" fill={color} />
      {/* bright jewel core + specular glint */}
      <circle cx="24" cy="24" r="7" fill={`url(#${id})`} />
      <circle cx="21" cy="21" r="1.7" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  // `active` drives the visual highlight + the visible detail panel (hover/focus/
  // click). `announced` drives the sr-only live region (focus/click only).
  const [active, setActive] = useState(0);
  const [announced, setAnnounced] = useState(0);
  const tier = LOYALTY_TIERS[active] ?? LOYALTY_TIERS[0];
  const jewel = TIER[tier.id];
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

          {/* Live perk panel for the active gemstar (visible; the sr-only announcer
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
                <p className="flex items-center gap-1.5 text-base font-semibold text-hero-ink">
                  <GemStar
                    color={jewel.color}
                    id={`gs-panel-${tier.id}`}
                    className="h-4 w-4 shrink-0"
                  />
                  {tier.english}
                  <span className="font-burmese text-sm font-normal text-hero-ink-muted">
                    {jewel.my}
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

        {/* RIGHT — the ကြယ်ဆု gemstar constellation */}
        <div className="relative h-56 w-full md:h-60">
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
                <stop offset="0%" stopColor="#d97757" />
                <stop offset="38%" stopColor="#2fa572" />
                <stop offset="70%" stopColor="#d62246" />
                <stop offset="100%" stopColor="#eaa92f" />
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

          {/* Tier gemstars */}
          <ol>
            {LOYALTY_TIERS.map((t, i) => {
              const j = TIER[t.id];
              const p = STAR_POS[i];
              const isActive = i === active;
              const earned = i <= active;
              const glow = p.size * 2;
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
                    className="group relative grid place-items-center rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
                  >
                    {/* Soft radial glow (no blur — radial-gradient falloff) */}
                    <m.span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: glow,
                        height: glow,
                        background: `radial-gradient(circle, ${j.color} 0%, transparent 66%)`,
                      }}
                      animate={
                        shouldAnimate && isActive
                          ? { opacity: [0.45, 0.75, 0.45] }
                          : { opacity: isActive ? 0.7 : earned ? 0.4 : 0.16 }
                      }
                      transition={
                        shouldAnimate && isActive
                          ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                          : { duration: 0.3 }
                      }
                    />
                    {/* Sunburst rays behind the Gold apex */}
                    {t.id === "gold" && (
                      <HeroSunburst
                        className={cn(
                          "pointer-events-none absolute h-20 w-20 text-amber-500 transition-opacity duration-300",
                          isActive ? "opacity-80" : "opacity-50"
                        )}
                        rays={12}
                      />
                    )}
                    {/* Gemstar */}
                    <span
                      className={cn(
                        "hero-gem-float relative block transition-opacity duration-300",
                        isActive ? "opacity-100" : earned ? "opacity-95" : "opacity-55"
                      )}
                      style={
                        {
                          width: p.size,
                          height: p.size,
                          "--gem-dur": `${3.6 + i * 0.5}s`,
                          "--gem-delay": `${i * 0.35}s`,
                        } as CSSProperties
                      }
                    >
                      <GemStar color={j.color} id={`gs-${t.id}`} className="h-full w-full" />
                    </span>
                    {/* Label */}
                    <span
                      className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap text-center"
                      style={{ marginTop: glow / 2 - p.size / 2 - 2 }}
                    >
                      <span
                        className={cn(
                          "block text-2xs font-semibold transition-colors md:text-xs",
                          isActive ? "text-hero-accent" : "text-hero-ink"
                        )}
                      >
                        {t.english}
                      </span>
                      <span className="block font-burmese text-[0.625rem] leading-tight text-hero-ink-muted">
                        {j.my}
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
