"use client";

import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface CoverageResultProps {
  coverageData: {
    isValid: boolean;
    distanceMiles?: number;
    durationMinutes?: number;
  } | null | undefined;
  selectedAddress: { description: string; lat: number; lng: number } | null;
  onClear: () => void;
}

export function CoverageResult({ coverageData, selectedAddress, onClear }: CoverageResultProps) {
  const { getSpring } = useAnimationPreference();

  return (
    <AnimatePresence mode="wait">
      {coverageData && selectedAddress && (
        <m.div
          key={coverageData.isValid ? "success" : "error"}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={getSpring(spring.snappy)}
          className={cn(
            "mt-4 p-4 rounded-2xl",
            "flex items-center gap-4",
            coverageData.isValid
              ? cn(
                  "bg-gradient-to-r from-emerald-50 to-emerald-100/50",
                  "dark:from-emerald-950/40 dark:to-emerald-900/20",
                  "border-2 border-emerald-300 dark:border-emerald-700",
                  "shadow-[0_4px_20px_rgba(52,211,153,0.2)]"
                )
              : cn(
                  "bg-gradient-to-r from-rose-50 to-rose-100/50",
                  "dark:from-rose-950/40 dark:to-rose-900/20",
                  "border-2 border-rose-300 dark:border-rose-700",
                  "shadow-[0_4px_20px_rgba(244,63,94,0.2)]"
                )
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
              coverageData.isValid
                ? "bg-emerald-100 dark:bg-emerald-900/50"
                : "bg-rose-100 dark:bg-rose-900/50"
            )}
          >
            {coverageData.isValid ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-display font-bold text-base",
                coverageData.isValid
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              )}
            >
              {coverageData.isValid ? "We deliver here!" : "Outside our area"}
            </p>
            <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
              {coverageData.distanceMiles !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {coverageData.distanceMiles.toFixed(1)} mi
                </span>
              )}
              {coverageData.durationMinutes !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{coverageData.durationMinutes} min
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              "bg-surface-primary text-text-secondary border border-border",
              "hover:bg-surface-secondary",
              "transition-colors"
            )}
          >
            Clear
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
