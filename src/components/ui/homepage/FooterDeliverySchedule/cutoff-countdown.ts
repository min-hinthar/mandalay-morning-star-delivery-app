/**
 * cutoffCountdown — PURE "time until this day's order cutoff" computed off a
 * caller-supplied `now`. Kept pure (no timer/state of its own) so the whole
 * schedule shares ONE in-view-gated tick in the parent instead of N forever
 * timers (the footer is offscreen on load). Returns null when `now` is null
 * (SSR / pre-mount / offscreen) so it can never hydration-mismatch. Uses the
 * shared LA-timezone cutoff math — never hand-rolled date math.
 */

import type { DeliveryDayConfig } from "@/types/delivery";
import { getCutoffForDeliveryDay, getNextDeliveryDate } from "@/lib/utils/delivery-dates";

export interface CutoffCountdown {
  /** Compact label, e.g. "2d 4h", "5h 12m", "12m" — or null when unresolved. */
  label: string | null;
  /** True once the next cutoff is within ~24h (urgency styling). */
  soon: boolean;
}

function format(ms: number): { label: string; soon: boolean } {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const soon = ms <= 24 * 60 * 60 * 1000;
  if (days > 0) return { label: `${days}d ${hours}h`, soon };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, soon };
  return { label: `${minutes}m`, soon: true };
}

/** Milliseconds until a day's next order cutoff, or null if none upcoming. */
export function msUntilCutoff(day: DeliveryDayConfig, now: Date): number | null {
  const nextDate = getNextDeliveryDate(now, [day]);
  const cutoff = nextDate ? getCutoffForDeliveryDay(nextDate, day) : null;
  if (!cutoff) return null;
  const ms = cutoff.getTime() - now.getTime();
  return ms > 0 ? ms : null;
}

export function cutoffCountdown(day: DeliveryDayConfig, now: Date | null): CutoffCountdown {
  if (!now) return { label: null, soon: false };
  const ms = msUntilCutoff(day, now);
  if (ms == null) return { label: null, soon: false };
  return format(ms);
}
