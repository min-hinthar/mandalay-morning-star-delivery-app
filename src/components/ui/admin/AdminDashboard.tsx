"use client";

/**
 *  Admin Dashboard - Motion-First Playful Design
 *
 * Sprint 8: Admin Dashboard
 * Features: Animated KPIs with pulse indicators, real-time updates,
 * staggered card entrance, spring-based value animations
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  spring,
  staggerContainer,
  staggerItem,
  celebration,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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

export interface AdminDashboardProps {
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

interface AnimatedValueProps {
  value: number;
  format: "number" | "currency" | "percentage" | "duration";
  className?: string;
}

function AnimatedValue({ value, format, className }: AnimatedValueProps) {
  const { shouldAnimate } = useAnimationPreference();

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
// KPI CARD 
// ============================================

interface KPICardProps {
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
    bg: "bg-surface-primary",
    border: "border-border",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    bg: "bg-green/5",
    border: "border-green/20",
    iconBg: "bg-green/10",
    iconColor: "text-green",
  },
  warning: {
    bg: "bg-secondary/5",
    border: "border-secondary/20",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  danger: {
    bg: "bg-status-error/5",
    border: "border-status-error/20",
    iconBg: "bg-status-error/10",
    iconColor: "text-status-error",
  },
};

function KPICard({ data, index, refreshing, onGoalReached }: KPICardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
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
      variants={staggerItem}
      whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(spring.snappy)}
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
              <RefreshCw className="w-4 h-4 text-text-muted" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live pulse indicator */}
      {variant === "success" && (
        <motion.div
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green"
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
          transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.05 + 0.2 }}
          className={cn(
            "p-2.5 rounded-xl",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </motion.div>

        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{data.label}</p>

          {/* Change indicator */}
          {data.previousValue !== undefined && change !== 0 && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: index * 0.05 + 0.3 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                change > 0 ? "text-green" : "text-status-error"
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
        transition={{ ...getSpring(spring.default), delay: index * 0.05 + 0.1 }}
        className="mb-3"
      >
        <AnimatedValue
          value={data.value}
          format={data.format}
          className="text-3xl font-bold text-text-primary"
        />
      </motion.div>

      {/* Goal progress bar */}
      {data.goal && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Goal Progress</span>
            <span className="font-medium text-text-secondary">
              {Math.round(goalProgress)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <motion.div
              initial={shouldAnimate ? { width: 0 } : undefined}
              animate={shouldAnimate ? { width: `${goalProgress}%` } : undefined}
              transition={getSpring(spring.gentle)}
              className={cn(
                "h-full rounded-full",
                goalProgress >= 100 ? "bg-green" : "bg-primary"
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
            transition={spring.ultraBouncy}
            className="absolute -top-2 -right-2"
          >
            <div className="p-1.5 rounded-full bg-secondary shadow-lg">
              <Sparkles className="w-4 h-4 text-text-inverse" />
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

function KPISkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-surface-primary border border-border">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-tertiary" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-20 rounded bg-surface-tertiary" />
            <div className="h-3 w-12 rounded bg-surface-tertiary" />
          </div>
        </div>
        <div className="h-9 w-24 rounded bg-surface-tertiary" />
        <div className="h-2 w-full rounded bg-surface-tertiary" />
      </div>
    </div>
  );
}

// ============================================
// QUICK STATS BAR
// ============================================

interface QuickStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  pulse?: boolean;
}

function QuickStat({ label, value, icon, pulse }: QuickStatProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary"
    >
      <div className="relative">
        {icon}
        {pulse && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green"
            animate={shouldAnimate ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdminDashboard({
  kpis,
  loading = false,
  refreshing = false,
  onRefresh,
  className,
}: AdminDashboardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [goalCelebration, setGoalCelebration] = useState(false);
  const goalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup goal timeout on unmount
  useEffect(() => {
    return () => {
      if (goalTimeoutRef.current) clearTimeout(goalTimeoutRef.current);
    };
  }, []);

  const handleGoalReached = useCallback(() => {
    setGoalCelebration(true);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }
    // Reset after animation
    if (goalTimeoutRef.current) clearTimeout(goalTimeoutRef.current);
    goalTimeoutRef.current = setTimeout(() => setGoalCelebration(false), 3000);
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
        transition={getSpring(spring.default)}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={shouldAnimate ? { rotate: [0, 5, -5, 0] } : undefined}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-6 h-6 text-secondary" />
          </motion.div>
          <h2 className="text-xl font-bold text-text-primary">Dashboard Overview</h2>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap items-center gap-2">
          <QuickStat
            label="orders today"
            value={ordersToday}
            icon={<Package className="w-4 h-4 text-primary" />}
          />
          <QuickStat
            label="active drivers"
            value={activeDrivers}
            icon={<Truck className="w-4 h-4 text-green" />}
            pulse
          />
          {exceptionsCount > 0 && (
            <QuickStat
              label="exceptions"
              value={exceptionsCount}
              icon={<AlertTriangle className="w-4 h-4 text-status-error" />}
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
                "bg-surface-secondary hover:bg-surface-tertiary",
                "text-text-secondary hover:text-text-primary",
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
            <KPISkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map((kpi, index) => (
            <KPICard
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
            className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
          >
            <motion.div
              variants={celebration.badge}
              initial="initial"
              animate="animate"
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-green text-text-inverse shadow-2xl"
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

export default AdminDashboard;
