"use client";

import { useRef, type ReactNode } from "react";
import { Hero, CoverageSection, Timeline } from "./v7-index";
import { FooterCTA } from "./FooterCTA";

interface HomePageClientProps {
  menuSection: ReactNode;
}

export function HomePageClient({ menuSection }: HomePageClientProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* V7 Hero - Cinematic parallax with WebGL effects */}
      <Hero
        ctaHref="/menu"
        secondaryCtaHref="/menu"
        showFloatingFood={true}
        showParticles={true}
        showMascot={true}
      />

      {/* V7 Coverage - Animated map with coverage zones */}
      <CoverageSection />

      {/* V7 Timeline - How It Works */}
      <Timeline />

      {/* Full Menu Section */}
      <div ref={menuRef}>
        {menuSection}
      </div>

      {/* Footer CTA */}
      <FooterCTA />
    </>
  );
}
