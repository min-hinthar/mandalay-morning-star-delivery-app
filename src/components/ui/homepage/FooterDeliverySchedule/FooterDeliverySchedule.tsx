"use client";

/**
 * FooterDeliverySchedule — the footer "Delivery Hours" column, reworked into a
 * per-day accordion of glassy cards (one per active delivery day) with real
 * direction → cities → cutoff → time-slot detail. Owns ONE `now` tick shared by
 * every card (gated to in-view via `useInView`, so the per-minute timer pauses
 * while the footer is offscreen — which it almost always is on load). The
 * soonest upcoming day is flagged "Next", derived from the same `now` so it
 * self-corrects across a cutoff rollover and can't drift from the live pills.
 * Degrades to a simple line when no schedule is configured (e.g. CI/empty DB).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Clock } from "lucide-react";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";
import { FooterDeliveryDayCard } from "./FooterDeliveryDayCard";
import { activeDeliveryDays, deliveryWindowRange } from "./schedule-meta";
import { msUntilCutoff } from "./cutoff-countdown";

export interface FooterDeliveryScheduleProps {
  deliveryDays?: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  deliveryStartHour?: number;
  deliveryEndHour?: number;
  prepTimeBufferMinutes?: number;
  freeDeliveryThresholdCents?: number;
}

const toDollars = (cents: number) => Math.round(cents / 100);

export function FooterDeliverySchedule({
  deliveryDays = [],
  deliveryZones = [],
  deliveryStartHour = 11,
  deliveryEndHour = 19,
  prepTimeBufferMinutes = 30,
  freeDeliveryThresholdCents,
}: FooterDeliveryScheduleProps) {
  const days = useMemo(() => activeDeliveryDays(deliveryDays), [deliveryDays]);
  const slotWindow = useMemo(
    () => deliveryWindowRange(deliveryStartHour, deliveryEndHour, prepTimeBufferMinutes),
    [deliveryStartHour, deliveryEndHour, prepTimeBufferMinutes]
  );
  const freeThresholdDollars =
    freeDeliveryThresholdCents !== undefined ? toDollars(freeDeliveryThresholdCents) : undefined;

  // ONE shared per-minute `now` tick for the whole schedule, gated to in-view so
  // it pauses while the footer is offscreen. `null` on SSR + first paint (and
  // until scrolled into view) → live values resolve post-mount, no hydration
  // mismatch and no forever-ticking offscreen timers.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "200px 0px" });
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!inView) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [inView]);

  // Soonest upcoming day — derived from the same shared `now`, so it self-
  // corrects each tick and never drifts from the per-card countdowns.
  const nextDayId = useMemo(() => {
    if (!now) return null;
    let best: { id: string; ms: number } | null = null;
    for (const day of days) {
      const ms = msUntilCutoff(day, now);
      if (ms != null && (!best || ms < best.ms)) best = { id: day.id, ms };
    }
    return best?.id ?? null;
  }, [days, now]);

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
    <div ref={rootRef} className="space-y-2">
      <ul className="space-y-2">
        {days.map((day) => (
          <li key={day.id}>
            <FooterDeliveryDayCard
              day={day}
              zones={deliveryZones}
              now={now}
              inView={inView}
              windowRange={slotWindow?.range ?? null}
              windowSlots={slotWindow?.slots ?? 0}
              feeDollars={toDollars(day.deliveryFeeCents)}
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
