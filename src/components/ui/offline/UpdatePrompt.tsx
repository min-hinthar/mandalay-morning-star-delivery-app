"use client";

/**
 * Update Prompt Component (64-02)
 * Presentational banner consuming useUpdateBanner hook.
 * Shows progress bar, version, countdown, interaction pause indicator.
 *
 * - Bottom toast position with slide-up animation
 * - Info color (blue) distinct from offline warning banner
 * - Progress bar shrinks over 10s countdown
 * - Pause indicator when user is interacting
 * - Dismiss button hidden after 3 dismissals (force-reload)
 */

import { X, RefreshCw } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { useUpdateBanner } from "@/lib/hooks/useUpdateBanner";

export function UpdatePrompt() {
  const {
    showBanner,
    countdown,
    isPaused,
    canDismiss,
    version,
    progress,
    handleDismiss,
    handleUpdateNow,
  } = useUpdateBanner();

  return (
    <AnimatePresence>
      {showBanner && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed bottom-0 left-0 right-0 ${zClass.toast}`}
        >
          {/* Progress bar */}
          <div className="h-1 w-full bg-status-info/20">
            <div
              className="h-full bg-status-info transition-all duration-1000 ease-linear"
              style={{
                width: `${progress * 100}%`,
                transitionDuration: isPaused ? "0ms" : "1000ms",
              }}
            />
          </div>

          {/* Banner content */}
          <div className="bg-status-info px-4 py-3 font-body text-sm font-medium text-text-inverse">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
              {/* Left: icon + text */}
              <div className="flex items-center gap-2.5">
                <RefreshCw className={`h-4 w-4 shrink-0 ${isPaused ? "" : "animate-spin-slow"}`} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold leading-tight">
                    A fresher version is ready!
                  </span>
                  <span className="text-xs leading-tight opacity-90">
                    {version && `v${version} is ready! · `}
                    {isPaused ? "Paused" : `Reloading in ${countdown}s`}
                  </span>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdateNow}
                  className="whitespace-nowrap rounded-full bg-overlay-light px-3 py-1 text-xs font-semibold transition-colors hover:bg-overlay"
                >
                  Update Now
                </button>
                {canDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="rounded-full p-1 transition-colors hover:bg-overlay-light"
                    aria-label="Dismiss update prompt"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default UpdatePrompt;
