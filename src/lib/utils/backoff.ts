/**
 * Exponential backoff with a cap.
 *
 * Shared by Phase 110 query-provider (React Query retry delay) AND
 * Phase 112 useTrackingSubscription (Realtime reconnect delay).
 * Single source of truth prevents drift between the two consumers.
 *
 * Curve (default base=1000, max=30000):
 *   attempt 0 → 1000ms
 *   attempt 1 → 2000ms
 *   attempt 2 → 4000ms
 *   attempt 3 → 8000ms
 *   attempt 4 → 16000ms
 *   attempt 5 → 30000ms (cap reached)
 *   attempt 6+ → 30000ms (capped)
 */
export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30_000;

export function getBackoffDelay(
  attempt: number,
  baseMs: number = RECONNECT_BASE_MS,
  maxMs: number = RECONNECT_MAX_MS
): number {
  return Math.min(baseMs * 2 ** attempt, maxMs);
}
