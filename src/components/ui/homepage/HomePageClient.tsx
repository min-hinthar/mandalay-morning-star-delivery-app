"use client";

import { type ReactNode } from "react";
import { Hero } from "./Hero";
import { HowItWorksSection } from "./HowItWorksSection";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { CTABanner } from "./CTABanner";
import { FooterCTA } from "./FooterCTA";
import { SectionNavDots } from "@/components/ui/scroll";

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
      <SectionNavDots sections={sections} />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <Hero ctaHref="/menu" />

        {/* How It Works Section */}
        <HowItWorksSection id="how-it-works" />

        {/* Menu Section */}
        {menuSection}

        {/* Testimonials Section */}
        <TestimonialsCarousel id="testimonials" />

        {/* CTA Banner Section */}
        <CTABanner id="cta" />

        {/* Footer */}
        <FooterCTA />
      </main>
    </>
  );
}
