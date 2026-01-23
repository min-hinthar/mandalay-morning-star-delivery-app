"use client";

/**
 *  Animated Charts - Motion-First Data Visualization
 *
 * Sprint 8: Admin Dashboard
 * Features: Recharts with enter animations, animated axes,
 * interactive tooltips, gradient fills, responsive design
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  secondaryValue?: number;
}

export interface ChartsProps {
  /** Chart data */
  data: ChartDataPoint[];
  /** Chart title */
  title: string;
  /** Chart type */
  type?: "line" | "area" | "bar";
  /** Primary color */
  color?: "primary" | "secondary" | "green" | "error";
  /** Show secondary line */
  showSecondary?: boolean;
  /** Value format */
  format?: "number" | "currency" | "percentage";
  /** Chart height */
  height?: number;
  /** Show trend indicator */
  showTrend?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
//  CHART COLORS
// ============================================

const CHART_COLORS = {
  primary: {
    main: "var(--color-primary)",
    light: "rgba(164, 16, 52, 0.1)", // Keep rgba for opacity
    gradient: ["rgba(164, 16, 52, 0.4)", "rgba(164, 16, 52, 0.05)"],
  },
  secondary: {
    main: "var(--color-secondary)",
    light: "rgba(235, 205, 0, 0.1)",
    gradient: ["rgba(235, 205, 0, 0.4)", "rgba(235, 205, 0, 0.05)"],
  },
  green: {
    main: "var(--color-accent-green)",
    light: "rgba(82, 165, 46, 0.1)",
    gradient: ["rgba(82, 165, 46, 0.4)", "rgba(82, 165, 46, 0.05)"],
  },
  error: {
    main: "var(--color-status-error)",
    light: "rgba(220, 38, 38, 0.1)",
    gradient: ["rgba(220, 38, 38, 0.4)", "rgba(220, 38, 38, 0.05)"],
  },
  grid: "var(--color-border-default)",
  text: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
};

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  format: "number" | "currency" | "percentage";
}

function CustomTooltip({ active, payload, label, format }: CustomTooltipProps) {
  const { shouldAnimate } = useAnimationPreference();

  if (!active || !payload?.length) return null;

  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value / 100);
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat("en-US").format(value);
    }
  };

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 5 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={spring.snappy}
      className={cn(
        "px-4 py-3 rounded-xl",
        "bg-white/95 backdrop-blur-sm",
        "border border-border",
        "shadow-lg"
      )}
    >
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-lg font-bold text-text-primary">
          {formatValue(entry.value)}
        </p>
      ))}
    </motion.div>
  );
}

// ============================================
// CUSTOM ACTIVE DOT
// ============================================

function CustomActiveDot(props: { cx: number; cy: number; fill: string }) {
  const { cx, cy, fill } = props;
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={8}
      fill={fill}
      stroke="white"
      strokeWidth={3}
      initial={shouldAnimate ? { scale: 0 } : undefined}
      animate={shouldAnimate ? { scale: 1 } : undefined}
      transition={spring.ultraBouncy}
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
    />
  );
}

// ============================================
// CHART HEADER
// ============================================

interface ChartHeaderProps {
  title: string;
  type: "line" | "area" | "bar";
  trend?: number;
  showTrend: boolean;
  onTypeChange?: (type: "line" | "area" | "bar") => void;
}

function ChartHeader({ title, type, trend, showTrend, onTypeChange }: ChartHeaderProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          animate={shouldAnimate ? { rotate: [0, 5, -5, 0] } : undefined}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <Activity className="w-5 h-5 text-primary" />
        </motion.div>
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>

        {/* Trend indicator */}
        {showTrend && trend !== undefined && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              trend >= 0
                ? "bg-green/10 text-green"
                : "bg-status-error/10 text-status-error"
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </motion.div>
        )}
      </div>

      {/* Chart type toggle */}
      {onTypeChange && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
          {(["line", "area", "bar"] as const).map((t) => (
            <motion.button
              key={t}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              onClick={() => onTypeChange(t)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                type === t
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {t === "line" && <LineChartIcon className="w-4 h-4" />}
              {t === "area" && <Activity className="w-4 h-4" />}
              {t === "bar" && <BarChart3 className="w-4 h-4" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// CHART SKELETON
// ============================================

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full w-full rounded-xl bg-surface-tertiary relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-8">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-8 bg-surface-primary rounded-t"
              style={{ height: `${30 + Math.random() * 50}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Charts({
  data,
  title,
  type: initialType = "area",
  color = "primary",
  showSecondary = false,
  format = "number",
  height = 300,
  showTrend = true,
  loading = false,
  className,
}: ChartsProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [chartType, setChartType] = useState(initialType);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return first === 0 ? 0 : ((last - first) / first) * 100;
  }, [data]);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Format value for axis
  const formatAxisValue = useCallback((value: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
          maximumFractionDigits: 0,
        }).format(value / 100);
      case "percentage":
        return `${value}%`;
      default:
        return new Intl.NumberFormat("en-US", {
          notation: "compact",
        }).format(value);
    }
  }, [format]);

  // Average value for reference line
  const avgValue = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.value, 0) / data.length;
  }, [data]);

  const colorConfig = CHART_COLORS[color];

  if (loading) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        className={cn("p-5 rounded-2xl bg-surface-primary border border-border", className)}
      >
        <ChartHeader
          title={title}
          type={chartType}
          showTrend={false}
        />
        <ChartSkeleton height={height} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "p-5 rounded-2xl",
        "bg-surface-primary border border-border",
        "shadow-sm",
        className
      )}
    >
      <ChartHeader
        title={title}
        type={chartType}
        trend={trend}
        showTrend={showTrend}
        onTypeChange={setChartType}
      />

      <motion.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : undefined}
        animate={isVisible && shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={getSpring(spring.gentle)}
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <YAxis
                tickFormatter={formatAxisValue}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                content={<CustomTooltip format={format} />}
                cursor={{ fill: colorConfig.light }}
              />
              <ReferenceLine
                y={avgValue}
                stroke={CHART_COLORS.textMuted}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Bar
                dataKey="value"
                fill={colorConfig.main}
                radius={[6, 6, 0, 0]}
                animationBegin={shouldAnimate ? 0 : undefined}
                animationDuration={shouldAnimate ? 1200 : 0}
                animationEasing="ease-out"
              />
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorConfig.gradient[0]} />
                  <stop offset="100%" stopColor={colorConfig.gradient[1]} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <YAxis
                tickFormatter={formatAxisValue}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip format={format} />} />
              <ReferenceLine
                y={avgValue}
                stroke={CHART_COLORS.textMuted}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colorConfig.main}
                strokeWidth={3}
                fill={`url(#gradient-${color})`}
                activeDot={<CustomActiveDot cx={0} cy={0} fill={colorConfig.main} />}
                animationBegin={shouldAnimate ? 0 : undefined}
                animationDuration={shouldAnimate ? 1500 : 0}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <YAxis
                tickFormatter={formatAxisValue}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip format={format} />} />
              <ReferenceLine
                y={avgValue}
                stroke={CHART_COLORS.textMuted}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colorConfig.main}
                strokeWidth={3}
                dot={{ fill: colorConfig.main, strokeWidth: 2, r: 4 }}
                activeDot={<CustomActiveDot cx={0} cy={0} fill={colorConfig.main} />}
                animationBegin={shouldAnimate ? 0 : undefined}
                animationDuration={shouldAnimate ? 1500 : 0}
                animationEasing="ease-out"
              />
              {showSecondary && (
                <Line
                  type="monotone"
                  dataKey="secondaryValue"
                  stroke={CHART_COLORS.secondary.main}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  animationBegin={shouldAnimate ? 300 : undefined}
                  animationDuration={shouldAnimate ? 1200 : 0}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MINI SPARKLINE CHART
// ============================================

export interface SparklineProps {
  data: number[];
  color?: "primary" | "secondary" | "green" | "error";
  width?: number;
  height?: number;
  showDot?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  color = "primary",
  width = 80,
  height = 24,
  showDot = true,
  className,
}: SparklineProps) {
  const { shouldAnimate } = useAnimationPreference();
  const colorConfig = CHART_COLORS[color];

  // Normalize data to chart
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scaleX: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scaleX: 1 } : undefined}
      transition={spring.gentle}
      className={cn("inline-block", className)}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={colorConfig.main}
            strokeWidth={2}
            dot={false}
            animationDuration={shouldAnimate ? 800 : 0}
          />
          {showDot && data.length > 0 && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="transparent"
              dot={(props) => {
                if (props.index === data.length - 1) {
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={colorConfig.main}
                    />
                  );
                }
                return <></>;
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default Charts;
