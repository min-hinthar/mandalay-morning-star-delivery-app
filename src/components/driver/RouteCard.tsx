/**
 * V6 Route Card Component - Pepper Aesthetic
 *
 * Driver route card with V6 colors, typography, and high-contrast support.
 * Shows route status, progress, and action buttons.
 */

"use client";

import { motion } from "framer-motion";
import { Package, MapPin, Clock, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { RoutesRow } from "@/types/driver";

interface RouteData {
  id: string;
  status: RoutesRow["status"];
  stopCount: number;
  deliveredCount: number;
  pendingCount: number;
  totalDurationMinutes: number | null;
  startedAt: string | null;
  completedAt?: string | null;
}

interface RouteCardProps {
  route: RouteData | null;
  dateDisplay: string;
  dayOfWeek: string;
  onStartRoute?: () => void;
  onContinueRoute?: () => void;
  className?: string;
}

export function RouteCard({
  route,
  dateDisplay,
  dayOfWeek,
  onStartRoute,
  onContinueRoute,
  className,
}: RouteCardProps) {
  // No route assigned
  if (!route) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-v6-card bg-v6-surface-primary p-6 shadow-v6-md border border-v6-border",
          className
        )}
      >
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-v6-surface-tertiary">
            <Package className="h-8 w-8 text-v6-text-muted" />
          </div>
          <h2 className="mb-1 font-v6-display text-lg font-semibold text-v6-text-primary">
            No Route Today
          </h2>
          <p className="font-v6-body text-sm text-v6-text-muted">
            {dayOfWeek === "Saturday"
              ? "Check back later for route assignment"
              : "Routes are only scheduled on Saturdays"}
          </p>
        </div>
      </motion.div>
    );
  }

  // Route complete
  if (route.status === "completed") {
    const durationHours = route.totalDurationMinutes
      ? Math.floor(route.totalDurationMinutes / 60)
      : 0;
    const durationMinutes = route.totalDurationMinutes
      ? route.totalDurationMinutes % 60
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-v6-card bg-v6-surface-primary p-6 shadow-v6-md border border-v6-border",
          className
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-v6-text-muted">
            <Calendar className="h-4 w-4" />
            <span className="font-v6-body text-sm">{dateDisplay}</span>
          </div>
          <span className="rounded-full bg-v6-green/10 px-3 py-1 text-xs font-v6-body font-medium text-v6-green">
            Completed
          </span>
        </div>

        {/* Success message */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-v6-green/10">
            <CheckCircle className="h-7 w-7 text-v6-green" />
          </div>
          <h2 className="font-v6-display text-xl font-bold text-v6-text-primary">
            Route Complete!
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-v6-card-sm bg-v6-surface-secondary p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-v6-green">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="mt-1 font-v6-display text-2xl font-bold text-v6-text-primary">
              {route.deliveredCount}
            </p>
            <p className="font-v6-body text-xs text-v6-text-muted">Delivered</p>
          </div>
          <div className="rounded-v6-card-sm bg-v6-surface-secondary p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-v6-primary">
              <Clock className="h-5 w-5" />
            </div>
            <p className="mt-1 font-v6-display text-2xl font-bold text-v6-text-primary">
              {durationHours}h {durationMinutes}m
            </p>
            <p className="font-v6-body text-xs text-v6-text-muted">Duration</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Route ready or in progress
  const completionRate = Math.round(
    (route.deliveredCount / route.stopCount) * 100
  ) || 0;
  const estimatedHours = route.totalDurationMinutes
    ? (route.totalDurationMinutes / 60).toFixed(1)
    : null;
  const isInProgress = route.status === "in_progress";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-v6-card bg-v6-surface-primary p-6 shadow-v6-md border border-v6-border",
        className
      )}
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-v6-display text-lg font-semibold text-v6-text-primary">
          Today&apos;s Route
        </h2>
        <StatusBadge status={route.status} />
      </div>

      {/* Large stop count */}
      <div className="my-6 text-center">
        <p className="font-v6-display text-5xl font-bold text-v6-text-primary">
          {route.stopCount}
        </p>
        <p className="font-v6-body text-lg text-v6-text-muted">stops</p>
      </div>

      {/* Duration and start info */}
      <div className="mb-4 flex items-center justify-center gap-4 font-v6-body text-sm text-v6-text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {route.pendingCount} remaining
        </span>
        {estimatedHours && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{estimatedHours} hrs
          </span>
        )}
      </div>

      {/* Progress bar (when in progress) */}
      {isInProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between font-v6-body text-sm">
            <span className="text-v6-text-muted">Progress</span>
            <span className="font-medium text-v6-green">
              {route.deliveredCount}/{route.stopCount} ({completionRate}%)
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-v6-surface-tertiary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-v6-green"
            />
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="mt-6">
        {route.status === "planned" ? (
          <Button
            onClick={onStartRoute}
            className="h-14 w-full bg-v6-primary hover:bg-v6-primary-hover text-lg font-v6-body font-semibold text-white shadow-v6-sm"
            size="lg"
          >
            Start Route
          </Button>
        ) : (
          <Button
            onClick={onContinueRoute}
            className="h-14 w-full bg-v6-primary hover:bg-v6-primary-hover text-lg font-v6-body font-semibold text-white shadow-v6-sm"
            size="lg"
          >
            Continue Route
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: RoutesRow["status"] }) {
  const statusConfig = {
    planned: {
      label: "Ready",
      className: "bg-v6-primary/10 text-v6-primary",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-v6-green/10 text-v6-green",
    },
    completed: {
      label: "Completed",
      className: "bg-v6-surface-tertiary text-v6-text-muted",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 font-v6-body text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
