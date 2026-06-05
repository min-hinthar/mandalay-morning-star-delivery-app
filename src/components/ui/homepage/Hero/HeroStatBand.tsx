"use client";

/**
 * HeroStatBand — "Living Proof" trust metrics
 *
 * Number-led, count-up stat tiles inside a glass tray. Each tile lifts,
 * sweeps a shine, animates its icon, and reveals an informative tooltip
 * (hover + keyboard). Leads with real social proof (deliveries this month,
 * live), coverage, rating, and the free-delivery value prop.
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

function formatNum(n: number, decimals: number) {
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-US");
}

function CountUp({ value, decimals = 0, start, animate }: CountUpProps) {
  const mv = useSpring(0, COUNT_SPRING);
  const text = useTransform(mv, (n) => formatNum(n, decimals));

  useEffect(() => {
    if (start) mv.set(value);
  }, [mv, value, start]);

  if (!animate) return <>{formatNum(value, decimals)}</>;
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
  /** Informative tooltip + screen-reader description */
  tooltip: string;
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
  const { icon: Icon, count, decimals = 0, display, suffix, label, sub, tooltip, live } = tile;
  const valueText = count !== undefined ? formatNum(count, decimals) : (display ?? "");
  const ariaLabel = `${valueText} — ${label}. ${tooltip}`;

  return (
    <m.div
      role="listitem"
      tabIndex={0}
      aria-label={ariaLabel}
      initial={animate ? { opacity: 0, y: 14 } : undefined}
      animate={animate && inView ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { delay: 0.07 * index, ...spring.gentle } : undefined}
      whileHover={animate ? { y: -4 } : undefined}
      whileTap={animate ? { scale: 0.98 } : undefined}
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-center",
        "px-2 py-5 sm:px-4",
        "bg-hero-stat-bg/70 sm:backdrop-blur-md",
        "border border-hero-text/15 shadow-md shadow-black/10",
        "transition-[box-shadow,border-color,background-color] duration-300",
        "hover:border-secondary/40 hover:bg-hero-stat-bg/90 hover:shadow-lg hover:shadow-secondary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      )}
    >
      {/* Hover shine sweep (clipped to the card) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1/2 -skew-x-12",
            "bg-gradient-to-r from-transparent via-white/25 to-transparent",
            "-translate-x-full transition-transform duration-700 ease-out",
            "group-hover:translate-x-[280%]"
          )}
        />
      </span>

      {/* Live indicator */}
      {live && (
        <span className="absolute right-3 top-3 flex h-2 w-2" aria-hidden="true">
          {animate && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-secondary/60 animate-ping" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
        </span>
      )}

      <Icon
        className="mb-0.5 h-4 w-4 text-secondary/80 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
        aria-hidden="true"
      />

      <div
        className={cn(
          "flex items-baseline gap-0.5 font-display font-bold text-hero-text",
          "text-3xl md:text-4xl leading-none tabular-nums"
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

      {/* Informative tooltip (hover + keyboard focus) */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[14rem] -translate-x-1/2",
          "rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5",
          "text-2xs font-medium leading-snug text-text-primary shadow-xl sm:backdrop-blur-md",
          "translate-y-1 opacity-0 transition-[opacity,transform] duration-200",
          "group-hover:translate-y-0 group-hover:opacity-100",
          "group-focus-within:translate-y-0 group-focus-within:opacity-100"
        )}
      >
        {tooltip}
        <span
          className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-surface-elevated"
          aria-hidden="true"
        />
      </span>
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
          tooltip: "Real orders delivered across Los Angeles so far this month.",
          live: true,
        }
      : {
          icon: ChefHat,
          display: "100%",
          label: "Homemade",
          sub: "cooked to order · အိမ်ချက်",
          tooltip: "Every dish is cooked to order in our Covina kitchen — never mass-produced.",
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
          tooltip:
            longDistanceFeeDollars !== undefined
              ? `Free delivery on orders over $${freeThresholdDollars}. Otherwise $${deliveryFeeDollars} flat (within ${longDistanceMiles ?? 25} mi) or $${longDistanceFeeDollars} beyond.`
              : `Free delivery on orders over $${freeThresholdDollars}. Otherwise a flat $${deliveryFeeDollars}.`,
        }
      : {
          icon: ChefHat,
          display: "Fresh",
          label: "Same Day",
          sub: "made the day it ships",
          tooltip: "Your food is cooked the same day it's delivered — never frozen or reheated.",
        };

  const tiles: StatTile[] = [
    proofTile,
    {
      icon: MapPin,
      count: coverageMiles,
      suffix: <span className="text-lg font-semibold text-hero-text/70 md:text-xl">mi</span>,
      label: "Coverage",
      sub: `${coverageMinutes} min · မိုင် ၅၀ အတွင်း`,
      tooltip: `We deliver up to ${coverageMiles} miles (about ${coverageMinutes} minutes) from our Covina, CA kitchen.`,
    },
    {
      icon: Star,
      count: ratingValue,
      decimals: 1,
      suffix: GOLD_STAR,
      label: "Rated",
      sub: "Google & Yelp",
      tooltip: `${ratingValue.toFixed(1)} average rating across our Google and Yelp reviews.`,
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
        "relative mx-auto w-full max-w-lg md:max-w-3xl",
        "rounded-3xl border border-hero-text/12 bg-hero-text/5 p-1.5",
        "shadow-xl shadow-black/20",
        className
      )}
      role="list"
      aria-label="Delivery highlights"
    >
      {/* Ambient sunset glow behind the tray (painted behind via DOM order) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-amber-400/20 via-orange-400/15 to-rose-400/20 blur-2xl"
      />

      <div className="relative grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {tiles.map((tile, i) => (
          <TileView
            key={tile.label}
            tile={tile}
            index={i}
            inView={inView}
            animate={shouldAnimate}
          />
        ))}
      </div>
    </m.div>
  );
}
