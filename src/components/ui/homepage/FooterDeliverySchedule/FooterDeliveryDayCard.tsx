"use client";

/**
 * FooterDeliveryDayCard — one collapsible day in the footer delivery schedule.
 * Glassy translucent card on the dark footer with a per-direction triad accent,
 * a thematic direction icon, a LIVE cutoff countdown pill, and a height-spring
 * body revealing the served cities (chips), the full cutoff, the delivery
 * window, and the fee. Bilingual EN/MY. All values are real (delivery_days +
 * delivery_zones); motion honors reduced-motion.
 */

import { useId, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Clock, Tag, Timer, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { DAY_NAMES_FULL } from "@/lib/utils/delivery-schedule";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";
import {
  ACCENT_CLASSES,
  DIRECTION_META,
  citiesForDay,
  fullCutoff,
  shortCutoff,
} from "./schedule-meta";
import { useCutoffCountdown } from "./useCutoffCountdown";

interface FooterDeliveryDayCardProps {
  day: DeliveryDayConfig;
  zones: DeliveryZoneConfig[];
  /** Pre-computed delivery window, e.g. "12 – 7 PM". */
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
  const cd = useCutoffCountdown(day);
  const cities = citiesForDay(day, zones);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-input bg-footer-text/[0.06] ring-1 transition-colors",
        isNext ? accent.ring : "ring-footer-border hover:ring-footer-text/25"
      )}
    >
      {/* Accent edge */}
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-0.5", accent.dot)} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
      >
        <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-footer-text">
              {DAY_NAMES_FULL[day.dayOfWeek]}
            </span>
            <span className={cn("text-xs font-medium", accent.text)}>· {meta.label}</span>
            {isNext && (
              <span className="rounded-full bg-secondary px-1.5 text-2xs font-bold uppercase tracking-wide text-hero-ink">
                Next
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-footer-text-muted">
            {meta.region} · {shortCutoff(day)}
          </span>
        </span>
        {cd.label && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-semibold",
              accent.text,
              cd.soon ? "bg-secondary/15" : "bg-footer-text/10"
            )}
          >
            <Timer className="h-3 w-3" aria-hidden="true" />
            {cd.label}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-footer-text-muted transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={bodyId}
            className="overflow-hidden"
            initial={shouldAnimate ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: shouldAnimate ? 0.28 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-2.5 border-t border-footer-border px-3 py-3">
              {/* Served cities / regions as chips (hidden if a directional day
                  has no configured zone, so we never show an empty header) */}
              {cities.items.length > 0 && (
                <div>
                  <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-footer-text-muted">
                    {cities.kind === "regions" ? "Serving all directions" : "Serving"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.items.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full bg-footer-text/10 px-2 py-0.5 text-2xs font-medium text-footer-text"
                      >
                        <span
                          className={cn("h-1 w-1 rounded-full", accent.dot)}
                          aria-hidden="true"
                        />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cutoff · window · fee */}
              <ul className="space-y-1 text-xs text-footer-text">
                <li className="flex items-center gap-2">
                  <Clock
                    className="h-3.5 w-3.5 shrink-0 text-footer-text-muted"
                    aria-hidden="true"
                  />
                  {fullCutoff(day)}
                </li>
                {windowRange && (
                  <li className="flex items-center gap-2">
                    <Truck
                      className="h-3.5 w-3.5 shrink-0 text-footer-text-muted"
                      aria-hidden="true"
                    />
                    Delivery {windowRange} · {windowSlots} one-hour windows
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-footer-text-muted" aria-hidden="true" />
                  ${feeDollars} delivery
                  {freeThresholdDollars !== undefined && (
                    <> · free over ${freeThresholdDollars} (local)</>
                  )}
                </li>
              </ul>

              <p className="font-burmese text-2xs leading-relaxed text-footer-text-muted" lang="my">
                {meta.my} · {DAY_NAMES_FULL[day.dayOfWeek]} ပို့ဆောင်မှု
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
