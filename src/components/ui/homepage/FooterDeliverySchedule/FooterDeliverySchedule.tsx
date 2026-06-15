"use client";

/**
 * FooterDeliverySchedule — the footer "Delivery Hours" column, reworked into a
 * per-day accordion of glassy cards (one per active delivery day) with real
 * direction → cities → cutoff → time-slot detail. The soonest upcoming day is
 * flagged "Next" client-side (post-mount, so it can't hydration-mismatch).
 * Degrades to a simple line when no schedule is configured (e.g. CI/empty DB).
 */

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";
import { getCutoffForDeliveryDay, getNextDeliveryDate } from "@/lib/utils/delivery-dates";
import { FooterDeliveryDayCard } from "./FooterDeliveryDayCard";
import { activeDeliveryDays, deliveryWindowRange } from "./schedule-meta";

export interface FooterDeliveryScheduleProps {
  deliveryDays?: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  deliveryStartHour?: number;
  deliveryEndHour?: number;
  prepTimeBufferMinutes?: number;
  freeDeliveryThresholdCents?: number;
}

const cents = (c: number) => Math.round(c / 100);

export function FooterDeliverySchedule({
  deliveryDays = [],
  deliveryZones = [],
  deliveryStartHour = 11,
  deliveryEndHour = 19,
  prepTimeBufferMinutes = 30,
  freeDeliveryThresholdCents,
}: FooterDeliveryScheduleProps) {
  const days = useMemo(() => activeDeliveryDays(deliveryDays), [deliveryDays]);
  const window = useMemo(
    () => deliveryWindowRange(deliveryStartHour, deliveryEndHour, prepTimeBufferMinutes),
    [deliveryStartHour, deliveryEndHour, prepTimeBufferMinutes]
  );
  const freeThresholdDollars =
    freeDeliveryThresholdCents !== undefined ? cents(freeDeliveryThresholdCents) : undefined;

  // Flag the soonest upcoming day — resolved AFTER mount so SSR markup (no
  // highlight) and the first client render match (no hydration mismatch).
  const [nextDayId, setNextDayId] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    let best: { id: string; ms: number } | null = null;
    for (const day of days) {
      const date = getNextDeliveryDate(now, [day]);
      const cutoff = date ? getCutoffForDeliveryDay(date, day) : null;
      if (!cutoff) continue;
      const ms = cutoff.getTime() - now.getTime();
      if (ms > 0 && (!best || ms < best.ms)) best = { id: day.id, ms };
    }
    setNextDayId(best?.id ?? null);
  }, [days]);

  // Graceful fallback — no schedule configured.
  if (days.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5" />
        <div>
          <p className="text-sm font-body font-medium">Weekly delivery</p>
          <p className="text-sm font-body text-footer-text-muted">
            Check the menu for the schedule
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {days.map((day) => (
          <li key={day.id}>
            <FooterDeliveryDayCard
              day={day}
              zones={deliveryZones}
              windowRange={window?.range ?? null}
              windowSlots={window?.slots ?? 0}
              feeDollars={cents(day.deliveryFeeCents)}
              freeThresholdDollars={freeThresholdDollars}
              isNext={day.id === nextDayId}
            />
          </li>
        ))}
      </ul>
      <p className="text-2xs leading-snug text-footer-text-muted">
        Tap a day for cities, cutoff &amp; slots · အသေးစိတ်ကြည့်ရန် နှိပ်ပါ
      </p>
    </div>
  );
}
