"use client";

import { m } from "framer-motion";
import { MapPin, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

import { COVERAGE_LIMITS } from "@/types/address";

interface StatusBarProps {
  nextDeliveryDate: string;
  deliverySchedule?: string;
}

export function StatusBar({ nextDeliveryDate, deliverySchedule }: StatusBarProps) {
  const { shouldAnimate } = useAnimationPreference();

  const handleScrollToCoverage = () => {
    const el = document.getElementById("how-it-works");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...spring.gentle, delay: 0.4 }}
      className="absolute bottom-3 left-3 right-3"
    >
      <div className={cn("px-4 py-3 rounded-xl hero-surface-paper", "shadow-lg")}>
        <div className="flex items-center justify-between gap-3">
          {/* Left: coverage stats */}
          <div className="flex items-center gap-3 text-xs font-medium text-hero-ink-muted flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-hero-clay" />
              <span className="font-semibold text-hero-ink">
                {COVERAGE_LIMITS.maxDistanceMiles} mi
              </span>
            </span>
            <span className="text-hero-ink-muted/40">&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-hero-ink-muted" />
              <span>{COVERAGE_LIMITS.maxDurationMinutes} min</span>
            </span>
            <span className="text-hero-ink-muted/40 hidden sm:inline">&bull;</span>
            <span className="hidden sm:flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-hero-ink-muted" />
              <span>{deliverySchedule ?? "Mon/Wed/Thu/Sat"}</span>
            </span>
          </div>

          {/* Right: delivery info + CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {nextDeliveryDate && (
              <span className="px-2 py-1 rounded-lg bg-hero-clay/12 text-hero-accent text-xs font-bold hidden sm:inline">
                Next: {nextDeliveryDate}
              </span>
            )}
            <button
              type="button"
              onClick={handleScrollToCoverage}
              className={cn(
                "text-xs font-semibold text-hero-accent hover:text-hero-accent-strong",
                "transition-colors duration-150 whitespace-nowrap"
              )}
            >
              Check your address &darr;
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
}
