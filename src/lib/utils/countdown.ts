/**
 * Cutoff countdown logic for the "Morning Star" delivery-day ritual.
 *
 * Scheduled (not on-demand) delivery is the brand's signature: orders close at
 * a per-day cutoff, then arrive on a named delivery day. This turns that cutoff
 * into an anticipation moment with three phases:
 *   - calm:   plenty of time before cutoff
 *   - urgent: under `urgentThresholdMs` left (default 2h) — nudge, don't panic
 *   - locked: cutoff passed; the order window for that day is closed/locked in
 *
 * Pure + deterministic (inject `now`) so the UI tick stays a thin wrapper and
 * the phase math is unit-tested in isolation.
 */

export type CountdownPhase = "calm" | "urgent" | "locked";

export interface CountdownState {
  phase: CountdownPhase;
  /** Whole hours remaining (clamped at 0). */
  hours: number;
  /** Whole minutes within the current hour (0–59). */
  minutes: number;
  /** Whole seconds within the current minute (0–59). */
  seconds: number;
  /** Total milliseconds remaining (0 once locked). */
  totalMs: number;
  /** Total whole days remaining (for multi-day-out windows). */
  days: number;
}

/** Two hours, in ms — the default "now it's getting close" threshold. */
export const DEFAULT_URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000;

export interface CountdownOptions {
  /** Below this many ms remaining, phase becomes "urgent". Default 2h. */
  urgentThresholdMs?: number;
  /** Reference time; defaults to `Date.now()`. Inject for tests/SSR. */
  now?: Date | number;
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

/**
 * Compute the countdown state for a given cutoff instant.
 * Returns a `locked` zero-state for a past cutoff or an unparseable date, so
 * callers never have to special-case NaN.
 */
export function getCountdownState(
  cutoffAt: Date | string | number,
  options: CountdownOptions = {}
): CountdownState {
  const { urgentThresholdMs = DEFAULT_URGENT_THRESHOLD_MS, now } = options;
  const cutoffMs = toMs(cutoffAt);
  const nowMs = now == null ? Date.now() : toMs(now);

  const locked = {
    phase: "locked" as const,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    days: 0,
  };

  if (Number.isNaN(cutoffMs)) return locked;

  const totalMs = cutoffMs - nowMs;
  if (totalMs <= 0) return locked;

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    phase: totalMs <= urgentThresholdMs ? "urgent" : "calm",
    hours,
    minutes,
    seconds,
    totalMs,
    days,
  };
}

/**
 * Human "time left" label, granularity-adaptive:
 *   2d · 5h · 1h 23m · 8m 04s
 * Seconds only appear in the final minute so the line isn't visually noisy.
 */
export function formatTimeLeft(state: CountdownState): string {
  if (state.phase === "locked") return "Closed";

  if (state.days >= 1) {
    const remHours = state.hours - state.days * 24;
    return remHours > 0 ? `${state.days}d ${remHours}h` : `${state.days}d`;
  }
  if (state.hours >= 1) {
    return state.minutes > 0 ? `${state.hours}h ${state.minutes}m` : `${state.hours}h`;
  }
  if (state.minutes >= 1) {
    return `${state.minutes}m ${String(state.seconds).padStart(2, "0")}s`;
  }
  return `${state.seconds}s`;
}
