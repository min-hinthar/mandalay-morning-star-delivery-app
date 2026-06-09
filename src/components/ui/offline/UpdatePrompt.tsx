"use client";

/**
 * Update Prompt Component (64-02, After Dark reskin)
 * Presentational banner consuming useUpdateBanner hook.
 *
 * A warm-paper toast card (constant cream — it floats over arbitrary surfaces
 * in both themes, so it uses constant hero tokens): clay countdown progress,
 * gold sunburst-adjacent refresh disc, bilingual EN/MY copy, ≥44px actions.
 * Bottom-anchored above the iOS safe area; reduced-motion-safe slide-in.
 */

import { X, RefreshCw } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { useUpdateBanner } from "@/lib/hooks/useUpdateBanner";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";

export function UpdatePrompt() {
  const {
    showBanner,
    countdown,
    isPaused,
    isUpdating,
    canDismiss,
    version,
    progress,
    handleDismiss,
    handleUpdateNow,
  } = useUpdateBanner();
  const { shouldAnimate } = useAnimationPreference();

  return (
    <AnimatePresence>
      {showBanner && (
        <m.div
          initial={shouldAnimate ? { y: 100, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={shouldAnimate ? { y: 100, opacity: 0 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto max-w-lg sm:inset-x-auto sm:right-6 sm:w-full ${zClass.toast}`}
        >
          <div className="hero-surface-paper relative overflow-hidden rounded-2xl shadow-[0_2px_10px_-4px_rgba(20,20,19,0.2),0_18px_44px_-20px_rgba(20,20,19,0.45)]">
            <HeroCardLayers accent="clay" radius="rounded-2xl" ticks={false} />

            {/* Countdown progress — clay fill draining left over the gold-leaf track */}
            <div className="relative h-1 w-full bg-hero-line/60" aria-hidden="true">
              <div
                className="h-full bg-gradient-to-r from-hero-clay to-hero-gold transition-all ease-linear"
                style={{
                  width: `${progress * 100}%`,
                  transitionDuration: isPaused ? "0ms" : "1000ms",
                }}
              />
            </div>

            {/* Banner content */}
            <div className="relative flex items-center justify-between gap-3 px-4 py-3">
              {/* Left: refresh disc + bilingual text */}
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hero-clay/25 bg-hero-clay/10 text-hero-clay">
                  <RefreshCw
                    className={`h-4 w-4 ${isPaused || !shouldAnimate ? "" : "animate-spin-slow"}`}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 leading-tight">
                  {/* Live region holds only the STATIC line — the per-second
                      countdown below is aria-hidden so SRs aren't spammed */}
                  <p role="status" className="truncate text-xs font-semibold text-hero-ink">
                    A fresher version is ready
                    <span lang="my" className="font-burmese font-normal text-hero-ink-muted">
                      {" "}
                      · ဗားရှင်းအသစ် ရပါပြီ
                    </span>
                    <span className="sr-only">
                      . The page will reload shortly to apply the update.
                    </span>
                  </p>
                  <p aria-hidden="true" className="truncate text-xs text-hero-ink-muted">
                    {version && `v${version} · `}
                    {isUpdating ? "Updating…" : isPaused ? "Paused" : `Reloading in ${countdown}s`}
                  </p>
                </div>
              </div>

              {/* Right: actions (≥44px targets) */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={handleUpdateNow}
                  disabled={isUpdating}
                  className="min-h-11 whitespace-nowrap rounded-full bg-hero-accent px-4 text-xs font-bold text-hero-card-strong transition-colors hover:bg-hero-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? "Updating…" : "Update now"}
                </button>
                {canDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-hero-ink-muted transition-colors hover:bg-hero-clay/10 hover:text-hero-ink"
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
