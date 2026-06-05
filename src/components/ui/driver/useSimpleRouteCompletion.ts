"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SimpleRouteCompletion {
  isOnline: boolean;
  /** Server confirmed the route is complete — safe to celebrate. */
  completionConfirmed: boolean;
  /** A non-retryable/unexpected failure — surface a recovery affordance. */
  completionError: boolean;
  /** Re-attempt completion (clears the error and refires the POST). */
  retryCompletion: () => void;
}

/**
 * Simple-mode route auto-completion.
 *
 * Simple mode has no explicit "Complete" button, so completion auto-fires once
 * every stop is handled (`allDone`). Returns `completionConfirmed` only after
 * the server confirms (`/complete` 2xx, or 400 = already completed) so the
 * caller can hold a "Finishing up…" state until then instead of celebrating a
 * route that isn't actually complete.
 *
 * Failure handling is deliberate so a driver is never trapped on a no-exit
 * spinner:
 *   - 2xx / 400  → confirmed (celebrate)
 *   - 409        → last delivery not yet persisted (offline-queued sync in
 *                  flight): keep waiting silently; retries on reconnect/re-land
 *   - else       → 401/403/404/429/5xx/network: surface `completionError` with a
 *                  manual retry (a 401 from an expired session at shift's end
 *                  must not lock the screen)
 */
export function useSimpleRouteCompletion(routeId: string, allDone: boolean): SimpleRouteCompletion {
  const [isOnline, setIsOnline] = useState(true);
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const completeFiredRef = useRef(false);

  // Reactive connectivity so the completion effect re-runs on reconnect.
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!allDone || !isOnline || completionConfirmed || completeFiredRef.current) return;
    completeFiredRef.current = true;
    setCompletionError(false);
    fetch(`/api/driver/routes/${routeId}/complete`, { method: "POST" })
      .then((res) => {
        if (res.ok || res.status === 400) {
          setCompletionConfirmed(true);
          return;
        }
        // Not yet persisted — self-heals once the queued delivery lands and the
        // driver reconnects. Hold the spinner silently.
        if (res.status === 409) {
          completeFiredRef.current = false;
          return;
        }
        // Unexpected/terminal (401/403/404/429/5xx): don't trap the driver on
        // an endless spinner — let them retry or call for help.
        completeFiredRef.current = false;
        setCompletionError(true);
      })
      .catch(() => {
        completeFiredRef.current = false;
        setCompletionError(true);
      });
    // `attempt` is an intentional refire trigger for manual retry.
  }, [allDone, isOnline, routeId, completionConfirmed, attempt]);

  const retryCompletion = useCallback(() => {
    setCompletionError(false);
    setAttempt((a) => a + 1);
  }, []);

  return { isOnline, completionConfirmed, completionError, retryCompletion };
}
