"use client";

/**
 * V7 Admin Dashboard - Motion-First Playful Design
 *
 * Sprint 8: Admin Dashboard
 * Features: Animated KPIs with pulse indicators, real-time updates,
 * staggered card entrance, spring-based value animations
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Truck,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  v7Spring,
  v7StaggerContainer,
  v7StaggerItem,
  v7Celebration,
} from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface KPIData {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: "number" | "currency" | "percentage" | "duration";
  icon: "orders" | "revenue" | "drivers" | "exceptions" | "target" | "activity";
  variant?: "default" | "success" | "warning" | "danger";
  goal?: number;
}

export interface AdminDashboardV7Props {
  /** KPI data array */
  kpis: KPIData[];
  /** Whether data is loading */
  loading?: boolean;
  /** Whether data is refreshing in background */
  refreshing?: boolean;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED VALUE DISPLAY
// ============================================

interface AnimatedValueV7Props {
  value: number;
  format: "number" | "currency" | "percentage" | "duration";
  className?: string;
}

function AnimatedValueV7({ value, format, className }: AnimatedValueV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();

  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.01,
  });

  const displayValue = useTransform(springValue, (v) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(v / 100);
      case "percentage":
        return `${Math.round(v)}%`;
      case "duration":
        return `${Math.round(v)} min`;
      default:
        return new Intl.NumberFormat("en-US").format(Math.round(v));
    }
  });

  useEffect(() => {
    if (shouldAnimate) {
      springValue.set(value);
    } else {
      springValue.jump(value);
    }
  }, [value, springValue, shouldAnimate]);

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {displayValue}
    </motion.span>
  );
}

// ============================================
// KPI CARD V7
// ============================================

interface KPICardV7Props {
  data: KPIData;
  index: number;
  refreshing?: boolean;
  onGoalReached?: () => void;
}

const iconMap = {
  orders: Package,
  revenue: DollarSign,
  drivers: Truck,
  exceptions: AlertTriangle,
  target: Target,
  activity: Activity,
};

const variantStyles = {
  default: {
    bg: "bg-v6-surface-primary",
    border: "border-v6-border",
    iconBg: "bg-v6-primary/10",
    iconColor: "text-v6-primary",
  },
  success: {
    bg: "bg-v6-green/5",
    border: "border-v6-green/20",
    iconBg: "bg-v6-green/10",
    iconColor: "text-v6-green",
  },
  warning: {
    bg: "bg-v6-secondary/5",
    border: "border-v6-secondary/20",
    iconBg: "bg-v6-secondary/10",
    iconColor: "text-v6-secondary",
  },
  danger: {
    bg: "bg-v6-status-error/5",
    border: "border-v6-status-error/20",
    iconBg: "bg-v6-status-error/10",
    iconColor: "text-v6-status-error",
  },
};

function KPICardV7({ data, index, refreshing, onGoalReached }: KPICardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [hasReachedGoal, setHasReachedGoal] = useState(false);

  const Icon = iconMap[data.icon];
  const variant = data.variant || "default";
  const styles = variantStyles[variant];

  // Calculate change percentage
  const change = data.previousValue
    ? ((data.value - data.previousValue) / data.previousValue) * 100
    : 0;

  // Goal progress
  const goalProgress = data.goal ? Math.min((data.value / data.goal) * 100, 100) : 0;

  // Check for goal reached
  useEffect(() => {
    if (data.goal && data.value >= data.goal && !hasReachedGoal) {
      setHasReachedGoal(true);
      onGoalReached?.();
    }
  }, [data.value, data.goal, hasReachedGoal, onGoalReached]);

  return (
    <motion.div
      variants={v7StaggerItem}
      whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      className={cn(
        "relative rounded-2xl p-5",
        "border shadow-sm",
        "transition-shadow hover:shadow-lg",
        styles.bg,
        styles.border
      )}
    >
      {/* Refreshing indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-3"
          >
            <motion.div
              animate={shouldAnimate ? { rotate: 360 } : undefined}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-v6-text-muted" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live pulse indicator */}
      {variant === "success" && (
        <motion.div
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-v6-green"
          animate={shouldAnimate ? {
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <motion.div
          initial={shouldAnimate ? { scale: 0, rotate: -45 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={{ ...getSpring(v7Spring.ultraBouncy), delay: index * 0.05 + 0.2 }}
          className={cn(
            "p-2.5 rounded-xl",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </motion.div>

        <div className="flex-1">
          <p className="text-sm font-medium text-v6-text-secondary">{data.label}</p>

          {/* Change indicator */}
          {data.previousValue !== undefined && change !== 0 && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: index * 0.05 + 0.3 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                change > 0 ? "text-v6-green" : "text-v6-status-error"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{change > 0 ? "+" : ""}{Math.round(change)}%</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Value */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...getSpring(v7Spring.default), delay: index * 0.05 + 0.1 }}
        className="mb-3"
      >
        <AnimatedValueV7
          value={data.value}
          format={data.format}
          className="text-3xl font-bold text-v6-text-primary"
        />
      </motion.div>

      {/* Goal progress bar */}
      {data.goal && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-v6-text-muted">Goal Progress</span>
            <span className="font-medium text-v6-text-secondary">
              {Math.round(goalProgress)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-v6-surface-tertiary overflow-hidden">
            <motion.div
              initial={shouldAnimate ? { width: 0 } : undefined}
              animate={shouldAnimate ? { width: `${goalProgress}%` } : undefined}
              transition={getSpring(v7Spring.gentle)}
              className={cn(
                "h-full rounded-full",
                goalProgress >= 100 ? "bg-v6-green" : "bg-v6-primary"
              )}
            />
          </div>
        </div>
      )}

      {/* Goal reached celebration */}
      <AnimatePresence>
        {hasReachedGoal && goalProgress >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={v7Spring.ultraBouncy}
            className="absolute -top-2 -right-2"
          >
            <div className="p-1.5 rounded-full bg-v6-secondary shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// SKELETON LOADER
// ============================================

function KPISkeletonV7() {
  return (
    <div className="rounded-2xl p-5 bg-v6-surface-primary border border-v6-border">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-v6-surface-tertiary" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-20 rounded bg-v6-surface-tertiary" />
            <div className="h-3 w-12 rounded bg-v6-surface-tertiary" />
          </div>
        </div>
        <div className="h-9 w-24 rounded bg-v6-surface-tertiary" />
        <div className="h-2 w-full rounded bg-v6-surface-tertiary" />
      </div>
    </div>
  );
}

// ============================================
// QUICK STATS BAR
// ============================================

interface QuickStatV7Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  pulse?: boolean;
}

function QuickStatV7({ label, value, icon, pulse }: QuickStatV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();

  return (
    <motion.div
      whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-v6-surface-secondary"
    >
      <div className="relative">
        {icon}
        {pulse && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-v6-green"
            animate={shouldAnimate ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className="text-sm font-medium text-v6-text-primary">{value}</span>
      <span className="text-xs text-v6-text-muted">{label}</span>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdminDashboardV7({
  kpis,
  loading = false,
  refreshing = false,
  onRefresh,
  className,
}: AdminDashboardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [goalCelebration, setGoalCelebration] = useState(false);

  const handleGoalReached = useCallback(() => {
    setGoalCelebration(true);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }
    // Reset after animation
    setTimeout(() => setGoalCelebration(false), 3000);
  }, []);

  // Quick stats from KPIs
  const ordersToday = kpis.find(k => k.icon === "orders")?.value || 0;
  const activeDrivers = kpis.find(k => k.icon === "drivers")?.value || 0;
  const exceptionsCount = kpis.find(k => k.icon === "exceptions")?.value || 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with quick stats */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(v7Spring.default)}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={shouldAnimate ? { rotate: [0, 5, -5, 0] } : undefined}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-6 h-6 text-v6-secondary" />
          </motion.div>
          <h2 className="text-xl font-bold text-v6-text-primary">Dashboard Overview</h2>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap items-center gap-2">
          <QuickStatV7
            label="orders today"
            value={ordersToday}
            icon={<Package className="w-4 h-4 text-v6-primary" />}
          />
          <QuickStatV7
            label="active drivers"
            value={activeDrivers}
            icon={<Truck className="w-4 h-4 text-v6-green" />}
            pulse
          />
          {exceptionsCount > 0 && (
            <QuickStatV7
              label="exceptions"
              value={exceptionsCount}
              icon={<AlertTriangle className="w-4 h-4 text-v6-status-error" />}
            />
          )}

          {/* Refresh button */}
          {onRefresh && (
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              onClick={onRefresh}
              disabled={refreshing}
              className={cn(
                "p-2 rounded-lg",
                "bg-v6-surface-secondary hover:bg-v6-surface-tertiary",
                "text-v6-text-secondary hover:text-v6-text-primary",
                "transition-colors",
                "disabled:opacity-50"
              )}
            >
              <motion.div
                animate={refreshing && shouldAnimate ? { rotate: 360 } : undefined}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <KPISkeletonV7 key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={shouldAnimate ? v7StaggerContainer(0.08, 0.1) : undefined}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map((kpi, index) => (
            <KPICardV7
              key={kpi.id}
              data={kpi}
              index={index}
              refreshing={refreshing}
              onGoalReached={handleGoalReached}
            />
          ))}
        </motion.div>
      )}

      {/* Goal celebration overlay */}
      <AnimatePresence>
        {goalCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              variants={v7Celebration.badge}
              initial="initial"
              animate="animate"
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-v6-green text-white shadow-2xl"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Goal Reached!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboardV7;
