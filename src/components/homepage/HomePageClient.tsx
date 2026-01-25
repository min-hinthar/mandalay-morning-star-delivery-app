"use client";

import { type ReactNode } from "react";
import { Hero } from "./Hero";
import { HowItWorksSection } from "./HowItWorksSection";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { CTABanner } from "./CTABanner";
import { FooterCTA } from "./FooterCTA";
import { SectionNavDots } from "@/components/scroll/SectionNavDots";

// ============================================
// SECTION NAVIGATION CONFIG
// ============================================

const sections = [
  { id: "hero", label: "Home" },
  { id: "how-it-works", label: "How It Works" },
  { id: "menu", label: "Menu" },
  { id: "testimonials", label: "Reviews" },
  { id: "cta", label: "Order" },
];

// ============================================
// TYPES
// ============================================

interface HomePageClientProps {
  menuSection: ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function HomePageClient({ menuSection }: HomePageClientProps) {
  return (
    <>
      {/* Section Navigation Dots - Desktop only */}
      <SectionNavDots sections={sections} className="z-50" />

      {/* Main Content Container with Scroll Snap (desktop only) */}
      <main className="md:snap-y md:snap-mandatory md:h-screen md:overflow-y-auto">
        {/* Hero Section - Video hero with gradient fallback */}
        <section className="md:snap-start">
          <Hero
            ctaHref="/menu"
            secondaryCtaText="How It Works"
            secondaryCtaHref="#how-it-works"
            showMascot={true}
          />
        </section>

        {/* How It Works Section - Replaces Timeline + Coverage */}
        <section className="md:snap-start">
          <HowItWorksSection id="how-it-works" />
        </section>

        {/* Full Menu Section */}
        <section className="md:snap-start" id="menu">
          {menuSection}
        </section>

        {/* Testimonials Section */}
        <section className="md:snap-start">
          <TestimonialsCarousel id="testimonials" />
        </section>

        {/* CTA Banner Section */}
        <section className="md:snap-start" id="cta">
          <CTABanner />
        </section>

        {/* Footer CTA */}
        <footer className="md:snap-start">
          <FooterCTA />
        </footer>
      </main>
    </>
  );
}
