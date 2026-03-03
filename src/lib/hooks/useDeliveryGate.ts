"use client";

import { useState, useEffect } from "react";
import {
  getDeliveryDate,
  getTimeUntilCutoff,
  getCutoffForSaturday,
  getNextSaturday,
} from "@/lib/utils/delivery-dates";
import type { DeliveryDate } from "@/types/delivery";

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

// ============================================
// PURE FUNCTION (exported for testing)
// ============================================

/**
 * Compute delivery gate state from business rule params and a reference time.
 * Pure function — no side effects, safe to test without mocking React.
 */
export function computeDeliveryGate(
  cutoffDay: number,
  cutoffHour: number,
  now: Date = new Date()
): DeliveryGateState {
  const deliveryDate = getDeliveryDate(now, cutoffDay, cutoffHour);
  const timeUntilCutoff = getTimeUntilCutoff(now, cutoffDay, cutoffHour);
  const thisSaturday = getNextSaturday(now);
  const cutoffDate = getCutoffForSaturday(thisSaturday, cutoffDay, cutoffHour);
  const isOpen = !timeUntilCutoff.isPastCutoff;
  const urgency = computeUrgency(
    timeUntilCutoff.isPastCutoff,
    timeUntilCutoff.hours,
    timeUntilCutoff.minutes
  );

  return {
    isOpen,
    deliveryDate,
    cutoffDate,
    timeUntilCutoff,
    urgency,
  };
}

// ============================================
// HOOK
// ============================================

/**
 * Hook that returns live delivery gate state with dynamic polling.
 * Polls every 60s normally, switches to 10s during the final 30 minutes before cutoff.
 */
export function useDeliveryGate(cutoffDay: number, cutoffHour: number): DeliveryGateState {
  const [state, setState] = useState<DeliveryGateState>(() =>
    computeDeliveryGate(cutoffDay, cutoffHour)
  );

  useEffect(() => {
    // Immediately recompute on mount or param change
    setState(computeDeliveryGate(cutoffDay, cutoffHour));

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const newState = computeDeliveryGate(cutoffDay, cutoffHour);
      setState(newState);
      const totalMinutes = newState.timeUntilCutoff.hours * 60 + newState.timeUntilCutoff.minutes;
      // 10s polling during final 30 minutes (and not past cutoff), 60s otherwise
      const interval =
        totalMinutes <= 30 && !newState.timeUntilCutoff.isPastCutoff ? 10_000 : 60_000;
      timeoutId = setTimeout(tick, interval);
    };

    timeoutId = setTimeout(tick, 60_000);

    return () => clearTimeout(timeoutId);
  }, [cutoffDay, cutoffHour]);

  return state;
}
