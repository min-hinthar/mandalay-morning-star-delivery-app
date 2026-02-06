"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "./AnimatedValue";
import type { KPIData } from "./types";

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

export function KPICard({ data, index, refreshing, onGoalReached }: KPICardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [hasReachedGoal, setHasReachedGoal] = useState(false);

  const Icon = iconMap[data.icon];
  const variant = data.variant || "default";
  const styles = variantStyles[variant];

  const change = data.previousValue
    ? ((data.value - data.previousValue) / data.previousValue) * 100
    : 0;

  const goalProgress = data.goal ? Math.min((data.value / data.goal) * 100, 100) : 0;

  useEffect(() => {
    if (data.goal && data.value >= data.goal && !hasReachedGoal) {
      setHasReachedGoal(true);
      onGoalReached?.();
    }
  }, [data.value, data.goal, hasReachedGoal, onGoalReached]);

  return (
    <m.div
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
      <AnimatePresence>
        {refreshing && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-3"
          >
            <m.div
              animate={shouldAnimate ? { rotate: 360 } : undefined}
              transition={{ duration: 1, repeat: 5, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-text-muted" />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {variant === "success" && (
        <m.div
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green"
          animate={shouldAnimate ? {
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          } : undefined}
          transition={{ duration: 2, repeat: 5 }}
        />
      )}

      <div className="flex items-start gap-3 mb-4">
        <m.div
          initial={shouldAnimate ? { scale: 0, rotate: -45 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.05 + 0.2 }}
          className={cn("p-2.5 rounded-xl", styles.iconBg)}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </m.div>

        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{data.label}</p>
          {data.previousValue !== undefined && change !== 0 && (
            <m.div
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
            </m.div>
          )}
        </div>
      </div>

      <m.div
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
      </m.div>

      {data.goal && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Goal Progress</span>
            <span className="font-medium text-text-secondary">
              {Math.round(goalProgress)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <m.div
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

      <AnimatePresence>
        {hasReachedGoal && goalProgress >= 100 && (
          <m.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={spring.ultraBouncy}
            className="absolute -top-2 -right-2"
          >
            <div className="p-1.5 rounded-full bg-secondary shadow-lg">
              <Sparkles className="w-4 h-4 text-text-inverse" />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
