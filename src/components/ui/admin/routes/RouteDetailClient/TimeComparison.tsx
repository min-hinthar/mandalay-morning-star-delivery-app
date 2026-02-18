"use client";

import { m } from "framer-motion";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { RouteDetailResponse } from "./types";

interface TimeComparisonProps {
  route: RouteDetailResponse;
}

export function TimeComparison({ route }: TimeComparisonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const estimatedMinutes = route.stats?.total_duration_minutes;
  if (!estimatedMinutes) return null;

  // Calculate actual duration from startedAt -> completedAt
  let actualMinutes: number | null = null;
  if (route.startedAt && route.completedAt) {
    const started = new Date(route.startedAt).getTime();
    const completed = new Date(route.completedAt).getTime();
    actualMinutes = Math.round((completed - started) / 60000);
  }

  if (actualMinutes === null) return null;

  const delta = actualMinutes - estimatedMinutes;
  const isOnTime = delta <= 0;
  const maxMinutes = Math.max(estimatedMinutes, actualMinutes) * 1.2;
  const estimatedPercent = Math.min((estimatedMinutes / maxMinutes) * 100, 100);
  const actualPercent = Math.min((actualMinutes / maxMinutes) * 100, 100);

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className="bg-surface-secondary rounded-xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-primary">Time Comparison</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
            isOnTime
              ? "bg-status-success/10 text-status-success"
              : "bg-status-error/10 text-status-error"
          )}
        >
          {isOnTime ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {isOnTime ? `${Math.abs(delta)} min early` : `+${delta} min late`}
        </span>
      </div>

      <div className="space-y-3">
        {/* Estimated bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">Estimated</span>
            <span className="text-xs font-medium text-text-primary">{estimatedMinutes} min</span>
          </div>
          <div className="h-3 rounded-full bg-surface-tertiary overflow-hidden">
            <m.div
              initial={shouldAnimate ? { width: 0 } : undefined}
              animate={{ width: `${estimatedPercent}%` }}
              transition={getSpring(spring.gentle)}
              className="h-full rounded-full bg-accent-teal"
            />
          </div>
        </div>

        {/* Actual bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">Actual</span>
            <span className="text-xs font-medium text-text-primary">{actualMinutes} min</span>
          </div>
          <div className="h-3 rounded-full bg-surface-tertiary overflow-hidden">
            <m.div
              initial={shouldAnimate ? { width: 0 } : undefined}
              animate={{ width: `${actualPercent}%` }}
              transition={getSpring(spring.gentle)}
              className={cn(
                "h-full rounded-full",
                isOnTime ? "bg-status-success" : "bg-status-error"
              )}
            />
          </div>
        </div>
      </div>
    </m.div>
  );
}
