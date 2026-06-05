"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Simple-mode route auto-completion.
 *
 * Simple mode has no explicit "Complete" button, so completion auto-fires once
 * every stop is handled (`allDone`). Returns `completionConfirmed` only after
 * the server confirms (`/complete` 2xx, or 400 = already completed) so the
 * caller can hold a "Finishing up…" state until then instead of celebrating a
 * route that isn't actually complete. Tracks connectivity reactively so the
 * POST retries on reconnect; the server's 409 guard covers the not-yet-persisted
 * (offline-queued last delivery) edge.
 */
export function useSimpleRouteCompletion(routeId: string, allDone: boolean) {
  const [isOnline, setIsOnline] = useState(true);
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
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
    if (!allDone || !isOnline || completeFiredRef.current) return;
    completeFiredRef.current = true;
    fetch(`/api/driver/routes/${routeId}/complete`, { method: "POST" })
      .then((res) => {
        // 200 = completed, 400 = already completed (idempotent re-land): the
        // route is finalized server-side — confirm and show the celebration.
        if (res.ok || res.status === 400) {
          setCompletionConfirmed(true);
          return;
        }
        // Transient (5xx) / not-yet-persisted (409) / rate-limit (429): clear
        // the latch so a later connectivity change or re-land retries.
        if (res.status >= 500 || res.status === 409 || res.status === 429) {
          completeFiredRef.current = false;
        }
      })
      .catch(() => {
        completeFiredRef.current = false;
      });
  }, [allDone, isOnline, routeId]);

  return { isOnline, completionConfirmed };
}
