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

const DeliveryMapCard = dynamic(
  () => import("./DeliveryMapCard").then((m) => ({ default: m.DeliveryMapCard })),
  { ssr: false }
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
}: HeroProps) {
  const canHover = useCanHover();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!canHover) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const offsetX = Math.max(-20, Math.min(20, ((mouseX - centerX) / centerX) * 20));
      const offsetY = Math.max(-20, Math.min(20, ((mouseY - centerY) / centerY) * 20));
      setMouseOffset({ x: offsetX, y: offsetY });
    },
    [canHover]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

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
        <div
          className="relative w-full px-4 pb-8 max-w-5xl mx-auto"
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          style={{ zIndex: 5 }}
        >
          <DeliveryMapCard
            deliveriesThisMonth={deliveriesThisMonth ?? 0}
            nextDeliveryDate={nextDeliveryDate ?? ""}
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

      {/* Layer 4: Floating emojis */}
      <div
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
          <FloatingEmoji key={`emoji-${i}`} {...emoji} index={i} mouseOffset={mouseOffset} />
        ))}
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
    </section>
  );
}

export default Hero;
