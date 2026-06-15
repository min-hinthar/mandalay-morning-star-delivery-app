"use client";

/**
 * useCutoffCountdown — live "time until this day's order cutoff" for one
 * delivery day. SSR-safe: returns `null` on the server + first paint (so it can
 * never hydration-mismatch), then resolves and ticks once a minute after mount.
 * Uses the shared LA-timezone-correct cutoff math (never hand-rolled date math).
 */

import { useEffect, useState } from "react";
import type { DeliveryDayConfig } from "@/types/delivery";
import { getCutoffForDeliveryDay, getNextDeliveryDate } from "@/lib/utils/delivery-dates";

export interface CutoffCountdown {
  /** Compact label, e.g. "2d 4h", "5h", "12m" — or null pre-mount / when closed. */
  label: string | null;
  /** True once the next cutoff is computed and within ~24h (urgency styling). */
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

export function useCutoffCountdown(day: DeliveryDayConfig): CutoffCountdown {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) return { label: null, soon: false };

  const nextDate = getNextDeliveryDate(now, [day]);
  const cutoff = nextDate ? getCutoffForDeliveryDay(nextDate, day) : null;
  if (!cutoff) return { label: null, soon: false };

  const ms = cutoff.getTime() - now.getTime();
  if (ms <= 0) return { label: null, soon: false };

  return format(ms);
}
