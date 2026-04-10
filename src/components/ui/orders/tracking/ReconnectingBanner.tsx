"use client";

/**
 * ReconnectingBanner — TRAK-02
 *
 * Fixed-top banner shown when the tracking Realtime + polling connection drops.
 * 2s debounce eliminates flashing on momentary network blips.
 *
 * - Calm warmth copy ("Reconnecting..." not "Connection lost") per CONTEXT D-20
 * - Auto-dismiss on reconnect (no manual close button) per D-21
 * - aria-live="polite" (NOT assertive) per D-24
 * - Honors prefers-reduced-motion via useAnimationPreference().getSpring()
 *
 * Placement (by consumer): fixed top, below sticky header (z-30, top-14).
 */

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const DEBOUNCE_MS = 2000;

export interface ReconnectingBannerProps {
  /** Current connection state from useTrackingSubscription */
  isConnected: boolean;
}

export function ReconnectingBanner({ isConnected }: ReconnectingBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const { getSpring, shouldAnimate } = useAnimationPreference();

  // 2s debounce: only show banner if disconnected state persists
  useEffect(() => {
    if (isConnected) {
      setShowBanner(false);
      return;
    }
    const timer = setTimeout(() => setShowBanner(true), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isConnected]);

  return (
    <AnimatePresence>
      {showBanner && !isConnected && (
        <m.div
          key="reconnecting-banner"
          role="status"
          aria-live="polite"
          initial={shouldAnimate ? { y: -50, opacity: 0 } : { opacity: 0 }}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { opacity: 1 }}
          exit={
            shouldAnimate
              ? { y: -50, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
              : { opacity: 0 }
          }
          transition={getSpring({ type: "spring" as const, stiffness: 300, damping: 25 })}
          className="fixed top-14 left-0 right-0 z-fixed mx-4 rounded-xl border border-status-warning/20 bg-status-warning-bg p-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-warning/10">
              <WifiOff aria-hidden="true" className="h-4 w-4 text-status-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-status-warning">Reconnecting...</p>
              {/* BURMESE-REVIEW: native speaker sign-off before prod deploy */}
              <p className="text-xs text-text-muted">
                We&apos;re updating your driver&apos;s location
              </p>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
