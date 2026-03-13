"use client";

import { m } from "framer-motion";
import { MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { CoverageCheckResult } from "@/types/address";
import { COVERAGE_LIMITS } from "@/types/address";

interface CoverageErrorCardProps {
  coverage: Partial<CoverageCheckResult>;
  className?: string;
}

export function CoverageErrorCard({ coverage, className }: CoverageErrorCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const distanceMiles = coverage.distanceMiles ?? 0;
  const maxDistance = COVERAGE_LIMITS.maxDistanceMiles;
  const ratio = Math.min(distanceMiles / maxDistance, 1.5);
  const isDistanceExceeded = coverage.reason === "DISTANCE_EXCEEDED";
  const isDurationExceeded = coverage.reason === "DURATION_EXCEEDED";

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "rounded-xl border border-status-error/20 bg-status-error-bg p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-status-error/10">
          <AlertTriangle className="w-5 h-5 text-status-error" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-status-error text-sm">Outside Delivery Area</p>
          <p className="text-xs text-text-muted mt-0.5">
            {isDistanceExceeded
              ? `Your address is ${distanceMiles.toFixed(1)} miles away — we deliver up to ${maxDistance} miles from our kitchen in Covina, CA.`
              : isDurationExceeded
                ? `Your address is too far by drive time — we deliver within 90 minutes of our kitchen.`
                : "This address could not be verified for delivery coverage."}
          </p>
          <p className="text-xs text-text-muted/70 mt-1">
            သင့်လိပ်စာသည် ကျွန်ုပ်တို့၏ ပို့ဆောင်ရေးနယ်မြေ ပြင်ပတွင် ရှိနေပါသည်။
          </p>
        </div>
      </div>

      {/* Distance progress bar */}
      {distanceMiles > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-2xs text-text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Kitchen
            </span>
            <span>
              {distanceMiles.toFixed(1)} mi / {maxDistance} mi max
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <m.div
              initial={shouldAnimate ? { width: 0 } : undefined}
              animate={shouldAnimate ? { width: `${Math.min(ratio * 100, 100)}%` } : undefined}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                ratio > 1 ? "bg-status-error" : "bg-status-warning"
              )}
            />
          </div>
        </div>
      )}
    </m.div>
  );
}
