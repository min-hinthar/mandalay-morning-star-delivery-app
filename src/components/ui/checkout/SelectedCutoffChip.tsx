"use client";

import { useMemo } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCountdown } from "@/lib/hooks/useCountdown";
import type { Urgency } from "@/lib/hooks/useDeliveryGate";
import {
  getCutoffForDeliveryDay,
  getZonedDayOfWeek,
  parseDeliveryDateToUtc,
} from "@/lib/utils/delivery-dates";
import { TIMEZONE, type DeliveryDayConfig } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export interface SelectedCutoffChipProps {
  /** The SELECTED delivery date (YYYY-MM-DD) — not the nearest of all days */
  dateString: string | null | undefined;
  deliveryDays: DeliveryDayConfig[];
  /** "chip" = compact pill (time step header); "row" = full-width line (payment summary) */
  variant?: "chip" | "row";
  className?: string;
}

// ============================================
// HELPERS
// ============================================

/** Stable placeholder target for the unconditional useCountdown call. */
const EPOCH = new Date(0);

const cutoffTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIMEZONE,
});

/** Resolve the cutoff instant for a selected delivery date, or null when unknowable. */
export function resolveSelectedCutoff(
  dateString: string | null | undefined,
  deliveryDays: DeliveryDayConfig[]
): Date | null {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString) || deliveryDays.length === 0) {
    return null;
  }
  const deliveryDate = parseDeliveryDateToUtc(dateString);
  const dayOfWeek = getZonedDayOfWeek(deliveryDate);
  // Assumes the 1:1 weekday→run model the whole day engine shares (a
  // DeliverySelection carries only a date). If same-weekday split runs ever
  // land, this needs the selected day's direction/id threaded through.
  const dayConfig = deliveryDays.find((d) => d.isActive && d.dayOfWeek === dayOfWeek);
  if (!dayConfig) return null;
  return getCutoffForDeliveryDay(deliveryDate, dayConfig);
}

// ============================================
// COMPONENT
// ============================================

/**
 * SelectedCutoffChip — a live "order by" deadline for the customer's SELECTED
 * delivery date. The menu rail and cart drawer count down to the nearest run of
 * ANY day; once a date is chosen inside checkout, the only deadline that
 * matters is that date's own cutoff — this chip keeps it in view through the
 * time and payment steps (the two places a session lingers long enough to
 * silently cross it). Same urgency thresholds as the delivery gate: amber
 * under 2h, red under 30m.
 */
export function SelectedCutoffChip({
  dateString,
  deliveryDays,
  variant = "chip",
  className,
}: SelectedCutoffChipProps) {
  const cutoffDate = useMemo(
    () => resolveSelectedCutoff(dateString, deliveryDays),
    [dateString, deliveryDays]
  );

  // Hooks must run unconditionally — count down to epoch when unknown, gate
  // render below. The epoch MUST be a stable module-level instance: an inline
  // `new Date(0)` changes identity every render, so useCountdown's effect
  // (deps: [targetDate]) re-runs and setStates a fresh object each cycle —
  // an infinite effect loop that live-locks any checkout where the cutoff is
  // unresolvable (e.g. the legacy no-multi-day config).
  const countdown = useCountdown(cutoffDate ?? EPOCH, "order cutoff");
  if (!cutoffDate) return null;

  const totalMinutes = countdown.hours * 60 + countdown.minutes;
  const urgency: Urgency =
    countdown.isPast || totalMinutes <= 30
      ? "critical"
      : totalMinutes <= 120
        ? "warning"
        : "normal";
  const cutoffLabel = cutoffTimeFormatter.format(cutoffDate);
  const remaining =
    countdown.hours > 0 ? `${countdown.hours}h ${countdown.minutes}m` : `${countdown.minutes}m`;

  const Icon = countdown.isPast ? AlertTriangle : Clock;

  return (
    <div
      className={cn(
        "items-center gap-1.5 text-xs font-semibold",
        variant === "chip" &&
          "inline-flex rounded-pill border border-hero-line bg-hero-card px-3 py-1.5",
        variant === "row" && "flex",
        urgency === "normal" && "text-hero-ink-muted",
        urgency === "warning" && "text-amber-600 dark:text-amber-400",
        urgency === "critical" && "text-destructive",
        variant === "chip" && urgency === "warning" && "border-amber-500/40 bg-amber-500/10",
        variant === "chip" && urgency === "critical" && "border-destructive/40 bg-destructive/10",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {countdown.isPast ? (
        <span role="status">
          Order cutoff passed
          <span className="font-burmese font-normal" lang="my">
            {" "}
            · အချိန်ကုန်သွားပါပြီ
          </span>
        </span>
      ) : (
        // Deliberately NOT aria-live: the text updates every minute, and a
        // polite region would re-announce the full deadline string each time
        // (twice — the chip mounts on two steps). The deadline is static
        // context; only the "cutoff passed" branch above announces.
        <span>
          Order by {cutoffLabel}
          <span className={cn("tabular-nums", urgency === "normal" && "text-hero-ink")}>
            {" "}
            · {remaining} left
          </span>
          <span className="sr-only" lang="my">
            {cutoffLabel} နောက်ဆုံးထား မှာယူပါ
          </span>
        </span>
      )}
    </div>
  );
}

export default SelectedCutoffChip;
