"use client";

/**
 * RouteFinishingCard — shown in simple mode after the last stop is handled but
 * before the server has confirmed route completion (`/complete` 2xx).
 *
 * Simple mode has no explicit "Complete" button — completion auto-fires from a
 * `useEffect`. Showing the celebration on client-derived `allDone` alone let a
 * driver tap "Go Home" (or background the app) before the route actually
 * completed, leaving it stuck `in_progress`. This holding state has no exit
 * affordance, so the driver waits the (usually sub-second) confirmation out;
 * offline, it makes the "we'll finish automatically" promise explicit.
 */

import { m } from "framer-motion";
import { Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RouteFinishingCardProps {
  /** Drives the offline reassurance copy. */
  isOnline?: boolean;
}

export function RouteFinishingCard({ isOnline = true }: RouteFinishingCardProps) {
  return (
    <m.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <Loader2 className="h-14 w-14 animate-spin text-accent-teal" aria-hidden />

      <h2 className="mt-6 font-display text-2xl font-bold text-text-primary">Finishing up…</h2>
      <p className="mt-2 max-w-xs font-body text-base text-text-secondary">
        {isOnline
          ? "Saving your last delivery and wrapping up the route."
          : "We'll finish the route as soon as you're back online."}
      </p>

      {!isOnline && (
        <span
          className={cn(
            "mt-5 flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1.5",
            "font-body text-sm font-medium text-text-secondary"
          )}
        >
          <WifiOff className="h-4 w-4" aria-hidden />
          Offline — nothing to do, it finishes automatically
        </span>
      )}
    </m.div>
  );
}

export default RouteFinishingCard;
