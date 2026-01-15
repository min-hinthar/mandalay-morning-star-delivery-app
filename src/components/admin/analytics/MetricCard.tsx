/**
 * V2 Sprint 4: Metric Card Component
 *
 * Premium KPI card with trend indicators and spring animations.
 * iOS-like hover states with haptic feedback visuals.
 */

"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedCounter } from "./AnimatedCounter";
import type { MetricCardProps } from "@/types/analytics";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const colorStyles = {
  saffron: {
    icon: "bg-saffron/10 text-saffron",
    trend: "text-saffron",
    accent: "border-l-saffron",
  },
  jade: {
    icon: "bg-jade/10 text-jade",
    trend: "text-jade",
    accent: "border-l-jade",
  },
  curry: {
    icon: "bg-curry/10 text-curry",
    trend: "text-curry",
    accent: "border-l-curry",
  },
  charcoal: {
    icon: "bg-charcoal/10 text-charcoal-600",
    trend: "text-charcoal-600",
    accent: "border-l-charcoal",
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
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-white p-6 shadow-warm-sm",
        "border-l-4 transition-shadow",
        styles.accent
      )}
    >
      {/* Loading overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
        </motion.div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-charcoal-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-charcoal-900">
              {formatValue(value)}
            </span>
          </div>

          {/* Trend indicator */}
          {calculatedTrend && calculatedTrendValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 flex items-center gap-1"
            >
              {calculatedTrend === "up" && (
                <>
                  <TrendingUp className="h-4 w-4 text-jade" />
                  <span className="text-sm font-medium text-jade">
                    +{calculatedTrendValue}%
                  </span>
                </>
              )}
              {calculatedTrend === "down" && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {calculatedTrendValue}%
                  </span>
                </>
              )}
              {calculatedTrend === "stable" && (
                <>
                  <Minus className="h-4 w-4 text-charcoal-400" />
                  <span className="text-sm font-medium text-charcoal-400">
                    No change
                  </span>
                </>
              )}
              <span className="text-xs text-charcoal-400">vs last period</span>
            </motion.div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={cn("rounded-xl p-3", styles.icon)}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-saffron/5 to-transparent" />
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
