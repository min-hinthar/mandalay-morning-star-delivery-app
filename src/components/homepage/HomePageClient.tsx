"use client";

import { useRef, type ReactNode } from "react";
import { HomepageHero } from "./HomepageHero";
import { CoverageSection } from "./CoverageSection";
import { HowItWorksTimeline } from "./HowItWorksTimeline";
import { FooterCTA } from "./FooterCTA";

interface HomePageClientProps {
  menuSection: ReactNode;
}

export function HomePageClient({ menuSection }: HomePageClientProps) {
  const coverageRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToCoverage = () => {
    coverageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Hero Section with Animated Gradient */}
      <HomepageHero
        onScrollToMenu={scrollToMenu}
        onScrollToCoverage={scrollToCoverage}
      />

      {/* Coverage Check with Interactive Map */}
      <div ref={coverageRef}>
        <CoverageSection />
      </div>

      {/* How It Works Timeline */}
      <HowItWorksTimeline />

      {/* Full Menu Section */}
      <div ref={menuRef}>
        {menuSection}
      </div>

      {/* Footer CTA */}
      <FooterCTA />
    </>
  );
}
