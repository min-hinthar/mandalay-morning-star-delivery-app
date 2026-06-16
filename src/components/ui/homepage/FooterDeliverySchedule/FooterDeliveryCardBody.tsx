"use client";

/**
 * FooterDeliveryCardBody — the expanded detail of a delivery-day card on the
 * cream vellum surface: served cities as STAGGER-revealed chips, the full
 * cutoff, the delivery window, and a count-up fee line, plus a bilingual note.
 * Text is hero-ink (constant dark) on cream; the accent shows on dots/icons.
 */

import { m } from "framer-motion";
import { Clock, Tag, Truck } from "lucide-react";
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
  animate,
}: CardBodyProps) {
  return (
    <div className="relative space-y-2.5 border-t border-hero-line px-3 py-3">
      {/* Served cities / regions — stagger-revealed chips */}
      {cities.items.length > 0 && (
        <div>
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
            {cities.kind === "regions" ? "Serving all directions" : "Serving"}
          </p>
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
          {/* "from" — feeDollars is the ≤25mi base; >25mi pays a flat higher fee
              with no free tier. Guard a real 0 threshold. */}
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
        {meta.my} · {DAY_NAMES_FULL[day.dayOfWeek]} ပို့ဆောင်မှု
      </p>
    </div>
  );
}
