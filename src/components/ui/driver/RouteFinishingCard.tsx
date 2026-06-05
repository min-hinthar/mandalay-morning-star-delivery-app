"use client";

/**
 * RouteFinishingCard — shown in simple mode after the last stop is handled but
 * before the server has confirmed route completion (`/complete` 2xx).
 *
 * Simple mode has no explicit "Complete" button — completion auto-fires from a
 * hook. Showing the celebration on client-derived `allDone` alone let a driver
 * tap "Go Home" (or background the app) before the route actually completed,
 * leaving it stuck `in_progress`. This holding state has no exit affordance in
 * the happy path, so the driver waits the (usually sub-second) confirmation out;
 * offline, it makes the "we'll finish automatically" promise explicit.
 *
 * On an unexpected/terminal failure (`hasError`) it must NOT trap the driver —
 * it surfaces a retry and a call-for-help so an expired session (401) or server
 * error at shift's end is recoverable.
 */

import { m } from "framer-motion";
import { Loader2, WifiOff, AlertTriangle, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RouteFinishingCardProps {
  /** Drives the offline reassurance copy. */
  isOnline?: boolean;
  /** Completion hit an unexpected/terminal error — show recovery controls. */
  hasError?: boolean;
  /** Re-attempt completion. */
  onRetry?: () => void;
  /** Operator phone for the call-for-help fallback (tel: link). */
  helpPhone?: string;
}

export function RouteFinishingCard({
  isOnline = true,
  hasError = false,
  onRetry,
  helpPhone,
}: RouteFinishingCardProps) {
  if (hasError) {
    return (
      <m.div
        role="alert"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-error-bg">
          <AlertTriangle className="h-8 w-8 text-status-error" aria-hidden />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-text-primary">
          Couldn&apos;t finish the route
        </h2>
        <p className="mt-2 max-w-xs font-body text-base text-text-secondary">
          Your deliveries are saved. We just couldn&apos;t wrap up the route — try again.
        </p>

        <button
          onClick={onRetry}
          className={cn(
            "mt-8 flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-card-sm",
            "bg-accent-teal font-body text-lg font-semibold text-text-inverse shadow-md",
            "transition-all duration-fast hover:shadow-lg active:scale-[0.98]"
          )}
        >
          Try again
        </button>

        {helpPhone && (
          <a
            href={`tel:${helpPhone}`}
            className={cn(
              "mt-3 flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-card-sm",
              "font-body text-sm font-medium text-text-secondary",
              "transition-colors duration-fast hover:bg-surface-secondary"
            )}
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call for help
          </a>
        )}
      </m.div>
    );
  }

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
