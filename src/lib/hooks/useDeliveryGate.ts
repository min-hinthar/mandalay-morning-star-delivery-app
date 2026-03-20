"use client";

import { useState, useEffect } from "react";
import {
  getDeliveryDate,
  getTimeUntilCutoff,
  getCutoffForSaturday,
  getNextSaturday,
  getNextDeliveryDate,
  getTimeUntilNextCutoff,
  getCutoffForDeliveryDay,
} from "@/lib/utils/delivery-dates";
import { TIMEZONE, type DeliveryDate, type DeliveryDayConfig } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export type Urgency = "normal" | "warning" | "critical";

export interface DeliveryGateState {
  isOpen: boolean;
  deliveryDate: DeliveryDate;
  cutoffDate: Date;
  timeUntilCutoff: { hours: number; minutes: number; isPastCutoff: boolean };
  urgency: Urgency;
  /** Day-of-week of the next delivery (for display helpers) */
  deliveryDayOfWeek?: number;
}

// ============================================
// HELPERS
// ============================================

function computeUrgency(isPastCutoff: boolean, hours: number, minutes: number): Urgency {
  if (isPastCutoff) return "critical";
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes <= 30) return "critical";
  if (totalMinutes <= 120) return "warning";
  return "normal";
}

function formatDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// PURE FUNCTIONS (exported for testing)
// ============================================

/** @deprecated Use computeDeliveryGateMultiDay instead */
export function computeDeliveryGate(
  cutoffDay: number,
  cutoffHour: number,
  now: Date = new Date()
): DeliveryGateState {
  const deliveryDate = getDeliveryDate(now, cutoffDay, cutoffHour);
  const timeUntilCutoff = getTimeUntilCutoff(now, cutoffDay, cutoffHour);
  const thisSaturday = getNextSaturday(now);
  const cutoffDate = getCutoffForSaturday(thisSaturday, cutoffDay, cutoffHour);
  const urgency = computeUrgency(
    timeUntilCutoff.isPastCutoff,
    timeUntilCutoff.hours,
    timeUntilCutoff.minutes
  );

  return {
    isOpen: !timeUntilCutoff.isPastCutoff,
    deliveryDate,
    cutoffDate,
    timeUntilCutoff,
    urgency,
  };
}

/** Multi-day delivery gate computation */
export function computeDeliveryGateMultiDay(
  deliveryDays: DeliveryDayConfig[],
  now: Date = new Date()
): DeliveryGateState {
  const nextDate = getNextDeliveryDate(now, deliveryDays);
  const timeInfo = getTimeUntilNextCutoff(now, deliveryDays);

  if (!nextDate || timeInfo.deliveryDayOfWeek === -1) {
    // No active delivery days — gate is closed
    const fallback = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      isOpen: false,
      deliveryDate: {
        date: fallback,
        dateString: toDateString(fallback),
        displayDate: "No delivery available",
        isNextWeek: true,
        cutoffPassed: true,
      },
      cutoffDate: now,
      timeUntilCutoff: { hours: 0, minutes: 0, isPastCutoff: true },
      urgency: "critical",
      deliveryDayOfWeek: -1,
    };
  }

  const dayConfig = deliveryDays.find(
    (d) => d.isActive && d.dayOfWeek === timeInfo.deliveryDayOfWeek
  );
  if (!dayConfig) {
    const fallback = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      isOpen: false,
      deliveryDate: {
        date: fallback,
        dateString: toDateString(fallback),
        displayDate: "No delivery available",
        isNextWeek: true,
        cutoffPassed: true,
      },
      cutoffDate: now,
      timeUntilCutoff: { hours: 0, minutes: 0, isPastCutoff: true },
      urgency: "critical",
      deliveryDayOfWeek: timeInfo.deliveryDayOfWeek,
    };
  }
  const cutoffDate = getCutoffForDeliveryDay(nextDate, dayConfig);
  const urgency = computeUrgency(timeInfo.isPastCutoff, timeInfo.hours, timeInfo.minutes);

  return {
    isOpen: !timeInfo.isPastCutoff,
    deliveryDate: {
      date: nextDate,
      dateString: toDateString(nextDate),
      displayDate: formatDateString(nextDate),
      isNextWeek: Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) > 7,
      cutoffPassed: false,
    },
    cutoffDate,
    timeUntilCutoff: timeInfo,
    urgency,
    deliveryDayOfWeek: timeInfo.deliveryDayOfWeek,
  };
}

// ============================================
// HOOKS
// ============================================

/** @deprecated Use useDeliveryGateMultiDay instead */
export function useDeliveryGate(cutoffDay: number, cutoffHour: number): DeliveryGateState {
  const [state, setState] = useState<DeliveryGateState>(() =>
    computeDeliveryGate(cutoffDay, cutoffHour)
  );

  useEffect(() => {
    setState(computeDeliveryGate(cutoffDay, cutoffHour));

    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      const newState = computeDeliveryGate(cutoffDay, cutoffHour);
      setState(newState);
      const totalMinutes = newState.timeUntilCutoff.hours * 60 + newState.timeUntilCutoff.minutes;
      const interval =
        totalMinutes <= 30 && !newState.timeUntilCutoff.isPastCutoff ? 10_000 : 60_000;
      timeoutId = setTimeout(tick, interval);
    };

    timeoutId = setTimeout(tick, 60_000);
    return () => clearTimeout(timeoutId);
  }, [cutoffDay, cutoffHour]);

  return state;
}

/** Multi-day delivery gate hook with dynamic polling */
export function useDeliveryGateMultiDay(deliveryDays: DeliveryDayConfig[]): DeliveryGateState {
  const [state, setState] = useState<DeliveryGateState>(() =>
    computeDeliveryGateMultiDay(deliveryDays)
  );

  useEffect(() => {
    setState(computeDeliveryGateMultiDay(deliveryDays));

    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      const newState = computeDeliveryGateMultiDay(deliveryDays);
      setState(newState);
      const totalMinutes = newState.timeUntilCutoff.hours * 60 + newState.timeUntilCutoff.minutes;
      const interval =
        totalMinutes <= 30 && !newState.timeUntilCutoff.isPastCutoff ? 10_000 : 60_000;
      timeoutId = setTimeout(tick, interval);
    };

    timeoutId = setTimeout(tick, 60_000);
    return () => clearTimeout(timeoutId);
  }, [deliveryDays]);

  return state;
}
