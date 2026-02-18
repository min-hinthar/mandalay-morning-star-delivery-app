"use client";

/**
 * Route Optimization Modal
 *
 * Shows before/after comparison when optimizing routes with time/distance savings.
 * Calls POST /api/admin/routes/optimize and displays comparison for admin approval.
 */

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { Loader2, Zap, ArrowRight, Clock, Route, MoveVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface StopSummary {
  id: string;
  stopNumber: number;
  customerName: string;
  address: string;
}

interface OptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  currentStops: StopSummary[];
  onApply: (
    optimizedStops: StopSummary[],
    savings: { durationSeconds: number; distanceMeters: number }
  ) => void;
}

interface OptimizationResult {
  routeId: string;
  orderedStopIds: string[];
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  polyline: string | null;
  message: string;
}

export function OptimizationModal({
  open,
  onOpenChange,
  routeId,
  currentStops,
  onApply,
}: OptimizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedStops, setOptimizedStops] = useState<StopSummary[] | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Calculate original route metrics (estimated from stop order)
  const originalDurationEstimate = currentStops.length * 10 * 60; // 10 min per stop estimate
  const originalDistanceEstimate = currentStops.length * 2 * 1609; // 2 miles per stop estimate

  const fetchOptimization = useCallback(async () => {
    if (!routeId || currentStops.length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to optimize route");
      }

      const result: OptimizationResult = await response.json();
      setOptimizationResult(result);

      // Map optimized order to stop summaries
      const orderedStops = result.orderedStopIds.map((id, index) => {
        const originalStop = currentStops.find((s) => s.id === id);
        return {
          id,
          stopNumber: index + 1,
          customerName: originalStop?.customerName || "Unknown",
          address: originalStop?.address || "Unknown address",
        };
      });

      setOptimizedStops(orderedStops);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize route");
    } finally {
      setIsLoading(false);
    }
  }, [routeId, currentStops]);

  // Fetch optimization when modal opens
  useEffect(() => {
    if (open) {
      fetchOptimization();
    } else {
      // Reset state when modal closes
      setOptimizedStops(null);
      setOptimizationResult(null);
      setError(null);
    }
  }, [open, fetchOptimization]);

  const handleApply = () => {
    if (!optimizedStops || !optimizationResult) return;

    // Calculate savings
    const savings = {
      durationSeconds: Math.max(
        0,
        originalDurationEstimate - optimizationResult.totalDurationSeconds
      ),
      distanceMeters: Math.max(
        0,
        originalDistanceEstimate - optimizationResult.totalDistanceMeters
      ),
    };

    onApply(optimizedStops, savings);
  };

  // Check which stops moved
  const getStopMovement = (stopId: string): "same" | "moved" => {
    if (!optimizedStops) return "same";
    const currentIndex = currentStops.findIndex((s) => s.id === stopId);
    const optimizedIndex = optimizedStops.findIndex((s) => s.id === stopId);
    return currentIndex === optimizedIndex ? "same" : "moved";
  };

  // Format time duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  };

  // Calculate savings
  const durationSaving = optimizationResult
    ? Math.max(0, originalDurationEstimate - optimizationResult.totalDurationSeconds)
    : 0;
  const distanceSaving = optimizationResult
    ? Math.max(0, originalDistanceEstimate - optimizationResult.totalDistanceMeters)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-surface-secondary to-surface-tertiary border-border-v5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-lg bg-gradient-to-br from-interactive-primary to-accent-tertiary text-text-inverse">
              <Zap className="h-5 w-5" />
            </div>
            Optimize Route
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Compare current stop order with optimized order based on traffic and distance.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Error state */}
          {error && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 rounded-lg bg-status-error-bg border border-status-error/30 text-status-error text-sm mb-4"
            >
              <Route className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </m.div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-interactive-primary mb-4" />
              <p className="text-text-secondary">Calculating optimal route...</p>
            </div>
          )}

          {/* Comparison view */}
          {!isLoading && !error && optimizedStops && (
            <>
              {/* Savings summary */}
              {(durationSaving > 0 || distanceSaving > 0) && (
                <m.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-4 p-4 rounded-lg bg-status-success-bg border border-status-success/30 mb-6"
                >
                  <div className="flex items-center gap-2 text-status-success font-medium">
                    <Clock className="h-4 w-4" />
                    <span>Saves {formatDuration(durationSaving)}</span>
                  </div>
                  <span className="text-status-success/50">/</span>
                  <div className="flex items-center gap-2 text-status-success font-medium">
                    <Route className="h-4 w-4" />
                    <span>{formatDistance(distanceSaving)}</span>
                  </div>
                </m.div>
              )}

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Order */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-text-muted" />
                    Current Order
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {currentStops.map((stop, index) => (
                      <m.div
                        key={stop.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          getStopMovement(stop.id) === "moved"
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30"
                            : "bg-surface-primary border-border-v5"
                        )}
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-text-muted/20 flex items-center justify-center text-xs font-medium text-text-secondary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {stop.customerName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{stop.address}</p>
                        </div>
                        {getStopMovement(stop.id) === "moved" && (
                          <MoveVertical className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </m.div>
                    ))}
                  </div>
                </div>

                {/* Arrow separator (desktop only) */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="p-2 rounded-full bg-interactive-primary text-text-inverse">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Optimized Order */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-status-success" />
                    Optimized Order
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {optimizedStops.map((stop, index) => {
                      const originalIndex = currentStops.findIndex((s) => s.id === stop.id);
                      const moved = originalIndex !== index;

                      return (
                        <m.div
                          key={stop.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                            moved
                              ? "bg-status-success-bg border-status-success/30"
                              : "bg-surface-primary border-border-v5"
                          )}
                        >
                          <div
                            className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              moved
                                ? "bg-status-success text-text-inverse"
                                : "bg-text-muted/20 text-text-secondary"
                            )}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {stop.customerName}
                            </p>
                            <p className="text-xs text-text-secondary truncate">{stop.address}</p>
                          </div>
                          {moved && (
                            <span className="text-xs text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                              #{originalIndex + 1} → #{index + 1}
                            </span>
                          )}
                        </m.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Route totals */}
              {optimizationResult && (
                <div className="mt-6 pt-4 border-t border-border-v5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Optimized route total:</span>
                    <span className="text-text-primary font-medium">
                      {formatDuration(optimizationResult.totalDurationSeconds)} /{" "}
                      {formatDistance(optimizationResult.totalDistanceMeters)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-border-v5 hover:bg-surface-tertiary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isLoading || !!error || !optimizedStops}
            className="bg-gradient-to-r from-interactive-primary to-accent-tertiary hover:opacity-90 text-text-inverse shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Apply Optimization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
