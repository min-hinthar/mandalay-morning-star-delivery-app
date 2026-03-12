import type { ReactElement } from "react";
import { Suspense, lazy } from "react";
import { getFeaturedSections } from "@/lib/queries/sections";
import { getBusinessRules } from "@/lib/settings";
import { getDeliveryStats } from "@/lib/queries/delivery-stats";
import { HomePageWrapper } from "@/components/ui/homepage/HomePageWrapper";
import { HomepageMenuSection } from "@/components/ui/homepage/HomepageMenuSection";
import { Hero } from "@/components/ui/homepage/Hero";
import { TestimonialsCarousel } from "@/components/ui/homepage/TestimonialsCarousel";
import { CTABanner } from "@/components/ui/homepage/CTABanner";
import { FooterCTA } from "@/components/ui/homepage/FooterCTA";
import { SettingsNudgeBanner } from "@/components/ui/homepage/SettingsNudgeBanner";
import type { FeaturedSectionWithItems } from "@/types/featured-sections";

// Lazy load HowItWorksSection to defer 369KB Google Maps bundle
// This section is below the fold and doesn't need to block initial render
const HowItWorksSection = lazy(() => import("@/components/ui/homepage/HowItWorksSection"));

// ============================================
// LOADING SKELETONS
// ============================================

// Loading skeleton for menu section
function MenuSkeleton() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded-full mx-auto mb-4" />
          <div className="h-12 w-64 bg-muted rounded-lg mx-auto mb-4" />
          <div className="h-6 w-96 bg-muted rounded-lg mx-auto max-w-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] bg-muted rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Skeleton for HowItWorks - lazy loaded section
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
// SECTION COMPONENTS
// ============================================

// Client component wrapper for the menu section
function MenuSection({ featuredSections }: { featuredSections: FeaturedSectionWithItems[] }) {
  return <HomepageMenuSection featuredSections={featuredSections} />;
}

// ============================================
// MAIN PAGE - SERVER COMPONENT
// ============================================

export default async function HomePage(): Promise<ReactElement> {
  // Fetch business rules and featured sections in parallel
  // Gracefully degrade if Supabase is unavailable (e.g., CI)
  let featuredSections: FeaturedSectionWithItems[] = [];
  const [rules, deliveryStats] = await Promise.all([getBusinessRules(), getDeliveryStats()]);
  try {
    featuredSections = await getFeaturedSections();
  } catch {
    // Supabase unavailable — render with empty featured sections
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HomePageWrapper provides SectionNavDots (scroll spy) */}
      <HomePageWrapper>
        {/* Hero Section - client component with server-fetched business rules */}
        <Hero
          ctaHref="/menu"
          deliveryFeeCents={rules.deliveryFeeCents}
          freeDeliveryThresholdCents={rules.freeDeliveryThresholdCents}
          cutoffDay={rules.cutoffDay}
          cutoffHour={rules.cutoffHour}
          deliveryDays={rules.deliveryDays}
          longDistanceFeeCents={rules.longDistanceFeeCents}
          longDistanceThresholdMiles={rules.longDistanceThresholdMiles}
          deliveriesThisMonth={deliveryStats.deliveriesThisMonth}
          nextDeliveryDate={deliveryStats.nextDeliveryDate}
        />

        {/* Settings Nudge Banner - client component (auth check, inline saves) */}
        <SettingsNudgeBanner />

        {/* How It Works Section - lazy loaded to defer Google Maps */}
        <Suspense fallback={<HowItWorksSkeleton />}>
          <HowItWorksSection id="how-it-works" />
        </Suspense>

        {/* Menu Section - server-fetched data, client rendering */}
        <Suspense fallback={<MenuSkeleton />}>
          <MenuSection featuredSections={featuredSections} />
        </Suspense>

        {/* Testimonials Section - client component (carousel state) */}
        <TestimonialsCarousel id="testimonials" />

        {/* CTA Banner Section - client component (animations) */}
        <CTABanner id="cta" />

        {/* Footer - client component (animations) */}
        <FooterCTA />
      </HomePageWrapper>
    </div>
  );
}
