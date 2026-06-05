"use client";

/**
 * HeroStatBand — "Living Proof" trust metrics
 *
 * Number-led, count-up stat band that replaces the old 4 label cards.
 * Leads with real social proof (deliveries this month, live), coverage,
 * rating, and the free-delivery value prop. Segmented glass hairline grid.
 */

import { type ReactNode, useEffect, useRef } from "react";
import { m, useInView, useSpring, useTransform } from "framer-motion";
import { ChefHat, Gift, MapPin, Star, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const COUNT_SPRING = { stiffness: 80, damping: 26, restDelta: 0.01 } as const;

// ============================================
// COUNT-UP NUMBER
// ============================================

interface CountUpProps {
  value: number;
  decimals?: number;
  start: boolean;
  animate: boolean;
}

function CountUp({ value, decimals = 0, start, animate }: CountUpProps) {
  const mv = useSpring(0, COUNT_SPRING);
  const text = useTransform(mv, (n) =>
    decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-US")
  );

  useEffect(() => {
    if (start) mv.set(value);
  }, [mv, value, start]);

  if (!animate) {
    return <>{decimals > 0 ? value.toFixed(decimals) : value.toLocaleString("en-US")}</>;
  }
  return <m.span>{text}</m.span>;
}

// ============================================
// STAT TILE
// ============================================

interface StatTile {
  icon: LucideIcon;
  /** Numeric value for count-up; omit for static display */
  count?: number;
  decimals?: number;
  /** Static big text (used when no count, e.g. "Free", "100%") */
  display?: string;
  /** Rendered after the number (e.g. "mi", a gold star) */
  suffix?: ReactNode;
  label: string;
  sub?: string;
  /** Shows a pulsing "live" indicator (real-time data) */
  live?: boolean;
}

interface TileViewProps {
  tile: StatTile;
  index: number;
  inView: boolean;
  animate: boolean;
}

function TileView({ tile, index, inView, animate }: TileViewProps) {
  const { icon: Icon, count, decimals, display, suffix, label, sub, live } = tile;

  return (
    <m.div
      role="listitem"
      initial={animate ? { opacity: 0, y: 14 } : undefined}
      animate={animate && inView ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { delay: 0.07 * index, ...spring.gentle } : undefined}
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 text-center",
        "px-2 py-5 sm:px-4",
        "bg-hero-stat-bg/70 sm:backdrop-blur-md",
        "transition-colors duration-300 hover:bg-hero-stat-bg/90"
      )}
    >
      {/* Live indicator */}
      {live && (
        <span className="absolute right-3 top-3 flex h-2 w-2" aria-hidden="true">
          {animate && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-secondary/60 animate-ping" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
        </span>
      )}

      <Icon className="mb-0.5 h-4 w-4 text-secondary/80" aria-hidden="true" />

      <div
        className={cn(
          "flex items-baseline gap-0.5 font-display font-bold text-hero-text",
          "text-3xl md:text-4xl leading-none tabular-nums",
          "transition-transform duration-300 group-hover:-translate-y-0.5"
        )}
      >
        {count !== undefined ? (
          <CountUp value={count} decimals={decimals} start={inView} animate={animate} />
        ) : (
          <span>{display}</span>
        )}
        {suffix}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide text-hero-text/55">{label}</div>
      {sub && <div className="text-2xs font-body leading-tight text-hero-text/45">{sub}</div>}
    </m.div>
  );
}

// ============================================
// STAT BAND
// ============================================

export interface HeroStatBandProps {
  /** Live delivered-orders count for the current month (real DB data) */
  deliveriesThisMonth: number;
  coverageMiles: number;
  coverageMinutes: number;
  /** Aggregate review rating (e.g. 5.0) */
  ratingValue?: number;
  freeThresholdDollars?: number;
  deliveryFeeDollars?: number;
  longDistanceFeeDollars?: number;
  longDistanceMiles?: number;
  className?: string;
}

const GOLD_STAR = (
  <Star className="ml-0.5 h-5 w-5 self-center fill-secondary text-secondary md:h-6 md:w-6" />
);

export function HeroStatBand({
  deliveriesThisMonth,
  coverageMiles,
  coverageMinutes,
  ratingValue = 5.0,
  freeThresholdDollars,
  deliveryFeeDollars,
  longDistanceFeeDollars,
  longDistanceMiles,
  className,
}: HeroStatBandProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  // Tile 1 — social proof (falls back to "homemade" when no data yet)
  const proofTile: StatTile =
    deliveriesThisMonth > 0
      ? {
          icon: Truck,
          count: deliveriesThisMonth,
          label: "This Month",
          sub: "meals delivered · ဒီလ",
          live: true,
        }
      : {
          icon: ChefHat,
          display: "100%",
          label: "Homemade",
          sub: "cooked to order · အိမ်ချက်",
        };

  // Tile 4 — free-delivery value prop (falls back to "fresh" without fee data)
  const valueTile: StatTile =
    freeThresholdDollars !== undefined && deliveryFeeDollars !== undefined
      ? {
          icon: Gift,
          display: "Free",
          label: "Delivery",
          sub:
            longDistanceFeeDollars !== undefined
              ? `over $${freeThresholdDollars} · $${deliveryFeeDollars}/$${longDistanceFeeDollars} ${longDistanceMiles ?? 25}mi`
              : `over $${freeThresholdDollars} · $${deliveryFeeDollars} flat`,
        }
      : {
          icon: ChefHat,
          display: "Fresh",
          label: "Same Day",
          sub: "made the day it ships",
        };

  const tiles: StatTile[] = [
    proofTile,
    {
      icon: MapPin,
      count: coverageMiles,
      suffix: <span className="text-lg font-semibold text-hero-text/70 md:text-xl">mi</span>,
      label: "Coverage",
      sub: `${coverageMinutes} min · မိုင် ၅၀ အတွင်း`,
    },
    {
      icon: Star,
      count: ratingValue,
      decimals: 1,
      suffix: GOLD_STAR,
      label: "Rated",
      sub: "Google & Yelp",
    },
    valueTile,
  ];

  return (
    <m.div
      ref={ref}
      initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
      animate={shouldAnimate && inView ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { ...spring.gentle } : undefined}
      className={cn(
        "mx-auto grid w-full max-w-lg grid-cols-2 gap-px md:max-w-3xl md:grid-cols-4",
        "overflow-hidden rounded-2xl border border-hero-text/20 bg-hero-text/20",
        "shadow-lg shadow-black/10",
        className
      )}
      role="list"
      aria-label="Delivery highlights"
    >
      {tiles.map((tile, i) => (
        <TileView key={tile.label} tile={tile} index={i} inView={inView} animate={shouldAnimate} />
      ))}
    </m.div>
  );
}
