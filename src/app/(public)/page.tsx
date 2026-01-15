import type { ReactElement } from "react";
import { Suspense } from "react";
import { getMenuWithCategories } from "@/lib/queries/menu";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { CoverageSection } from "@/components/homepage/CoverageSection";
import { HowItWorksTimeline } from "@/components/homepage/HowItWorksTimeline";
import { HomepageMenuSection } from "@/components/homepage/HomepageMenuSection";
import { FooterCTA } from "@/components/homepage/FooterCTA";

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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

// Server component to fetch menu data
async function MenuLoader() {
  const categories = await getMenuWithCategories();
  return <HomepageMenuSection categories={categories} />;
}

export default function HomePage(): ReactElement {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Animated Gradient */}
      <HomepageHero />

      {/* Coverage Check with Interactive Map */}
      <CoverageSection />

      {/* How It Works Timeline */}
      <HowItWorksTimeline />

      {/* Full Menu Section */}
      <Suspense fallback={<MenuSkeleton />}>
        <MenuLoader />
      </Suspense>

      {/* Footer CTA */}
      <FooterCTA />
    </main>
  );
}
