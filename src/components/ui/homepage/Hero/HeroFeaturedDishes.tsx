"use client";

/**
 * HeroFeaturedDishes — appetite carousel inside the hero
 *
 * Reuses the existing FeaturedCarousel (the same menu cards used elsewhere),
 * fed with dishes aggregated across featured sections (popular, new, etc.).
 * Tapping a card jumps straight to the menu to order.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeaturedCarousel } from "@/components/ui/menu/FeaturedCarousel";
import type { MenuItem } from "@/types/menu";

interface HeroFeaturedDishesProps {
  dishes: MenuItem[];
  menuHref?: string;
}

export function HeroFeaturedDishes({ dishes, menuHref = "/menu" }: HeroFeaturedDishesProps) {
  const router = useRouter();

  if (dishes.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-1 flex items-end justify-between gap-3 px-4 md:px-6">
        <div className="text-left">
          <p className="text-2xs font-semibold uppercase tracking-wider text-hero-text/70">
            Straight from our kitchen
          </p>
          <h2 className="font-display text-xl font-bold text-hero-text hero-text-glow md:text-2xl">
            Crave-worthy right now{" "}
            <span className="font-body text-sm text-hero-text/60">· စားချင်စဖွယ်</span>
          </h2>
        </div>
        <Link
          href={menuHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hero-line bg-hero-card px-3 py-1.5 text-sm font-semibold text-hero-ink shadow-lg shadow-black/10 transition-transform duration-300 hover:-translate-y-0.5 hover:text-hero-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent/50"
        >
          Full menu
          <ArrowRight className="h-4 w-4 text-hero-accent" />
        </Link>
      </div>

      <FeaturedCarousel
        items={dishes}
        autoScrollInterval={5000}
        onItemSelect={() => router.push(menuHref)}
      />
    </div>
  );
}
