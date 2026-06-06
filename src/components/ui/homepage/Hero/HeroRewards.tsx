"use client";

/**
 * HeroRewards — Morning Star Rewards (ရွှေကြယ် ဆုလက်ဆောင်မွန်) as a star-reward
 * CONSTELLATION. Asymmetric editorial standout: left column = value prop + a
 * live perk panel (height locked to the tallest tier so selecting one never
 * shifts the layout); right column = the loyalty tiers as emoji-in-faceted-disc
 * nodes on an upward ARC. A light "comet" travels the arc; selecting a tier
 * lights the arc up to it (connect-on-select). Value-prop only (no auth) —
 * numbers from LOYALTY_TIERS / TIER_PERKS.
 *
 * Micro-interactions: magnetic node hover, star-burst on select, reward-$ and
 * unlock-$ count-up (RollingNumber), card sheen sweep. Perf/a11y: glows are
 * radial-gradients (no blur); float + sheen + comet are transform/stroke only,
 * gated on `shouldAnimate` and pausing offscreen (.hero-anim-paused). The
 * visible panel updates on hover; a separate sr-only aria-live region announces
 * only on focus/click. Burmese is in script (flagged for native review).
 */

import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Star, Gift, Sparkles, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  LOYALTY_TIERS,
  TIER_PERKS,
  type LoyaltyTier,
  type LoyaltyTierId,
  type LoyaltyPerk,
} from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";
import { TierNode } from "./HeroRewardsNode";
import { RollingNumber } from "./RollingDigits";
import { useBurst, Bursts } from "./HeroBurst";

/** Per-tier node: non-heart emoji + ring/glow (decorative) + Burmese-script name. */
const TIER: Record<LoyaltyTierId, { emoji: string; ring: string; glow: string; my: string }> = {
  new: { emoji: "⭐", ring: "ring-hero-clay/60", glow: "var(--hero-clay)", my: "မိတ်ဆွေသစ်" },
  jade: { emoji: "💎", ring: "ring-hero-blue/70", glow: "#6a9bcc", my: "စိန်" },
  ruby: { emoji: "♦️", ring: "ring-hero-accent/70", glow: "#e0556b", my: "ပတ္တမြား" },
  gold: { emoji: "👑", ring: "ring-hero-clay/70", glow: "#eaa92f", my: "ရွှေ" },
}; // prettier-ignore

/** Constellation anchors (% of stage) — a smooth upward ARC to the Gold apex. */
const ARC = [
  { x: 15, y: 70 },
  { x: 38, y: 50 },
  { x: 62, y: 44 },
  { x: 85, y: 24 },
];

/** Smooth Catmull-Rom spline `d` through the arc points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x},${p2.y}`;
  }
  return d;
}
const ARC_D = smoothPath(ARC);

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

const MY_DIGITS = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

function dollars(cents: number) {
  return Math.round(cents / 100);
}
/** Latin integer → Burmese numerals (e.g. 1500 → ၁၅၀၀). */
function toMyanmar(n: number): string {
  return String(n).replace(/\d/g, (d) => MY_DIGITS[Number(d)]);
}
function perkLabel(perk: LoyaltyPerk) {
  return `${perk.en} — ${perk.my}`;
}

/**
 * The perk-panel content for one tier. Rendered once live (animated) and once
 * per tier as an invisible spacer stacked in the same grid cell, so the panel's
 * height is locked to the TALLEST tier — selecting never reflows the card.
 */
function PerkPanelBody({ tier, animate }: { tier: LoyaltyTier; animate: boolean }) {
  const node = TIER[tier.id];
  const perks = TIER_PERKS[tier.id];
  const isStart = tier.minSpendCents === 0;

  return (
    <>
      <p className="flex items-center gap-1.5 text-base font-semibold text-hero-ink">
        <span aria-hidden="true" className="text-xl">
          {node.emoji}
        </span>
        {tier.english}
        <span className="font-burmese text-[0.95rem] font-normal leading-none text-hero-ink/70">
          {node.my}
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
      <ul className="mt-2.5 space-y-1.5">
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

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  const [active, setActive] = useState(0);
  const [announced, setAnnounced] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const { bursts, fire } = useBurst(10);

  const tier = LOYALTY_TIERS[active] ?? LOYALTY_TIERS[0];
  const announcedTier = LOYALTY_TIERS[announced] ?? LOYALTY_TIERS[0];
  const litFraction = active / (LOYALTY_TIERS.length - 1);

  const select = (i: number, e?: { clientX: number; clientY: number }) => {
    setActive(i);
    setAnnounced(i);
    if (e && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      fire(e.clientX - r.left, e.clientY - r.top);
    }
  };

  return (
    <section
      aria-labelledby="hero-rewards-heading"
      className={cn(
        "relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl hero-surface-vellum px-5 py-6 md:px-8 md:py-8",
        className
      )}
    >
      <HeroCardLayers accent="clay" radius="rounded-3xl" />

      {/* Card sheen sweep */}
      {shouldAnimate && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
        >
          <div className="animate-hero-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      )}

      <div className="relative grid gap-6 md:grid-cols-[0.82fr_1.18fr] md:items-center md:gap-10">
        {/* LEFT — editorial value prop + live perk panel */}
        <div className="text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 text-hero-accent md:justify-start">
            <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} />
            <span className="text-2xs font-semibold uppercase tracking-[0.2em] md:text-xs">
              Morning Star Rewards{" "}
              <span className="font-burmese text-[0.72rem] normal-case tracking-normal">
                · ရွှေကြယ် ဆုလက်ဆောင်မွန်
              </span>
            </span>
          </div>

          <h3
            id="hero-rewards-heading"
            className="font-display text-2xl font-semibold leading-[1.1] text-hero-ink md:text-3xl"
          >
            Collect stars, unlock rewards
          </h3>

          <p className="mt-2 text-sm font-medium text-hero-ink-muted md:text-[0.9rem]">
            Earn a{" "}
            <Star
              className="mb-0.5 inline h-4 w-4 fill-amber-500 text-amber-500"
              aria-hidden="true"
            />{" "}
            <span className="font-semibold text-hero-accent">Star</span> every order — a thank-you
            reward every <span className="font-semibold text-hero-accent">5</span>, bigger each
            tier.
          </p>
          <p className="mt-2 font-burmese text-[0.9rem] leading-loose text-hero-ink/75">
            အော်ဒါတစ်ခါ မှာယူတိုင်း ရွှေကြယ်တစ်ပွင့် ရယူပြီး၊ ရွှေကြယ် ငါးခုလျှင် အဆင့်လိုက်
            သတ်မှတ်ထားသော ဆုလက်ဆောင်များ ရယူလိုက်ပါ။
          </p>

          {/* Live perk panel — grid-stacked spacers lock height to the tallest tier
              so hovering/selecting a tier never reflows the card. */}
          <div className="mt-4 grid rounded-2xl bg-hero-card/55 p-3.5 text-left ring-1 ring-hero-line">
            {LOYALTY_TIERS.map((t) => (
              <div
                key={`measure-${t.id}`}
                aria-hidden="true"
                className="invisible col-start-1 row-start-1"
              >
                <PerkPanelBody tier={t} animate={false} />
              </div>
            ))}
            <AnimatePresence mode="wait">
              <m.div
                key={tier.id}
                className="col-start-1 row-start-1"
                initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <PerkPanelBody tier={tier} animate={shouldAnimate} />
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — the ရွှေကြယ် arc constellation */}
        <div ref={stageRef} className="relative h-56 w-full md:h-64">
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

          {/* Arc: faint base + lit-to-active (connect-on-select) + traveling comet */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-arc" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#d97757" />
                <stop offset="40%" stopColor="#6a9bcc" />
                <stop offset="70%" stopColor="#e0556b" />
                <stop offset="100%" stopColor="#eaa92f" />
              </linearGradient>
            </defs>
            <path
              d={ARC_D}
              fill="none"
              stroke="var(--hero-ink)"
              strokeWidth={1}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.14}
            />
            {/* lit up to the active node */}
            <m.path
              d={ARC_D}
              fill="none"
              stroke="url(#hero-arc)"
              strokeWidth={2.25}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={false}
              animate={{ pathLength: litFraction || 0.001, opacity: 0.85 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* traveling comet (a bright dash sweeping the arc) */}
            {shouldAnimate && (
              <m.path
                d={ARC_D}
                fill="none"
                stroke="url(#hero-arc)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="0.14 0.86"
                animate={{ strokeDashoffset: [0, -1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>

          {/* Tier nodes */}
          <ol>
            {LOYALTY_TIERS.map((t, i) => {
              const n = TIER[t.id];
              const p = ARC[i];
              return (
                <li
                  key={t.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <TierNode
                    emoji={n.emoji}
                    english={t.english}
                    my={n.my}
                    ring={n.ring}
                    glow={n.glow}
                    glowSize={t.id === "gold" ? 92 : 74}
                    isGold={t.id === "gold"}
                    isActive={i === active}
                    earned={i <= active}
                    shouldAnimate={shouldAnimate}
                    index={i}
                    ariaLabel={`${t.english} tier${
                      t.minSpendCents === 0
                        ? ""
                        : `, unlock at $${dollars(t.minSpendCents)} lifetime`
                    }, $${dollars(t.rewardCents)} reward`}
                    onHover={() => setActive(i)}
                    onSelect={(e) => select(i, e)}
                  />
                </li>
              );
            })}
          </ol>

          {/* Star-burst particles on select */}
          <Bursts bursts={bursts} />
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
