/**
 * V2 Sprint 4: Delivery Success Chart Component
 *
 * Stacked bar chart showing delivered vs skipped orders.
 * Area chart variant for success rate trends.
 */

"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Package } from "lucide-react";
import type { DeliveryMetrics } from "@/types/analytics";

// V5 Chart colors - mapped to semantic tokens
const V5_CHART_COLORS = {
  success: "#2E8B57", // --color-accent-secondary / status-success
  error: "#DC2626", // --color-status-error
};

interface DeliverySuccessChartProps {
  data: DeliveryMetrics[];
  height?: number;
  type?: "area" | "stacked";
}

export function DeliverySuccessChart({
  data,
  height = 300,
  type = "area",
}: DeliverySuccessChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    delivered: d.deliveredCount,
    skipped: d.skippedCount,
    successRate: d.deliverySuccessRate,
    total: d.totalStops,
  }));

  if (type === "stacked") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-surface-primary p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-status-success" />
          <h3 className="text-lg font-semibold text-text-primary">
            Delivery Outcomes
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius-md)",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-text-secondary capitalize">
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="delivered"
              stackId="a"
              fill={V5_CHART_COLORS.success}
              radius={[0, 0, 0, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="skipped"
              stackId="a"
              fill={V5_CHART_COLORS.error}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-status-success" />
        <h3 className="text-lg font-semibold text-text-primary">
          Success Rate Trend
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={V5_CHART_COLORS.success} stopOpacity={0.3} />
              <stop offset="95%" stopColor={V5_CHART_COLORS.success} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius-md)",
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Success Rate"]}
          />
          <Area
            type="monotone"
            dataKey="successRate"
            stroke={V5_CHART_COLORS.success}
            strokeWidth={2}
            fill="url(#successGradient)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * ETA Accuracy gauge chart
 */
export function ETAAccuracyGauge({
  value,
  previousValue,
}: {
  value: number;
  previousValue?: number;
}) {
  const percentage = Math.round(value);
  const trend = previousValue !== undefined ? value - previousValue : 0;

  // Calculate the stroke-dashoffset for the arc
  const circumference = 2 * Math.PI * 80; // radius = 80
  const halfCircumference = circumference / 2;
  const offset = halfCircumference - (percentage / 100) * halfCircumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        ETA Accuracy
      </h3>

      <div className="relative">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={V5_CHART_COLORS.success}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            initial={{ strokeDashoffset: halfCircumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-text-primary"
          >
            {percentage}%
          </motion.span>
          {trend !== 0 && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={`text-sm font-medium ${
                trend > 0 ? "text-status-success" : "text-status-error"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </motion.span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-text-secondary">
        Deliveries within estimated time
      </p>
    </motion.div>
  );
}
