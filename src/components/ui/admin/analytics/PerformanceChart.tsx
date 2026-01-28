/**
 * V2 Sprint 4: Performance Chart Component
 *
 * Animated line/area/bar chart for time series data.
 * Uses Recharts with Framer Motion for entry animations.
 */

"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PerformanceChartProps } from "@/types/analytics";

// Chart colors - using CSS custom properties
const CHART_COLORS = {
  primary: "var(--color-secondary)", // Was #D4A017
  secondary: "var(--color-accent-green)", // Was #2E8B57
  tertiary: "var(--color-accent-orange)", // Was #8B4513 (closest match)
  text: "var(--color-text-primary)", // Was #1A1A1A
};

export function PerformanceChart({
  data,
  title,
  color = CHART_COLORS.primary,
  type = "line",
  height = 300,
  showGrid = true,
  showTooltip = true,
}: PerformanceChartProps) {
  const chartData = data.map((point) => ({
    name: point.label ?? point.date,
    value: point.value,
  }));

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const axisProps = {
      className: "text-xs",
      tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
    };

    const tooltipProps = showTooltip
      ? {
          tooltip: (
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius-md)",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
          ),
        }
      : {};

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && tooltipProps.tooltip}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && tooltipProps.tooltip}
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && tooltipProps.tooltip}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <h3 className="mb-4 text-lg font-semibold text-text-primary">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * Dual-axis chart for comparing two metrics
 */
export function DualAxisChart({
  data,
  title,
  leftLabel,
  rightLabel,
  leftColor = CHART_COLORS.primary,
  rightColor = CHART_COLORS.secondary,
  height = 300,
}: {
  data: Array<{ name: string; left: number; right: number }>;
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
  height?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <h3 className="mb-4 text-lg font-semibold text-text-primary">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke={leftColor}
            tick={{ fill: leftColor, fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={rightColor}
            tick={{ fill: rightColor, fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius-md)",
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="left"
            name={leftLabel}
            stroke={leftColor}
            strokeWidth={2}
            dot={{ fill: leftColor }}
            animationDuration={1500}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="right"
            name={rightLabel}
            stroke={rightColor}
            strokeWidth={2}
            dot={{ fill: rightColor }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
