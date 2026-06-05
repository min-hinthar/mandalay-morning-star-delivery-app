"use client";

/**
 * HeroFeaturedDishes — appetite carousel inside the hero
 *
 * Reuses the existing FeaturedCarousel (the same menu cards used elsewhere),
 * fed with dishes aggregated across featured sections (popular, new, etc.).
 * Tapping a card jumps straight to the menu to order.
 */

import { type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeaturedCarousel } from "@/components/ui/menu/FeaturedCarousel";
import { HeroSunburst } from "./HeroSunburst";
import type { MenuItem } from "@/types/menu";

interface HeroFeaturedDishesProps {
  dishes: MenuItem[];
  menuHref?: string;
}

export function HeroFeaturedDishes({ dishes, menuHref = "/menu" }: HeroFeaturedDishesProps) {
  const router = useRouter();

  if (dishes.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Subtle Anthropic dot-grid wash behind the cards (radial-masked, faint) */}
      <div
        aria-hidden="true"
        className="hero-dotgrid pointer-events-none absolute inset-x-0 top-12 bottom-8 opacity-[0.16]"
        style={
          {
            "--dot-color": "rgba(20, 20, 19, 0.5)",
            "--dot-gap": "22px",
            "--dot-r": "1px",
            maskImage: "radial-gradient(120% 90% at 50% 50%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 50% 50%, #000 30%, transparent 78%)",
          } as CSSProperties
        }
      />

      {/* Header */}
      <div className="relative mb-1 flex items-end justify-between gap-3 px-4 md:px-6">
        <div className="text-left">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-hero-text/70">
            <HeroSunburst className="h-3.5 w-3.5 text-hero-clay" rays={8} />
            Straight from our kitchen
            <span className="text-hero-text/40" aria-hidden="true">
              ·
            </span>
            <span className="font-bold text-hero-clay">{dishes.length} picks</span>
          </p>
          <h2 className="font-display text-xl font-bold text-hero-text hero-text-glow md:text-2xl">
            Crave-worthy right now{" "}
            <span className="font-body text-sm text-hero-text/60">· စားချင်စဖွယ်</span>
          </h2>
        </div>
        <Link
          href={menuHref}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full hero-surface-paper px-3 py-1.5 text-sm font-semibold text-hero-ink transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
        >
          Full menu
          <ArrowRight className="h-4 w-4 text-hero-clay transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <FeaturedCarousel
        className="relative"
        items={dishes}
        autoScrollInterval={5000}
        onItemSelect={() => router.push(menuHref)}
      />
    </div>
  );
}
