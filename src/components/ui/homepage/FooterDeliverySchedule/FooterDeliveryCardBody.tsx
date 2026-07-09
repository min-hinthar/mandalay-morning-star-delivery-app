"use client";

/**
 * FooterDeliveryCardBody — the expanded detail of a delivery-day card on the
 * cream vellum surface: served cities as STAGGER-revealed chips (with an info
 * disclosure for distance-tiered pricing), the full cutoff, the delivery
 * window, a count-up fee, a bilingual note, and — on the soonest day — an
 * adaptive "Order for {day}" CTA. Text is hero-ink (constant) on cream.
 */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Clock, Info, Tag, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DAY_NAMES_FULL } from "@/lib/utils/delivery-schedule";
import type { DeliveryDayConfig } from "@/types/delivery";
import { RollingNumber } from "../Hero/RollingDigits";
import { fullCutoff, type DirectionMeta } from "./schedule-meta";

interface CardBodyProps {
  day: DeliveryDayConfig;
  meta: DirectionMeta;
  /** Vivid hero hue class for the city dots. */
  dotClass: string;
  cities: { kind: "cities" | "regions"; items: string[] };
  windowRange: string | null;
  windowSlots: number;
  feeDollars: number;
  freeThresholdDollars?: number;
  longFeeDollars?: number;
  longMiles?: number;
  /** Adaptive order destination (cart or menu). */
  orderHref: string;
  isNext: boolean;
  /** Count-up + chip stagger run only when in view + motion allowed. */
  animate: boolean;
}

const chipSpring = { type: "spring", stiffness: 320, damping: 22 } as const;

export function FooterDeliveryCardBody({
  day,
  meta,
  dotClass,
  cities,
  windowRange,
  windowSlots,
  feeDollars,
  freeThresholdDollars,
  longFeeDollars,
  longMiles,
  orderHref,
  isNext,
  animate,
}: CardBodyProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const dayName = DAY_NAMES_FULL[day.dayOfWeek];
  const hasPricingNote = longFeeDollars !== undefined && longMiles !== undefined;

  return (
    <div className="relative space-y-2.5 border-t border-hero-line px-3 py-3">
      {/* Served cities / regions — stagger-revealed chips + a pricing info note */}
      {cities.items.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <p className="text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
              {cities.kind === "regions" ? "Serving all directions" : "Serving"}
            </p>
            {hasPricingNote && (
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                aria-expanded={infoOpen}
                aria-label="Delivery pricing by distance"
                className="grid h-4 w-4 place-items-center rounded-full text-hero-ink-muted transition-colors hover:text-hero-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hero-clay/50"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cities.items.map((c, i) => (
              <m.span
                key={c}
                initial={animate ? { opacity: 0, y: 6, scale: 0.9 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...chipSpring, delay: animate ? 0.04 * i : 0 }}
                className="inline-flex items-center gap-1 rounded-full bg-hero-ink/[0.05] px-2 py-0.5 text-2xs font-medium text-hero-ink"
              >
                <span className={cn("h-1 w-1 rounded-full", dotClass)} aria-hidden="true" />
                {c}
              </m.span>
            ))}
          </div>
          {/* Distance-tiered pricing disclosure */}
          {hasPricingNote && (
            <AnimatePresence initial={false}>
              {infoOpen && (
                <m.p
                  initial={animate ? { opacity: 0, height: 0 } : false}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={animate ? { opacity: 0, height: 0 } : undefined}
                  transition={{ duration: animate ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-1.5 overflow-hidden text-2xs leading-relaxed text-hero-ink-muted"
                >
                  Within {longMiles} mi: ${feeDollars}
                  {freeThresholdDollars && freeThresholdDollars > 0
                    ? ` · free over $${freeThresholdDollars}`
                    : ""}
                  . Beyond {longMiles} mi: distance-based, set at checkout.
                </m.p>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Cutoff · window · count-up fee */}
      <ul className="space-y-1 text-xs text-hero-ink">
        <li className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-hero-ink-muted" aria-hidden="true" />
          {fullCutoff(day)}
        </li>
        {windowRange && (
          <li className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 shrink-0 text-hero-ink-muted" aria-hidden="true" />
            Delivery {windowRange} · {windowSlots} one-hour windows
          </li>
        )}
        <li className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 shrink-0 text-hero-ink-muted" aria-hidden="true" />
          {/* "from" — feeDollars is the local base; beyond the local zone pays
              distance-based fees (no free tier). Guard a real 0 threshold. */}
          from $
          <span aria-hidden="true">
            <RollingNumber value={feeDollars} animate={animate} />
          </span>
          <span className="sr-only">{feeDollars}</span> delivery
          {freeThresholdDollars !== undefined && freeThresholdDollars > 0 && (
            <>
              {" · free over $"}
              <span aria-hidden="true">
                <RollingNumber value={freeThresholdDollars} animate={animate} />
              </span>
              <span className="sr-only">{freeThresholdDollars}</span> (local)
            </>
          )}
        </li>
      </ul>

      <p className="font-burmese text-2xs leading-relaxed text-hero-ink/65" lang="my">
        {meta.my} · {dayName} ပို့ဆောင်မှု
      </p>

      {/* Order CTA — soonest day only, adaptive destination */}
      {isNext && (
        <Link
          href={orderHref}
          className="group/cta mt-1 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-hero-clay to-hero-clay-2 px-3 py-2 text-xs font-semibold text-hero-ink shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
        >
          Order for {dayName}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
