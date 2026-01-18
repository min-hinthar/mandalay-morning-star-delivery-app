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
          "rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]",
          className
        )}
      >
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
            <Package className="h-8 w-8 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="mb-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
            No Route Today
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
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
          "rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]",
          className
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{dateDisplay}</span>
          </div>
          <span className="rounded-full bg-[var(--color-status-success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent-secondary)]">
            Completed
          </span>
        </div>

        {/* Success message */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-success-bg)]">
            <CheckCircle className="h-7 w-7 text-[var(--color-accent-secondary)]" />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
            Route Complete!
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--color-surface-muted)] p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--color-accent-secondary)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {route.deliveredCount}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Delivered</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface-muted)] p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--color-interactive-primary)]">
              <Clock className="h-5 w-5" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {durationHours}h {durationMinutes}m
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Duration</p>
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
        "rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]",
        className
      )}
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
          Today&apos;s Route
        </h2>
        <StatusBadge status={route.status} />
      </div>

      {/* Large stop count */}
      <div className="my-6 text-center">
        <p className="font-display text-5xl font-bold text-[var(--color-text-primary)]">
          {route.stopCount}
        </p>
        <p className="text-lg text-[var(--color-text-muted)]">stops</p>
      </div>

      {/* Duration and start info */}
      <div className="mb-4 flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Progress</span>
            <span className="font-medium text-[var(--color-accent-secondary)]">
              {route.deliveredCount}/{route.stopCount} ({completionRate}%)
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-[var(--color-accent-secondary)]"
            />
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="mt-6">
        {route.status === "planned" ? (
          <Button
            onClick={onStartRoute}
            className="h-14 w-full bg-[var(--color-interactive-primary)] text-lg font-semibold text-white hover:bg-[var(--color-interactive-primary)]/90"
            size="lg"
          >
            Start Route
          </Button>
        ) : (
          <Button
            onClick={onContinueRoute}
            className="h-14 w-full bg-[var(--color-interactive-primary)] text-lg font-semibold text-white hover:bg-[var(--color-interactive-primary)]/90"
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
      className: "bg-[var(--color-interactive-primary-light)] text-[var(--color-interactive-primary)]",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-[var(--color-status-success-bg)] text-[var(--color-accent-secondary)]",
    },
    completed: {
      label: "Completed",
      className: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
