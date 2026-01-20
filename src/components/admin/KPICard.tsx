/**
 * V6 Admin KPI Cards - Pepper Aesthetic
 *
 * Key performance indicator cards for admin dashboard header.
 * Shows today's metrics with week-over-week comparison.
 *
 * V6 Features:
 * - 24px rounded corners
 * - V6 colors for trends (green up, red down)
 * - Spring animations for value changes
 * - V6 typography
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { triggerHaptic } from "@/lib/swipe-gestures";
import { v6Spring } from "@/lib/motion";

// ============================================
// TYPES
// ============================================

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
  /** Refreshing state (data updating in background) */
  refreshing?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message for tooltip */
  errorMessage?: string;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Click handler for drill-down */
  onClick?: () => void;
  /** Format for value display */
  format?: "number" | "currency" | "percentage" | "text";
  /** Currency code for currency format */
  currency?: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

const pulseVariants = {
  pulse: {
    opacity: [1, 0.6, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const valueChangeVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, y: 10 },
};

const iconSpinVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
};

// ============================================
// SKELETON LOADING STATE
// ============================================

function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-[110px] rounded-v6-card-sm",
        "bg-v6-surface-primary",
        "border border-v6-border",
        "p-5",
        className
      )}
    >
      <div className="animate-v6-shimmer space-y-3">
        <div className="h-9 w-20 rounded-v6-input bg-v6-surface-tertiary" />
        <div className="h-4 w-24 rounded-v6-input bg-v6-surface-tertiary" />
        <div className="h-3 w-16 rounded-v6-input bg-v6-surface-tertiary" />
      </div>
    </div>
  );
}

// ============================================
// ERROR STATE
// ============================================

interface KPICardErrorProps {
  onRetry?: () => void;
  errorMessage?: string;
  className?: string;
}

function KPICardError({ onRetry, errorMessage, className }: KPICardErrorProps) {
  return (
    <div
      className={cn(
        "h-[110px] rounded-v6-card-sm",
        "bg-v6-status-error-bg",
        "border border-v6-status-error/30",
        "p-5",
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-v6-status-error" />
      <span className="text-xs font-v6-body text-v6-status-error text-center">
        {errorMessage || "Error loading data"}
      </span>
      {onRetry && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("light");
            onRetry();
          }}
          className={cn(
            "text-xs font-v6-body font-medium",
            "text-v6-primary",
            "hover:text-v6-primary-hover",
            "hover:underline",
            "focus:outline-none focus:underline",
            "transition-colors duration-v6-fast"
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================
// MAIN KPI CARD COMPONENT
// ============================================

export function KPICard({
  value,
  label,
  comparison,
  comparisonLabel = "vs last week",
  variant = "default",
  loading = false,
  refreshing = false,
  error = false,
  errorMessage,
  onRetry,
  onClick,
  format = "number",
  currency = "USD",
  icon,
  className,
  testId,
}: KPICardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [prevValue, setPrevValue] = useState(value);
  const [valueKey, setValueKey] = useState(0);

  // Track value changes for animation
  useEffect(() => {
    if (value !== prevValue) {
      setPrevValue(value);
      setValueKey((k) => k + 1);
    }
  }, [value, prevValue]);

  // Format the display value
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val}%`;
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  };

  // Get comparison styling - V6 colors
  const getComparisonColor = () => {
    if (comparison === undefined || comparison === 0) {
      return "text-v6-text-muted";
    }
    // For exceptions, down is good (green), up is bad (error)
    if (variant === "exception") {
      return comparison > 0
        ? "text-v6-status-error"
        : "text-v6-green";
    }
    // For default, up is good (green), down is bad (error)
    return comparison > 0
      ? "text-v6-green"
      : "text-v6-status-error";
  };

  const getComparisonIcon = () => {
    if (comparison === undefined || comparison === 0) {
      return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    return comparison > 0 ? (
      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
    );
  };

  // Check if exception should be highlighted
  const isExceptionHighlighted =
    variant === "exception" && typeof value === "number" && value > 0;

  // Handle click with haptic
  const handleClick = useCallback(() => {
    if (onClick) {
      triggerHaptic("light");
      onClick();
    }
  }, [onClick]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        triggerHaptic("light");
        onClick();
      }
    },
    [onClick]
  );

  // Loading state
  if (loading) {
    return <KPICardSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return (
      <KPICardError
        onRetry={onRetry}
        errorMessage={errorMessage}
        className={className}
      />
    );
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={
        onClick && !prefersReducedMotion
          ? { y: -3, scale: 1.01 }
          : undefined
      }
      whileTap={onClick && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={v6Spring}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // V6 Base styles
        "relative h-[110px] rounded-v6-card-sm",
        "bg-v6-surface-primary",
        "border border-v6-border",
        "p-5",
        "transition-all duration-v6-fast",
        "shadow-v6-sm",
        // V6 Interactive styles
        onClick && [
          "cursor-pointer",
          "hover:border-v6-primary/30",
          "hover:shadow-v6-md",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-v6-primary/40",
          "focus-visible:ring-offset-2",
        ],
        // V6 Exception highlight
        isExceptionHighlighted && [
          "border-v6-status-error",
          "bg-v6-status-error-bg",
        ],
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={testId}
    >
      {/* V6 Refreshing indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-3"
          >
            <motion.div
              variants={prefersReducedMotion ? undefined : iconSpinVariants}
              animate="spin"
            >
              <RefreshCw
                className="h-3.5 w-3.5 text-v6-text-muted"
                aria-label="Refreshing data"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* V6 Click indicator (chevron) */}
      {onClick && !refreshing && (
        <ChevronRight
          className={cn(
            "absolute top-3 right-3 h-4 w-4",
            "text-v6-text-muted",
            "opacity-0 transition-opacity duration-v6-fast",
            "group-hover:opacity-100"
          )}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col justify-between h-full">
        {/* Top row: Icon + Value */}
        <div className="flex items-start gap-3">
          {/* V6 Optional icon */}
          {icon && (
            <div
              className={cn(
                "flex-shrink-0 p-2 rounded-v6-input",
                isExceptionHighlighted
                  ? "bg-v6-status-error/10 text-v6-status-error"
                  : "bg-v6-surface-tertiary text-v6-text-secondary"
              )}
            >
              {icon}
            </div>
          )}

          {/* V6 Value with animation on change */}
          <AnimatePresence mode="wait">
            <motion.span
              key={valueKey}
              variants={
                prefersReducedMotion ? undefined : valueChangeVariants
              }
              initial={prefersReducedMotion ? undefined : "initial"}
              animate={
                refreshing && !prefersReducedMotion
                  ? pulseVariants.pulse
                  : "animate"
              }
              exit="exit"
              className={cn(
                "font-v6-display text-4xl font-bold leading-none tracking-tight",
                isExceptionHighlighted
                  ? "text-v6-status-error"
                  : "text-v6-text-primary"
              )}
            >
              {formatValue(value)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* V6 Label */}
        <span
          className={cn(
            "text-sm font-v6-body font-medium",
            isExceptionHighlighted
              ? "text-v6-status-error"
              : "text-v6-text-secondary"
          )}
        >
          {label}
        </span>

        {/* V6 Comparison row */}
        {comparison !== undefined ? (
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-v6-body font-semibold",
              getComparisonColor()
            )}
          >
            {getComparisonIcon()}
            <span>
              {comparison > 0 ? "+" : ""}
              {Math.round(comparison)}%
            </span>
            <span className="font-normal text-v6-text-muted">
              {comparisonLabel}
            </span>
          </div>
        ) : (
          // Show neutral comparison label when no comparison data
          variant !== "exception" && (
            <div className="text-sm font-v6-body text-v6-text-muted">
              {comparisonLabel}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// KPI CARD GRID
// ============================================

export interface KPICardGridProps {
  children: React.ReactNode;
  /** Number of columns on desktop */
  columns?: 2 | 3 | 4;
  /** Additional class names */
  className?: string;
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function KPICardGrid({
  children,
  columns = 4,
  className,
}: KPICardGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const columnClass = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }[columns];

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate="visible"
      variants={prefersReducedMotion ? undefined : gridVariants}
      className={cn(
        "grid gap-5 grid-cols-2",
        columnClass,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PRE-CONFIGURED KPI CARDS
// ============================================

type PreConfiguredProps = Omit<KPICardProps, "label" | "format">;

/**
 * Pre-configured KPI card for Orders count
 */
export function OrdersKPICard(props: PreConfiguredProps) {
  return <KPICard {...props} label="Orders Today" format="number" />;
}

/**
 * Pre-configured KPI card for Active Drivers count
 */
export function DriversKPICard(props: PreConfiguredProps) {
  return <KPICard {...props} label="Active Drivers" format="number" />;
}

/**
 * Pre-configured KPI card for Exceptions (uses exception variant)
 */
export function ExceptionsKPICard(
  props: Omit<PreConfiguredProps, "variant">
) {
  return (
    <KPICard {...props} label="Exceptions" variant="exception" format="number" />
  );
}

/**
 * Pre-configured KPI card for Revenue (uses currency format)
 */
export function RevenueKPICard(props: PreConfiguredProps & { currency?: string }) {
  return <KPICard {...props} label="Revenue Today" format="currency" />;
}

/**
 * Pre-configured KPI card for Average Delivery Time
 */
export function DeliveryTimeKPICard(
  props: Omit<KPICardProps, "label" | "format">
) {
  const formattedValue =
    typeof props.value === "number" ? `${props.value} min` : props.value;
  return (
    <KPICard
      {...props}
      value={formattedValue}
      label="Avg. Delivery Time"
      format="text"
    />
  );
}

// ============================================
// HOOK: Auto-refresh KPI data
// ============================================

interface UseKPIRefreshOptions {
  /** Fetch function that returns the new value */
  fetchFn: () => Promise<number | string>;
  /** Refresh interval in milliseconds (default: 30000) */
  interval?: number;
  /** Whether auto-refresh is enabled */
  enabled?: boolean;
  /** Initial value */
  initialValue: number | string;
}

interface UseKPIRefreshReturn {
  value: number | string;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

export function useKPIRefresh({
  fetchFn,
  interval = 30000,
  enabled = true,
  initialValue,
}: UseKPIRefreshOptions): UseKPIRefreshReturn {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(false);
      setErrorMessage(null);
      const newValue = await fetchFn();
      setValue(newValue);
    } catch (err) {
      setError(true);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to refresh data"
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchFn]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const newValue = await fetchFn();
        if (mounted) {
          setValue(newValue);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load data"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchFn]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || loading) return;

    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [enabled, loading, interval, refresh]);

  return {
    value,
    loading,
    refreshing,
    error,
    errorMessage,
    refresh,
  };
}
