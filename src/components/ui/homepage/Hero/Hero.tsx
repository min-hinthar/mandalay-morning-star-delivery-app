"use client";

/**
 * Hero Component
 *
 * Main hero section with parallax layers, floating emojis, and gradient orbs.
 */

import React, { useRef, useState, useCallback } from "react";
import { m, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { parallaxPresets } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useAnimationContextSafe } from "@/lib/providers/animation-provider";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { FloatingEmoji, EMOJI_CONFIG } from "../FloatingEmoji";
import { GradientOrb, ORB_CONFIG_FAR, ORB_CONFIG_MID } from "../GradientOrb";
import type { HeroProps } from "./types";
import { GradientFallback } from "./HeroSubComponents";
import { HeroContent } from "./HeroContent";

export function Hero({
  headline = "Authentic Burmese Cuisine Delivered to Your Door",
  tagline = "Authentic Burmese delivered",
  subheadline = "Experience the rich flavors of Myanmar with our weekly Saturday deliveries. Fresh, homemade dishes prepared with love and tradition.",
  ctaText = "Order Now",
  ctaHref = "/menu",
  className,
}: HeroProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { isParallaxEnabled } = useAnimationContextSafe();
  const canHover = useCanHover();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const offsetX = Math.max(-20, Math.min(20, (mouseX - centerX) / centerX * 20));
    const offsetY = Math.max(-20, Math.min(20, (mouseY - centerY) / centerY * 20));
    setMouseOffset({ x: offsetX, y: offsetY });
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const orbsFarY = useTransform(scrollYProgress, [0, 1],
    isParallaxEnabled ? ["0%", `${parallaxPresets.far.speedFactor * 100}%`] : ["0%", "0%"]);
  const orbsMidY = useTransform(scrollYProgress, [0, 1],
    isParallaxEnabled ? ["0%", `${parallaxPresets.mid.speedFactor * 100}%`] : ["0%", "0%"]);
  const contentY = useTransform(scrollYProgress, [0, 1],
    isParallaxEnabled ? ["0%", `${parallaxPresets.content.speedFactor * 15}%`] : ["0%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const smoothOrbsFarY = useSpring(orbsFarY, { stiffness: 100, damping: 30 });
  const smoothOrbsMidY = useSpring(orbsMidY, { stiffness: 100, damping: 30 });
  const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  const heroContent = (
    <HeroContent headline={headline} tagline={tagline} subheadline={subheadline} ctaText={ctaText} ctaHref={ctaHref} />
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
        <m.div style={shouldAnimate ? { y: smoothContentY, opacity: smoothOpacity } : undefined}>
          {heroContent}
        </m.div>
      </GradientFallback>

      {/* Layer 2: Background orbs (far) */}
      <m.div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ y: smoothOrbsFarY, zIndex: 1 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_FAR.map((orb, i) => (
          <GradientOrb key={`orb-far-${i}`} {...orb} />
        ))}
      </m.div>

      {/* Layer 3: Mid-distance orbs */}
      <m.div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ y: smoothOrbsMidY, zIndex: 2 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_MID.map((orb, i) => (
          <GradientOrb key={`orb-mid-${i}`} {...orb} />
        ))}
      </m.div>

      {/* Layer 4: Floating emojis */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          zIndex: 3,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
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
