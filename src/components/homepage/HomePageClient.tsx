"use client";

import { useRef, type ReactNode } from "react";
import { HeroV7, CoverageSectionV7, TimelineV7 } from "./v7-index";
import { FooterCTA } from "./FooterCTA";

interface HomePageClientProps {
  menuSection: ReactNode;
}

export function HomePageClient({ menuSection }: HomePageClientProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* V7 Hero - Cinematic parallax with WebGL effects */}
      <HeroV7
        ctaHref="/menu"
        secondaryCtaHref="/menu"
        showFloatingFood={true}
        showParticles={true}
        showMascot={true}
      />

      {/* V7 Coverage - Animated map with coverage zones */}
      <CoverageSectionV7 />

      {/* V7 Timeline - How It Works */}
      <TimelineV7 />

      {/* Full Menu Section */}
      <div ref={menuRef}>
        {menuSection}
      </div>

      {/* Footer CTA */}
      <FooterCTA />
    </>
  );
}
