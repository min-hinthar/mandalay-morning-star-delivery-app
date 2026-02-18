"use client";

import { cn } from "@/lib/utils/cn";

const BAR_HEIGHTS = [40, 65, 50, 80, 55, 70, 45, 75, 60, 85, 50, 70];

interface ChartSkeletonProps {
  /** Per-chart label (e.g., "Loading revenue chart...") */
  label: string;
  /** Container height in pixels (default: 248) */
  height?: number;
  className?: string;
}

/**
 * Faux bar chart skeleton with staggered pulse animation.
 * Shows 12 bars of varying heights with per-chart label text.
 */
export function ChartSkeleton({ label, height = 248, className }: ChartSkeletonProps) {
  const barAreaHeight = height - 48; // subtract padding

  return (
    <div
      className={cn("rounded-xl bg-surface-primary p-6 shadow-sm", className)}
      role="status"
      aria-label={label}
    >
      <div className="flex items-end gap-2" style={{ height: barAreaHeight }}>
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-surface-tertiary animate-pulse"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-text-muted text-center">{label}</p>
    </div>
  );
}
