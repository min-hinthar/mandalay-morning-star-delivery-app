"use client";

/**
 * Hero Component
 *
 * Main hero section with floating emojis and gradient orbs.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { useHeroFx } from "@/lib/hooks/useHeroFx";
import { FloatingEmoji, EMOJI_CONFIG } from "../FloatingEmoji";
import dynamic from "next/dynamic";
import type { HeroProps } from "./types";
import { GradientFallback } from "./HeroSubComponents";
import { HeroContent } from "./HeroContent";
import { HeroFeaturedDishes } from "./HeroFeaturedDishes";
import { HeroCursor } from "./HeroCursor";
import { ScrollProgress } from "./ScrollProgress";
import { HeroConfetti } from "./HeroConfetti";
import { HeroOrbitCluster } from "./HeroOrbitCluster";
import { useBurst, Bursts } from "./HeroBurst";
import { formatDeliveryDaysList } from "@/lib/utils/delivery-schedule";

/** Rising flavor sparkles scattered across the hero */
const SPARKLES = Array.from({ length: 9 }, (_, i) => ({
  x: (i * 41 + 7) % 100,
  y: 12 + ((i * 29) % 76),
  size: 10 + ((i * 5) % 8),
  dur: `${2.4 + ((i * 7) % 12) / 10}s`,
  delay: `${((i * 13) % 20) / 10}s`,
}));

const DeliveryMapCard = dynamic(
  () => import("./DeliveryMapCard").then((m) => ({ default: m.DeliveryMapCard })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl overflow-hidden bg-hero-stat-bg/40 h-60 md:h-80 flex items-center justify-center border-2 border-white/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-hero-text/20 border-t-hero-text/60" />
      </div>
    ),
  }
);

export function Hero({
  headline = "Authentic Burmese Cuisine Delivered Across Los Angeles",
  tagline = "Homemade Burmese food · From Covina to your door",
  subheadline = "Experience the rich flavors of Myanmar — serving Burmese families, students & homesick hearts across LA with fresh, homemade dishes delivered weekly.",
  ctaText = "Order Now",
  ctaHref = "/menu",
  className,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
  deliveriesThisMonth,
  nextDeliveryDate,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
  featuredDishes,
}: HeroProps) {
  const canHover = useCanHover();
  const fx = useHeroFx();
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const deliverySchedule = deliveryDays ? formatDeliveryDaysList(deliveryDays) : undefined;

  // Live pointer position (percent of hero) → cursor-gather for the emojis
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const { bursts: emojiBursts, fire: fireEmoji } = useBurst(8);

  // Pause the hero's CSS animations when it scrolls offscreen (perf/battery)
  const [heroInView, setHeroInView] = useState(true);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!canHover) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setPointer({ x: px, y: py }));
    },
    [canHover]
  );

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPointer(null);
  }, []);

  const handleEmojiTap = useCallback(
    (clientX: number, clientY: number) => {
      const r = emojiLayerRef.current?.getBoundingClientRect();
      if (!r) return;
      fireEmoji(clientX - r.left, clientY - r.top);
    },
    [fireEmoji]
  );

  // Floating-emoji layering. On capable (desktop/rich) devices the budget
  // SPLITS the emojis across two layers — alternating ones in FRONT of the
  // cards (z6, decoration), the rest BEHIND (z3, tappable) — for parallax
  // depth. Mobile stays single-layer (all-front on lite, all-behind on
  // baseline) to hold the iOS GPU budget.
  const emojiItems = EMOJI_CONFIG.slice(0, fx.emojiCount);
  const emojiInFront = (i: number) => (fx.splitEmojis ? i % 2 === 1 : fx.frontEmojis);
  const EMOJI_MASK =
    "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)";

  const heroContent = (
    <HeroContent
      headline={headline}
      tagline={tagline}
      subheadline={subheadline}
      ctaText={ctaText}
      ctaHref={ctaHref}
      deliveryFeeCents={deliveryFeeCents}
      freeDeliveryThresholdCents={freeDeliveryThresholdCents}
      cutoffDay={cutoffDay}
      cutoffHour={cutoffHour}
      deliveryDays={deliveryDays}
      longDistanceFeeCents={longDistanceFeeCents}
      longDistanceThresholdMiles={longDistanceThresholdMiles}
      deliveriesThisMonth={deliveriesThisMonth}
    />
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      data-testid="hero-section"
      className={cn(
        "relative min-h-[100svh] min-h-[100dvh] overflow-hidden isolate",
        !heroInView && "hero-anim-paused",
        className
      )}
      style={{ position: "relative" }}
      onMouseMove={canHover ? handleMouseMove : undefined}
      onMouseLeave={canHover ? handleMouseLeave : undefined}
    >
      <GradientFallback fx={fx}>
        {heroContent}
        {featuredDishes && featuredDishes.length > 0 && (
          <div className="relative w-full pt-2 pb-6 max-w-5xl mx-auto">
            <HeroFeaturedDishes dishes={featuredDishes} menuHref={ctaHref} />
          </div>
        )}
        <div
          className="relative w-full px-4 pt-6 pb-12 max-w-5xl mx-auto"
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          style={{ zIndex: 5 }}
        >
          <DeliveryMapCard
            nextDeliveryDate={nextDeliveryDate ?? ""}
            deliverySchedule={deliverySchedule}
          />
        </div>
      </GradientFallback>

      {/* Flavor solar-system orbit cluster (the morphing mesh orbs now live in
          HeroAmbient — the legacy GradientOrb layers were duplicates, removed) */}
      <div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 2 }}
        aria-hidden="true"
      >
        <HeroOrbitCluster className="opacity-50" />
      </div>

      {/* Layer 4: Floating emojis + sparkles. The FX budget decides count and
          layering — on desktop the emojis SPLIT across two layers (alternating
          in front of / behind the cards) for parallax depth; on mobile they
          sit on a single layer (front on lite, behind on baseline). Content
          layer is z-index 5, so the front layer (z6) overlaps the cards. */}

      {/* Behind-cards layer (z3): tappable emojis + sparkles + tap-bursts */}
      <div
        ref={emojiLayerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          zIndex: 3,
          maskImage: EMOJI_MASK,
          WebkitMaskImage: EMOJI_MASK,
        }}
        aria-hidden="true"
      >
        {emojiItems.map((emoji, i) =>
          emojiInFront(i) ? null : (
            <FloatingEmoji
              key={`emoji-${i}`}
              {...emoji}
              index={i}
              pointer={pointer}
              onTap={handleEmojiTap}
              interactive={fx.interactiveEmojis}
            />
          )
        )}
        {/* Rising flavor sparkles */}
        {SPARKLES.map((s, i) => (
          <span
            key={`sparkle-${i}`}
            className="hero-sparkle absolute select-none text-amber-300"
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                fontSize: s.size,
                "--sparkle-dur": s.dur,
                "--sparkle-delay": s.delay,
              } as React.CSSProperties
            }
          >
            ✦
          </span>
        ))}
        <Bursts bursts={emojiBursts} />
      </div>

      {/* In-front-of-cards layer (z6): the alternating decorative emojis that
          overlap the card edges for the layered look (pure decoration — no
          taps, so they never block the cards beneath). */}
      {emojiItems.some((_, i) => emojiInFront(i)) && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
            zIndex: 6,
            maskImage: EMOJI_MASK,
            WebkitMaskImage: EMOJI_MASK,
          }}
          aria-hidden="true"
        >
          {emojiItems.map((emoji, i) =>
            emojiInFront(i) ? (
              <FloatingEmoji
                key={`emoji-front-${i}`}
                {...emoji}
                index={i}
                pointer={pointer}
                interactive={false}
              />
            ) : null
          )}
        </div>
      )}

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate), not global z-index
          zIndex: 4,
          background: `linear-gradient(to top, var(--hero-bg-start), transparent)`,
        }}
      />

      {/* Welcome confetti (once per session) */}
      <HeroConfetti />
      {/* Scroll progress bar + custom cursor (fixed, desktop) */}
      <ScrollProgress />
      <HeroCursor />
    </section>
  );
}

export default Hero;
