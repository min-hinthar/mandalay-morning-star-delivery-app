"use client";

import { MapPin, Clock, User, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { RouteDurationEstimate } from "@/lib/utils/clustering";

// ============================================
// TYPES
// ============================================

interface RouteSummaryBarProps {
  selectedCount: number;
  duration: RouteDurationEstimate;
  driverName: string | null;
  timeWindowWarning: boolean;
  isCreating: boolean;
  onCreateRoute: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function RouteSummaryBar({
  selectedCount,
  duration,
  driverName,
  timeWindowWarning,
  isCreating,
  onCreateRoute,
}: RouteSummaryBarProps) {
  const isDisabled = selectedCount === 0 || isCreating;

  return (
    <div className="sticky bottom-0 bg-surface-primary border border-border rounded-xl p-4 shadow-lg space-y-3">
      {/* Time window warning */}
      {timeWindowWarning && selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Overlapping time windows detected — review before creating route
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-accent-teal" />
          <span className="text-sm font-semibold text-text-primary">
            {selectedCount} stop{selectedCount !== 1 ? "s" : ""}
          </span>
        </div>

        {selectedCount > 0 && duration.durationMinutes > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-secondary">~{duration.durationMinutes} min</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-text-muted" />
          <span
            className={cn(
              "text-sm",
              driverName ? "text-text-primary font-medium" : "text-text-muted"
            )}
          >
            {driverName ?? "No driver assigned"}
          </span>
        </div>
      </div>

      {/* Create button */}
      <Button
        onClick={onCreateRoute}
        disabled={isDisabled}
        className={cn(
          "w-full bg-accent-teal hover:bg-accent-teal/90 text-text-inverse shadow-md",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating route...
          </>
        ) : (
          <>Create Route</>
        )}
      </Button>

      {selectedCount === 0 && (
        <p className="text-xs text-center text-text-muted">
          Select at least one order to create a route
        </p>
      )}
    </div>
  );
}
