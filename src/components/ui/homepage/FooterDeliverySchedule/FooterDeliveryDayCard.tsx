"use client";

/**
 * FooterDeliveryDayCard — one collapsible delivery day rendered as a CREAM
 * hero card (hero-surface-vellum + HeroCardLayers: dot-grid, paper grain,
 * corner ticks) with a per-direction edge-glow, a thematic icon, a LIVE cutoff
 * countdown pill, and a height-spring body. Full hero motion kit: pointer tilt,
 * magnetic chevron, auto sheen sweep, tap ripple, staggered city chips,
 * count-up fee, a pulsing glow on the "Next" card, and an icon lift. All loops
 * gate on `inView` (the footer is offscreen on load) + reduced-motion.
 */

import { useId, useState, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { DAY_NAMES_FULL } from "@/lib/utils/delivery-schedule";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";
import { HeroCardLayers } from "../Hero/HeroCardLayers";
import { useTilt, useMagnetic, useRipple } from "../Hero/interactions";
import { ACCENT_CLASSES, DIRECTION_META, citiesForDay, shortCutoff } from "./schedule-meta";
import { cutoffCountdown } from "./cutoff-countdown";
import { FooterDeliveryCardBody } from "./FooterDeliveryCardBody";

interface FooterDeliveryDayCardProps {
  day: DeliveryDayConfig;
  zones: DeliveryZoneConfig[];
  /** Shared `now` tick from the parent (null on SSR / offscreen). */
  now: Date | null;
  /** Whether the footer is on screen — gates the continuous loops. */
  inView: boolean;
  windowRange: string | null;
  windowSlots: number;
  feeDollars: number;
  freeThresholdDollars?: number;
  /** Highlights the soonest upcoming day (resolved client-side post-mount). */
  isNext: boolean;
}

export function FooterDeliveryDayCard({
  day,
  zones,
  now,
  inView,
  windowRange,
  windowSlots,
  feeDollars,
  freeThresholdDollars,
  isNext,
}: FooterDeliveryDayCardProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  const meta = DIRECTION_META[day.direction ?? "all"];
  const accent = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;
  const cd = cutoffCountdown(day, now);
  const cities = citiesForDay(day, zones);

  const tilt = useTilt(4);
  const chevronMag = useMagnetic(0.4);
  const { ripples, onPointerDown } = useRipple();
  const loop = shouldAnimate && inView;

  return (
    <m.div
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      className="group relative overflow-hidden rounded-xl hero-surface-vellum"
    >
      {/* Anthropic card texture — dot-grid + grain + corner ticks (glow off; we
          draw our own per-direction edge-glow below so gold is supported). */}
      <HeroCardLayers accent={accent.layers} radius="rounded-xl" glow={false} />

      {/* Per-direction radial edge-glow (no blur); pulses on the "Next" card */}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(80% 60% at 12% 0%, ${accent.glowVar}, transparent 70%)`,
        }}
        animate={
          loop && isNext ? { opacity: [0.16, 0.36, 0.16] } : { opacity: isNext ? 0.3 : 0.12 }
        }
        transition={
          loop && isNext
            ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      />
      {/* Inset accent ring (brighter on the Next card) + left edge bar */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset",
          isNext ? accent.ring : "ring-hero-line"
        )}
      />
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-0.5", accent.dot)} />

      {/* Auto sheen sweep */}
      {shouldAnimate && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
        >
          <span className="animate-hero-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onPointerDown={onPointerDown}
        aria-expanded={open}
        // Only reference the body while it's mounted (AnimatePresence unmounts it
        // when collapsed); aria-expanded conveys the state in both directions.
        aria-controls={open ? bodyId : undefined}
        className="relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-gold/60"
      >
        {/* Tap ripples (clipped by the card's overflow-hidden) */}
        {ripples.map((rp) => (
          <span
            key={rp.id}
            aria-hidden="true"
            className={cn(
              "animate-hero-ripple pointer-events-none absolute h-16 w-16 rounded-full",
              accent.dot
            )}
            style={{ left: rp.x, top: rp.y, opacity: 0.18 } as CSSProperties}
          />
        ))}

        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110",
            accent.vivid
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-hero-ink">
              {DAY_NAMES_FULL[day.dayOfWeek]}
            </span>
            <span className={cn("text-xs font-semibold", accent.text)}>· {meta.label}</span>
            {isNext && (
              <span className="rounded-full bg-hero-gold px-1.5 text-2xs font-bold uppercase tracking-wide text-hero-ink">
                Next
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-hero-ink-muted">
            {meta.region} · {shortCutoff(day)}
          </span>
        </span>

        {cd.label && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-semibold text-hero-ink",
              cd.soon ? "bg-hero-gold/20" : "bg-hero-ink/[0.06]"
            )}
          >
            <Timer className={cn("h-3 w-3", accent.vivid)} aria-hidden="true" />
            {cd.label}
            <span className="sr-only"> until order cutoff</span>
          </span>
        )}

        {/* Magnetic chevron */}
        <m.span
          style={{ x: chevronMag.x, y: chevronMag.y }}
          onPointerMove={chevronMag.onPointerMove}
          onPointerLeave={chevronMag.onPointerLeave}
          className="shrink-0"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-hero-ink-muted transition-transform duration-300",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </m.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={bodyId}
            className="relative overflow-hidden"
            initial={shouldAnimate ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: shouldAnimate ? 0.28 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <FooterDeliveryCardBody
              day={day}
              meta={meta}
              dotClass={accent.dot}
              cities={cities}
              windowRange={windowRange}
              windowSlots={windowSlots}
              feeDollars={feeDollars}
              freeThresholdDollars={freeThresholdDollars}
              animate={shouldAnimate && inView}
            />
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
