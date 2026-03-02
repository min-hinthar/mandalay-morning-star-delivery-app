"use client";

import { useState, useEffect } from "react";

// ============================================
// TYPES
// ============================================

export interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  label: string;
}

// ============================================
// PURE FUNCTION (exported for testing)
// ============================================

/**
 * Compute countdown values from a target date.
 * Pure function — no side effects.
 * @param target - the target date to count down to
 * @param label - descriptive label for the countdown
 * @param now - current time (defaults to Date.now() for testability)
 */
export function computeCountdown(
  target: Date,
  label: string,
  now: Date = new Date()
): CountdownState {
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isPast: true, label };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, isPast: false, label };
}

// ============================================
// HOOK
// ============================================

/**
 * Countdown hook that ticks every 1 second.
 * Returns current countdown state to a target date.
 */
export function useCountdown(targetDate: Date, label: string): CountdownState {
  const [state, setState] = useState<CountdownState>(() => computeCountdown(targetDate, label));

  useEffect(() => {
    // Immediately compute on mount/target change
    setState(computeCountdown(targetDate, label));

    const interval = setInterval(() => {
      setState(computeCountdown(targetDate, label));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, label]);

  return state;
}
