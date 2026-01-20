/**
 * V6 Metric Card Component - Pepper Aesthetic
 *
 * Premium KPI card with trend indicators and spring animations.
 * V6 colors and typography with playful interactions.
 */

"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedCounter } from "./AnimatedCounter";
import { v6Spring } from "@/lib/motion";
import type { MetricCardProps } from "@/types/analytics";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 28,
    },
  },
};

// V6 Color styles - Pepper aesthetic
const colorStyles = {
  saffron: {
    icon: "bg-v6-primary-light text-v6-primary",
    trend: "text-v6-primary",
    accent: "border-l-v6-primary",
  },
  jade: {
    icon: "bg-v6-green/10 text-v6-green",
    trend: "text-v6-green",
    accent: "border-l-v6-green",
  },
  curry: {
    icon: "bg-v6-secondary-light text-v6-secondary-hover",
    trend: "text-v6-secondary-hover",
    accent: "border-l-v6-secondary",
  },
  charcoal: {
    icon: "bg-v6-surface-tertiary text-v6-text-secondary",
    trend: "text-v6-text-secondary",
    accent: "border-l-v6-text-primary",
  },
};

export function MetricCard({
  title,
  value,
  previousValue,
  format = "number",
  icon,
  trend,
  trendValue,
  loading = false,
  color = "saffron",
}: MetricCardProps) {
  const styles = colorStyles[color];

  // Calculate trend if not provided but previousValue is
  const calculatedTrend =
    trend ??
    (previousValue !== undefined && typeof value === "number"
      ? value > previousValue
        ? "up"
        : value < previousValue
          ? "down"
          : "stable"
      : undefined);

  const calculatedTrendValue =
    trendValue ??
    (previousValue !== undefined && typeof value === "number" && previousValue > 0
      ? Math.round(((value - previousValue) / previousValue) * 100)
      : undefined);

  const formatValue = (val: number | string): React.ReactNode => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return <AnimatedCounter value={val} format="currency" />;
      case "percent":
        return <AnimatedCounter value={val} format="percent" decimals={1} />;
      case "duration":
        return (
          <>
            <AnimatedCounter value={val} /> <span className="text-lg">min</span>
          </>
        );
      default:
        return <AnimatedCounter value={val} />;
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      transition={v6Spring}
      className={cn(
        "relative overflow-hidden rounded-v6-card-sm bg-v6-surface-primary p-6 shadow-v6-sm",
        "border-l-4 transition-shadow duration-v6-fast",
        "hover:shadow-v6-md",
        styles.accent
      )}
    >
      {/* V6 Loading overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-v6-primary border-t-transparent" />
        </motion.div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-v6-body font-medium text-v6-text-secondary">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-v6-display font-bold text-v6-text-primary">
              {formatValue(value)}
            </span>
          </div>

          {/* V6 Trend indicator */}
          {calculatedTrend && calculatedTrendValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 flex items-center gap-1"
            >
              {calculatedTrend === "up" && (
                <>
                  <TrendingUp className="h-4 w-4 text-v6-green" />
                  <span className="text-sm font-v6-body font-medium text-v6-green">
                    +{calculatedTrendValue}%
                  </span>
                </>
              )}
              {calculatedTrend === "down" && (
                <>
                  <TrendingDown className="h-4 w-4 text-v6-status-error" />
                  <span className="text-sm font-v6-body font-medium text-v6-status-error">
                    {calculatedTrendValue}%
                  </span>
                </>
              )}
              {calculatedTrend === "stable" && (
                <>
                  <Minus className="h-4 w-4 text-v6-text-muted" />
                  <span className="text-sm font-v6-body font-medium text-v6-text-muted">
                    No change
                  </span>
                </>
              )}
              <span className="text-xs font-v6-body text-v6-text-muted">vs last period</span>
            </motion.div>
          )}
        </div>

        {/* V6 Icon */}
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={cn("rounded-v6-card-sm p-3", styles.icon)}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* V6 Subtle gradient overlay */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-v6-primary/5 to-transparent" />
    </motion.div>
  );
}

/**
 * Grid container for metric cards with staggered animation
 */
export function MetricCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </motion.div>
  );
}
