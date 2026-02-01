"use client";

import { type ReactNode, Suspense, lazy } from "react";
import { Hero } from "./Hero";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { CTABanner } from "./CTABanner";
import { FooterCTA } from "./FooterCTA";
import { SectionNavDots } from "@/components/ui/scroll";

// Lazy load HowItWorksSection to defer 369KB Google Maps bundle
// This section is below the fold and doesn't need to block initial render
const HowItWorksSection = lazy(() => import("./HowItWorksSection"));

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
// SKELETON FOR LAZY LOADING
// ============================================

function HowItWorksSkeleton() {
  return (
    <section className="relative py-16 md:py-24 px-4 overflow-hidden bg-gradient-to-b from-orange-400 to-orange-300">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-12 md:mb-16">
          <div className="h-10 w-40 bg-surface-primary/20 rounded-full mx-auto mb-6 animate-pulse" />
          <div className="h-12 w-80 max-w-full bg-surface-primary/30 rounded-lg mx-auto mb-6 animate-pulse" />
          <div className="h-6 w-96 max-w-full bg-surface-primary/20 rounded-lg mx-auto animate-pulse" />
        </div>
        {/* Steps skeleton - horizontal on desktop */}
        <div className="hidden md:flex items-start justify-between gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-surface-primary/20 animate-pulse" />
              <div className="h-8 w-32 bg-surface-primary/30 rounded-lg mt-4 animate-pulse" />
              <div className="h-4 w-40 bg-surface-primary/20 rounded-lg mt-2 animate-pulse" />
            </div>
          ))}
        </div>
        {/* Steps skeleton - vertical on mobile */}
        <div className="md:hidden flex flex-col items-center gap-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-surface-primary/20 animate-pulse" />
              <div className="h-8 w-32 bg-surface-primary/30 rounded-lg mt-4 animate-pulse" />
              <div className="h-4 w-40 bg-surface-primary/20 rounded-lg mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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

        {/* How It Works Section - lazy loaded to defer Google Maps */}
        <Suspense fallback={<HowItWorksSkeleton />}>
          <HowItWorksSection id="how-it-works" />
        </Suspense>

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
