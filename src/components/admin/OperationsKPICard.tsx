/**
 * V5 Sprint 4: Operations KPI Card
 *
 * Command-center styled KPI card for real-time operational awareness.
 * Features urgency indicators, status lights, and inline quick actions.
 *
 * Design: Industrial/Command Center aesthetic with purposeful visual hierarchy.
 */

"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type UrgencyLevel = "ok" | "moderate" | "urgent" | "critical";

export interface OperationsKPICardProps {
  /** The main value to display */
  value: number | string;
  /** Label shown below the value */
  label: string;
  /** Sub-label for additional context */
  subLabel?: string;
  /** Urgency level determines visual treatment */
  urgency?: UrgencyLevel;
  /** Custom urgency thresholds for numeric values */
  thresholds?: {
    moderate: number;
    urgent: number;
    critical?: number;
  };
  /** Show "Needs Attention" badge */
  showAttentionBadge?: boolean;
  /** Quick action button config */
  quickAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Loading state */
  loading?: boolean;
  /** Refreshing state */
  refreshing?: boolean;
  /** Error state */
  error?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Card click handler */
  onClick?: () => void;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

// ============================================
// URGENCY CONFIGURATION
// ============================================

const urgencyConfig: Record<
  UrgencyLevel,
  {
    border: string;
    bg: string;
    statusLight: string;
    statusGlow: string;
    badge: string;
    badgeText: string;
    textAccent: string;
  }
> = {
  ok: {
    border: "border-l-status-success",
    bg: "bg-surface-primary",
    statusLight: "bg-status-success",
    statusGlow: "shadow-[0_0_8px_var(--color-status-success)]",
    badge: "bg-status-success-bg",
    badgeText: "text-status-success",
    textAccent: "text-status-success",
  },
  moderate: {
    border: "border-l-status-warning",
    bg: "bg-status-warning-bg/30",
    statusLight: "bg-status-warning",
    statusGlow: "shadow-[0_0_8px_var(--color-status-warning)]",
    badge: "bg-status-warning-bg",
    badgeText: "text-status-warning",
    textAccent: "text-status-warning",
  },
  urgent: {
    border: "border-l-status-error",
    bg: "bg-status-error-bg/30",
    statusLight: "bg-status-error",
    statusGlow: "shadow-[0_0_12px_var(--color-status-error)]",
    badge: "bg-status-error-bg",
    badgeText: "text-status-error",
    textAccent: "text-status-error",
  },
  critical: {
    border: "border-l-status-error",
    bg: "bg-status-error-bg/50",
    statusLight: "bg-status-error",
    statusGlow: "shadow-[0_0_16px_var(--color-status-error)]",
    badge: "bg-status-error",
    badgeText: "text-text-inverse",
    textAccent: "text-status-error",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateUrgency(
  value: number | string,
  thresholds: { moderate: number; urgent: number; critical?: number }
): UrgencyLevel {
  if (typeof value !== "number") return "ok";
  if (value === 0) return "ok";
  if (thresholds.critical !== undefined && value >= thresholds.critical)
    return "critical";
  if (value >= thresholds.urgent) return "urgent";
  if (value >= thresholds.moderate) return "moderate";
  return "ok";
}

// ============================================
// ANIMATIONS
// ============================================

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 24 },
  },
};

const pulseKeyframes = {
  pulse: {
    opacity: [1, 0.6, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const statusLightPulse = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8, x: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.8, x: 10 },
};

// ============================================
// SUB-COMPONENTS
// ============================================

function StatusLight({
  urgency,
  animate,
}: {
  urgency: UrgencyLevel;
  animate: boolean;
}) {
  const config = urgencyConfig[urgency];

  return (
    <motion.div
      className="relative"
      variants={statusLightPulse}
      animate={animate && urgency !== "ok" ? "pulse" : "idle"}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-sm opacity-50",
          config.statusLight
        )}
      />
      {/* Main light */}
      <div
        className={cn(
          "relative h-3 w-3 rounded-full",
          config.statusLight,
          animate && urgency !== "ok" && config.statusGlow
        )}
      />
    </motion.div>
  );
}

function AttentionBadge({
  urgency,
  value,
}: {
  urgency: UrgencyLevel;
  value: number | string;
}) {
  const config = urgencyConfig[urgency];
  const numValue = typeof value === "number" ? value : parseInt(value, 10);

  if (numValue === 0 || isNaN(numValue)) return null;

  const getMessage = () => {
    if (urgency === "critical") return "CRITICAL";
    if (urgency === "urgent") return "URGENT";
    if (urgency === "moderate") return "ATTENTION";
    return "";
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <motion.div
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
        "text-[10px] font-bold uppercase tracking-wider",
        "border",
        config.badge,
        config.badgeText,
        urgency === "critical"
          ? "border-status-error/50"
          : urgency === "urgent"
            ? "border-status-error/30"
            : "border-status-warning/30"
      )}
    >
      {urgency === "critical" ? (
        <Zap className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}

function QuickActionButton({
  label,
  onClick,
  icon,
  urgency,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  urgency: UrgencyLevel;
}) {
  const isUrgent = urgency === "urgent" || urgency === "critical";

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "text-xs font-semibold",
        "transition-all duration-200",
        isUrgent
          ? [
              "bg-status-error text-text-inverse",
              "hover:bg-status-error/90",
              "shadow-sm hover:shadow-md",
            ]
          : [
              "bg-surface-tertiary text-text-primary",
              "hover:bg-interactive-primary-light hover:text-interactive-primary",
              "border border-border-v5 hover:border-interactive-primary/30",
            ]
      )}
    >
      {icon}
      <span>{label}</span>
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5",
          isUrgent ? "text-text-inverse/70" : "text-text-secondary"
        )}
      />
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OperationsKPICard({
  value,
  label,
  subLabel,
  urgency: providedUrgency,
  thresholds = { moderate: 1, urgent: 4, critical: 10 },
  showAttentionBadge = true,
  quickAction,
  loading = false,
  refreshing = false,
  error = false,
  onRetry,
  onClick,
  icon,
  className,
}: OperationsKPICardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate urgency if not provided
  const urgency = providedUrgency ?? calculateUrgency(value, thresholds);
  const config = urgencyConfig[urgency];
  const shouldAnimate = !prefersReducedMotion && urgency !== "ok";
  const isClickable = !!onClick;

  // Format value with monospace styling
  const formattedValue =
    typeof value === "number"
      ? new Intl.NumberFormat("en-US").format(value)
      : value;

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "relative h-[140px] rounded-xl bg-surface-primary",
          "border border-border-v5 border-l-4 border-l-border-v5",
          "p-5 overflow-hidden",
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-3 rounded-full bg-surface-tertiary" />
            <div className="h-5 w-20 rounded bg-surface-tertiary" />
          </div>
          <div className="h-10 w-24 rounded bg-surface-tertiary" />
          <div className="h-4 w-32 rounded bg-surface-tertiary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "relative h-[140px] rounded-xl bg-surface-primary",
          "border border-status-error/30 border-l-4 border-l-status-error",
          "p-5 flex flex-col items-center justify-center gap-3",
          className
        )}
      >
        <AlertTriangle className="h-6 w-6 text-status-error" />
        <span className="text-sm text-status-error font-medium">
          Failed to load
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold text-interactive-primary hover:underline"
          >
            Try again
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
      whileHover={
        isClickable
          ? { y: -3, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }
          : undefined
      }
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable ? (e) => e.key === "Enter" && onClick() : undefined
      }
      className={cn(
        "relative h-[140px] rounded-xl overflow-hidden",
        "border border-border-v5 border-l-4",
        "p-5 transition-all duration-200",
        config.border,
        config.bg,
        isClickable && "cursor-pointer",
        className
      )}
    >
      {/* Scan-line effect for urgent states */}
      {shouldAnimate && urgency !== "moderate" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
          }}
        />
      )}

      {/* Refreshing indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
            className="absolute top-4 right-4"
          >
            <RefreshCw className="h-4 w-4 text-text-secondary" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        {/* Header: Status light + Attention badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <StatusLight urgency={urgency} animate={shouldAnimate} />
            {icon && (
              <div className="text-text-secondary">{icon}</div>
            )}
          </div>
          <AnimatePresence>
            {showAttentionBadge && <AttentionBadge urgency={urgency} value={value} />}
          </AnimatePresence>
        </div>

        {/* Value - Monospace for data-terminal feel */}
        <motion.div
          variants={shouldAnimate ? pulseKeyframes : undefined}
          animate={shouldAnimate && urgency !== "moderate" ? "pulse" : undefined}
          className="flex-1"
        >
          <span
            className={cn(
              "font-mono text-4xl font-bold tracking-tight",
              urgency === "ok" ? "text-text-primary" : config.textAccent
            )}
          >
            {formattedValue}
          </span>
        </motion.div>

        {/* Label */}
        <div className="mt-1">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {subLabel && (
            <p className="text-xs text-text-secondary mt-0.5">{subLabel}</p>
          )}
        </div>

        {/* Quick Action */}
        {quickAction && (
          <div className="mt-3 -mb-1">
            <QuickActionButton
              label={quickAction.label}
              onClick={quickAction.onClick}
              icon={quickAction.icon}
              urgency={urgency}
            />
          </div>
        )}
      </div>

      {/* Corner accent for critical states */}
      {urgency === "critical" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-r-[24px] border-t-status-error border-r-transparent"
        />
      )}
    </motion.div>
  );
}

// ============================================
// GRID CONTAINER
// ============================================

export function OperationsKPIGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
      className="grid gap-4 grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PRE-CONFIGURED VARIANTS
// ============================================

interface PreConfiguredProps
  extends Omit<OperationsKPICardProps, "label" | "thresholds"> {
  label?: string;
}

/**
 * Order Queue KPI - Shows pending orders needing attention
 */
export function OrderQueueKPI({
  label = "Order Queue",
  quickAction,
  ...props
}: PreConfiguredProps) {
  return (
    <OperationsKPICard
      {...props}
      label={label}
      thresholds={{ moderate: 3, urgent: 8, critical: 15 }}
      quickAction={quickAction ?? {
        label: "View Queue",
        onClick: () => {},
      }}
    />
  );
}

/**
 * Prep Time KPI - Shows average prep time with urgency for delays
 */
export function PrepTimeKPI({
  label = "Avg Prep Time",
  ...props
}: PreConfiguredProps) {
  return (
    <OperationsKPICard
      {...props}
      label={label}
      subLabel="minutes"
      thresholds={{ moderate: 20, urgent: 30, critical: 45 }}
    />
  );
}

/**
 * Driver Assignments KPI - Shows unassigned orders
 */
export function DriverAssignmentsKPI({
  label = "Unassigned",
  quickAction,
  ...props
}: PreConfiguredProps) {
  return (
    <OperationsKPICard
      {...props}
      label={label}
      thresholds={{ moderate: 2, urgent: 5, critical: 10 }}
      quickAction={quickAction ?? {
        label: "Assign Drivers",
        onClick: () => {},
      }}
    />
  );
}

/**
 * Exceptions KPI - Shows delivery exceptions requiring attention
 */
export function ExceptionsKPI({
  label = "Exceptions",
  quickAction,
  ...props
}: PreConfiguredProps) {
  return (
    <OperationsKPICard
      {...props}
      label={label}
      thresholds={{ moderate: 1, urgent: 3, critical: 6 }}
      quickAction={quickAction ?? {
        label: "Review",
        onClick: () => {},
      }}
    />
  );
}

/**
 * Active Deliveries KPI - Shows in-progress deliveries (OK urgency variant)
 */
export function ActiveDeliveriesKPI({
  label = "Active Deliveries",
  ...props
}: PreConfiguredProps) {
  return (
    <OperationsKPICard
      {...props}
      label={label}
      urgency="ok"
      showAttentionBadge={false}
    />
  );
}
