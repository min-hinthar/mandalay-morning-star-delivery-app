"use client";

/**
 * HeroRewards — Morning Star Rewards (ရွှေကြယ် ဆုလက်ဆောင်မွန်) as a compact,
 * COLLAPSIBLE horizontal RAIL. Collapsed by default (leanest hero): a slim band
 * with the kicker, a "up to $X reward" teaser + chevron, and the four loyalty
 * tiers as emoji-in-faceted-disc nodes strung along a horizontal progress SPINE
 * (faint base + lit-to-active gradient + a traveling comet shimmer). Hovering /
 * selecting a tier lights the spine up to it (connect-on-select). The chevron —
 * or tapping any tier — expands a perk-detail panel below. Value-prop only (no
 * auth); numbers from LOYALTY_TIERS / TIER_PERKS.
 *
 * Micro-interactions: magnetic node hover, star-burst on select, reward-$
 * count-up (RollingNumber), card sheen sweep, expand/collapse height spring.
 * Perf/a11y: glows are radial-gradients (no blur); transform/width-only motion
 * gated on `shouldAnimate`. The comet + active-node glow are JS loops, so they
 * pause offscreen via `useInView` on the stage; CSS loops (float/sheen/twinkle)
 * pause via `.hero-anim-paused`. The visible panel updates on hover; a separate
 * sr-only aria-live region announces only on focus/click. Jewel colors are
 * tokens (`var(--hero-*)`), never raw hex. Burmese flagged for native review.
 */

import { useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "framer-motion";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { LOYALTY_TIERS, TIER_PERKS, type LoyaltyTierId } from "@/lib/loyalty";
import { HeroCardLayers } from "./HeroCardLayers";
import { HeroSunburst } from "./HeroSunburst";
import { RewardsRailNode } from "./RewardsRailNode";
import { RewardsPerkPanel } from "./RewardsPerkPanel";
import { RollingNumber } from "./RollingDigits";
import { useBurst, Bursts } from "./HeroBurst";

/**
 * Per-tier decoration: ring/glow (token colors) + native-script Burmese name.
 * The EMOJI is NOT duplicated here — it's read from LOYALTY_TIERS[].emoji so the
 * hero, account ladder, and loyalty emails can never drift (⭐💎♦️👑).
 */
const TIER: Record<LoyaltyTierId, { ring: string; glow: string; my: string }> = {
  new: { ring: "ring-hero-clay/60", glow: "var(--hero-clay)", my: "မိတ်ဆွေသစ်" },
  jade: { ring: "ring-hero-blue/70", glow: "var(--hero-blue)", my: "စိန်" },
  ruby: { ring: "ring-hero-ruby/70", glow: "var(--hero-ruby)", my: "ပတ္တမြား" },
  gold: { ring: "ring-hero-gold/70", glow: "var(--hero-gold)", my: "ရွှေ" },
}; // prettier-ignore

function dollars(cents: number) {
  return Math.round(cents / 100);
}

const TOP_REWARD = dollars(LOYALTY_TIERS[LOYALTY_TIERS.length - 1].rewardCents);

function perkLabel(perk: { en: string; my: string }) {
  return `${perk.en} — ${perk.my}`;
}

export function HeroRewards({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  const [active, setActive] = useState(0);
  const [announced, setAnnounced] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // Pause the JS loops (comet, active-node glow) when the stage scrolls offscreen.
  const inView = useInView(stageRef, { margin: "200px 0px" });
  const loop = shouldAnimate && inView;
  const { bursts, fire } = useBurst(10);

  const tier = LOYALTY_TIERS[active] ?? LOYALTY_TIERS[0];
  const announcedTier = LOYALTY_TIERS[announced] ?? LOYALTY_TIERS[0];
  const litFraction = active / (LOYALTY_TIERS.length - 1);

  // Announce on intentional selection (focus or click) — not hover (avoids SR spam).
  const announce = (i: number) => {
    setActive(i);
    setAnnounced(i);
  };

  const select = (i: number, e?: { clientX: number; clientY: number }) => {
    announce(i);
    setExpanded(true); // tapping a tier reveals its perks
    // Only burst for a real pointer; keyboard-activated clicks report (0,0),
    // which would fire the particles off-stage.
    if (e && e.clientX > 0 && e.clientY > 0 && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      fire(e.clientX - r.left, e.clientY - r.top);
    }
  };

  return (
    <section
      aria-labelledby="hero-rewards-heading"
      className={cn(
        "relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl hero-surface-vellum px-5 py-5 md:px-7 md:py-6",
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

      {/* HEADER — kicker + reward teaser + expand toggle */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <HeroSunburst className="h-4 w-4 shrink-0 text-hero-clay" rays={8} />
          <h3
            id="hero-rewards-heading"
            className="truncate font-display text-base font-semibold text-hero-ink md:text-lg"
          >
            Morning Star Rewards
            <span className="ml-1.5 font-burmese text-[0.78rem] font-normal text-hero-ink-muted">
              · ရွှေကြယ် ဆုလက်ဆောင်မွန်
            </span>
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-2xs font-medium text-hero-ink-muted sm:inline">
            up to{" "}
            <span className="font-semibold text-hero-accent" aria-hidden="true">
              $<RollingNumber value={TOP_REWARD} animate={shouldAnimate && inView} />
            </span>
            <span className="sr-only">${TOP_REWARD}</span> reward
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            // Only reference the panel while it's actually mounted (the
            // AnimatePresence block unmounts it on collapse); aria-expanded
            // conveys state in both directions regardless.
            aria-controls={expanded ? "hero-rewards-perks" : undefined}
            className="grid h-8 w-8 place-items-center rounded-full text-hero-accent ring-1 ring-hero-line transition-colors hover:bg-hero-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/60"
          >
            <span className="sr-only">
              {expanded ? "Hide reward tier details" : "Show reward tier details"}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* One-line value prop */}
      <p className="relative mt-1.5 text-xs font-medium text-hero-ink-muted md:text-[0.8rem]">
        Earn a{" "}
        <Star
          className="mb-0.5 inline h-3.5 w-3.5 fill-amber-500 text-amber-500"
          aria-hidden="true"
        />{" "}
        <span className="font-semibold text-hero-accent">Star</span> every order — a reward every{" "}
        <span className="font-semibold text-hero-accent">5</span>, bigger each tier.
      </p>

      {/* TIER TRACK — discs on a horizontal progress spine */}
      <div ref={stageRef} className="relative mt-5">
        {/* Spine: faint base + lit-to-active + traveling comet. Spans between the
            first and last disc centers (4-col grid → centers at 12.5%…87.5%). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[1.375rem] h-[3px] -translate-y-1/2 overflow-hidden rounded-full md:top-[1.625rem]"
        >
          <span className="absolute inset-0 rounded-full bg-hero-ink/15" />
          <m.span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-hero-clay via-hero-blue to-hero-gold"
            initial={false}
            animate={{ width: `${Math.max(litFraction, 0.0001) * 100}%`, opacity: 0.9 }}
            transition={{ duration: shouldAnimate ? 0.35 : 0, ease: [0.22, 1, 0.36, 1] }}
          />
          {loop && (
            <m.span
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-hero-gold/80 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* Tier nodes — equal columns so disc centers land on the spine anchors */}
        <ol className="relative grid grid-cols-4 justify-items-center">
          {LOYALTY_TIERS.map((t, i) => {
            const n = TIER[t.id];
            return (
              <li key={t.id} className="contents">
                <RewardsRailNode
                  emoji={t.emoji}
                  english={t.english}
                  my={n.my}
                  ring={n.ring}
                  glow={n.glow}
                  glowSize={t.id === "gold" ? 70 : 56}
                  isGold={t.id === "gold"}
                  isActive={i === active}
                  earned={i <= active}
                  loop={loop}
                  index={i}
                  ariaLabel={`${t.english} tier${
                    t.minSpendCents === 0 ? "" : `, unlock at $${dollars(t.minSpendCents)} lifetime`
                  }, $${dollars(t.rewardCents)} reward`}
                  onHover={() => setActive(i)}
                  onFocus={() => announce(i)}
                  onSelect={(e) => select(i, e)}
                />
              </li>
            );
          })}
        </ol>

        {/* Star-burst particles on select */}
        <Bursts bursts={bursts} />
      </div>

      {/* EXPANDED — per-tier perk detail (height spring) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="perks"
            id="hero-rewards-perks"
            className="relative overflow-hidden"
            initial={shouldAnimate ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: shouldAnimate ? 0.3 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mt-4 rounded-2xl bg-hero-card/55 p-3.5 text-left ring-1 ring-hero-line">
              <AnimatePresence mode="wait">
                <m.div
                  key={tier.id}
                  initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <RewardsPerkPanel tier={tier} my={TIER[tier.id].my} animate={shouldAnimate} />
                </m.div>
              </AnimatePresence>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Intentional announcements only (focus/click) — not hover. */}
      <span className="sr-only" aria-live="polite">
        {announcedTier.english} tier, ${dollars(announcedTier.rewardCents)} reward.{" "}
        {TIER_PERKS[announcedTier.id].map(perkLabel).join(". ")}
      </span>
    </section>
  );
}
