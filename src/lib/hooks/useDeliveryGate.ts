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

function computeUrgency(
  isPastCutoff: boolean,
  hours: number,
  minutes: number
): Urgency {
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
 * Hook that returns live delivery gate state, refreshed every minute.
 * Uses 60s interval — gate state doesn't need per-second resolution.
 */
export function useDeliveryGate(cutoffDay: number, cutoffHour: number): DeliveryGateState {
  const [state, setState] = useState<DeliveryGateState>(() =>
    computeDeliveryGate(cutoffDay, cutoffHour)
  );

  useEffect(() => {
    // Immediately recompute on mount or param change
    setState(computeDeliveryGate(cutoffDay, cutoffHour));

    const interval = setInterval(() => {
      setState(computeDeliveryGate(cutoffDay, cutoffHour));
    }, 60_000);

    return () => clearInterval(interval);
  }, [cutoffDay, cutoffHour]);

  return state;
}
