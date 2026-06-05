"use client";

/**
 * HeroDishCarousel — appetite-driving featured dishes
 *
 * Image-forward horizontal scroller of real menu items (server-fetched).
 * Bold photo cards with gold price chips, hover zoom/lift, swipe + arrow
 * nav, masked edges. Every card links straight to the menu to order.
 */

import { useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { formatPrice } from "@/lib/utils/currency";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { HeroDish } from "./types";

const EDGE_MASK =
  "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)";

interface HeroDishCarouselProps {
  dishes: HeroDish[];
  menuHref?: string;
}

function ScrollButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: typeof ChevronLeft;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "hidden h-8 w-8 items-center justify-center rounded-full md:flex",
        "bg-hero-stat-bg/70 text-hero-text backdrop-blur-md",
        "border border-hero-text/20 shadow-md",
        "transition-colors hover:bg-hero-stat-bg/95 hover:text-secondary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function DishCard({ dish, menuHref }: { dish: HeroDish; menuHref: string }) {
  return (
    <Link
      href={menuHref}
      aria-label={`Order ${dish.nameEn} — ${formatPrice(dish.priceCents)}`}
      className="group relative w-40 flex-shrink-0 snap-start md:w-48"
    >
      <div
        className={cn(
          "relative aspect-[4/5] overflow-hidden rounded-2xl",
          "border border-hero-text/15 bg-hero-stat-bg/60",
          "shadow-xl shadow-black/30",
          "transition-transform duration-300 group-hover:-translate-y-1.5",
          "group-focus-visible:-translate-y-1.5 group-focus-visible:outline-none",
          "group-focus-visible:ring-2 group-focus-visible:ring-secondary/60"
        )}
      >
        <Image
          src={dish.imageUrl}
          alt={dish.nameEn}
          fill
          sizes="(max-width: 768px) 40vw, 200px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {/* Legibility gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          aria-hidden="true"
        />

        {/* Price chip */}
        <span className="absolute right-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-2xs font-bold text-text-primary shadow-md">
          {formatPrice(dish.priceCents)}
        </span>

        {/* Tag chip */}
        {dish.tag && (
          <span className="absolute left-2 top-2 rounded-full bg-hero-overlay px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-hero-text backdrop-blur-sm">
            {dish.tag}
          </span>
        )}

        {/* Name + order affordance */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
          <p className="line-clamp-2 font-display text-sm font-bold leading-tight text-hero-text">
            {dish.nameEn}
          </p>
          {dish.nameMy && (
            <p className="line-clamp-1 font-body text-2xs text-hero-text/70">{dish.nameMy}</p>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Order
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HeroDishCarousel({ dishes, menuHref = "/menu" }: HeroDishCarouselProps) {
  const { shouldAnimate } = useAnimationPreference();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }, []);

  if (dishes.length === 0) return null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={shouldAnimate ? { ...spring.gentle } : undefined}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div className="text-left">
          <p className="text-2xs font-semibold uppercase tracking-wider text-secondary">
            Straight from our kitchen
          </p>
          <h2 className="font-display text-lg font-bold text-hero-text md:text-xl">
            Crave-worthy right now{" "}
            <span className="font-body text-sm text-hero-text/55">· စားချင်စဖွယ်</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ScrollButton onClick={() => scroll(-1)} label="Scroll dishes left" icon={ChevronLeft} />
          <ScrollButton onClick={() => scroll(1)} label="Scroll dishes right" icon={ChevronRight} />
          <Link
            href={menuHref}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5",
              "bg-hero-stat-bg/70 text-sm font-semibold text-hero-text backdrop-blur-md",
              "border border-hero-text/20 shadow-md",
              "transition-colors hover:bg-hero-stat-bg/95 hover:text-secondary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            )}
          >
            Full menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 pt-2 md:gap-4"
        style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
      >
        {dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} menuHref={menuHref} />
        ))}
      </div>
    </m.div>
  );
}
