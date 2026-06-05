"use client";

/**
 * Hero Component
 *
 * Main hero section with floating emojis and gradient orbs.
 */

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { FloatingEmoji, EMOJI_CONFIG } from "../FloatingEmoji";
import { GradientOrb, ORB_CONFIG_FAR, ORB_CONFIG_MID } from "../GradientOrb";
import dynamic from "next/dynamic";
import type { HeroProps } from "./types";
import { GradientFallback } from "./HeroSubComponents";
import { HeroContent } from "./HeroContent";
import { HeroFeaturedDishes } from "./HeroFeaturedDishes";
import { HeroCursor } from "./HeroCursor";
import { ScrollProgress } from "./ScrollProgress";
import { HeroConfetti } from "./HeroConfetti";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const deliverySchedule = deliveryDays ? formatDeliveryDaysList(deliveryDays) : undefined;

  // Live pointer position (percent of hero) → cursor-gather for the emojis
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const { bursts: emojiBursts, fire: fireEmoji } = useBurst(8);

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
      className={cn("relative min-h-[100svh] min-h-[100dvh] overflow-hidden isolate", className)}
      style={{ position: "relative" }}
      onMouseMove={canHover ? handleMouseMove : undefined}
      onMouseLeave={canHover ? handleMouseLeave : undefined}
    >
      <GradientFallback>
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

      {/* Layer 2: Background orbs (far) */}
      <div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_FAR.map((orb, i) => (
          <GradientOrb key={`orb-far-${i}`} {...orb} />
        ))}
      </div>

      {/* Layer 3: Mid-distance orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 2 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_MID.map((orb, i) => (
          <GradientOrb key={`orb-mid-${i}`} {...orb} />
        ))}
      </div>

      {/* Layer 4: Floating emojis (tap to burst, cursor-gather, steam, trails) + sparkles */}
      <div
        ref={emojiLayerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          zIndex: 3,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
        aria-hidden="true"
      >
        {EMOJI_CONFIG.map((emoji, i) => (
          <FloatingEmoji
            key={`emoji-${i}`}
            {...emoji}
            index={i}
            pointer={pointer}
            onTap={handleEmojiTap}
          />
        ))}
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
