/**
 * V3 Sprint 5: Admin KPI Cards
 *
 * Key performance indicator cards for admin dashboard header.
 * Shows today's metrics with week-over-week comparison.
 */

"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface KPICardProps {
  /** The main value to display */
  value: number | string;
  /** Label shown below the value */
  label: string;
  /** Comparison value (percentage change) */
  comparison?: number;
  /** Comparison label (e.g., "vs last week") */
  comparisonLabel?: string;
  /** Card variant for special styling */
  variant?: "default" | "exception";
  /** Loading state */
  loading?: boolean;
  /** Refreshing state (data updating) */
  refreshing?: boolean;
  /** Error state */
  error?: boolean;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Click handler for drill-down */
  onClick?: () => void;
  /** Format for value display */
  format?: "number" | "currency" | "text";
  /** Additional class names */
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

const pulseVariants = {
  pulse: {
    opacity: [1, 0.7, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export function KPICard({
  value,
  label,
  comparison,
  comparisonLabel = "vs last week",
  variant = "default",
  loading = false,
  refreshing = false,
  error = false,
  onRetry,
  onClick,
  format = "number",
  className,
}: KPICardProps) {
  const prefersReducedMotion = useReducedMotion();

  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(val);
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  };

  const getComparisonColor = () => {
    if (comparison === undefined || comparison === 0) return "text-[var(--color-charcoal-muted)]";
    // For exceptions, down is good (jade), up is bad (error)
    if (variant === "exception") {
      return comparison > 0 ? "text-[var(--color-error)]" : "text-[var(--color-jade)]";
    }
    // For default, up is good (jade), down is bad (error)
    return comparison > 0 ? "text-[var(--color-jade)]" : "text-[var(--color-error)]";
  };

  const getComparisonIcon = () => {
    if (comparison === undefined || comparison === 0) {
      return <Minus className="h-3.5 w-3.5" />;
    }
    return comparison > 0 ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5" />
    );
  };

  const isExceptionHighlighted = variant === "exception" && typeof value === "number" && value > 0;

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "h-[100px] rounded-[var(--radius-md)] bg-white",
          "border border-[var(--color-border)]",
          "p-[var(--space-4)]",
          className
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-9 w-16 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-3 w-12 rounded bg-[var(--color-surface-muted)]" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "h-[100px] rounded-[var(--radius-md)] bg-white",
          "border border-[var(--color-error-light)]",
          "p-[var(--space-4)]",
          "flex flex-col items-center justify-center gap-2",
          className
        )}
      >
        <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
        <span className="text-xs text-[var(--color-error)]">Error loading</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? { y: -2, boxShadow: "var(--shadow-md)" } : undefined}
      onClick={onClick}
      className={cn(
        "relative h-[100px] rounded-[var(--radius-md)] bg-white",
        "border border-[var(--color-border)]",
        "p-[var(--space-4)]",
        "transition-shadow duration-[var(--duration-fast)]",
        onClick && "cursor-pointer",
        isExceptionHighlighted && [
          "border-[var(--color-error)]",
          "bg-[var(--color-error-light)]",
        ],
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Refreshing indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--color-charcoal-muted)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col justify-between h-full">
        {/* Value */}
        <motion.span
          variants={refreshing && !prefersReducedMotion ? pulseVariants : undefined}
          animate={refreshing ? "pulse" : undefined}
          className={cn(
            "font-display text-4xl font-bold leading-none",
            isExceptionHighlighted
              ? "text-[var(--color-error)]"
              : "text-[var(--color-charcoal)]"
          )}
        >
          {formatValue(value)}
        </motion.span>

        {/* Label */}
        <span className="text-sm text-[var(--color-charcoal-muted)]">
          {label}
        </span>

        {/* Comparison */}
        {comparison !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm font-semibold", getComparisonColor())}>
            {getComparisonIcon()}
            <span>
              {comparison > 0 ? "+" : ""}
              {Math.round(comparison)}%
            </span>
            <span className="font-normal text-[var(--color-charcoal-muted)]">
              {comparisonLabel}
            </span>
          </div>
        )}

        {/* No comparison - show neutral indicator or text */}
        {comparison === undefined && variant !== "exception" && (
          <div className="text-sm text-[var(--color-charcoal-muted)]">
            {comparisonLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Grid container for KPI cards with responsive layout
 */
export function KPICardGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
      className="grid gap-4 grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </motion.div>
  );
}

/**
 * Pre-configured KPI card for Orders
 */
export function OrdersKPICard(props: Omit<KPICardProps, "label" | "format">) {
  return <KPICard {...props} label="Orders" format="number" />;
}

/**
 * Pre-configured KPI card for Active Drivers
 */
export function DriversKPICard(props: Omit<KPICardProps, "label" | "format">) {
  return <KPICard {...props} label="Active Drivers" format="number" />;
}

/**
 * Pre-configured KPI card for Exceptions
 */
export function ExceptionsKPICard(props: Omit<KPICardProps, "label" | "variant" | "format">) {
  return <KPICard {...props} label="Exceptions" variant="exception" format="number" />;
}

/**
 * Pre-configured KPI card for Revenue
 */
export function RevenueKPICard(props: Omit<KPICardProps, "label" | "format">) {
  return <KPICard {...props} label="Revenue" format="currency" />;
}
