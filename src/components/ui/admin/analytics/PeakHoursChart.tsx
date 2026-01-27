/**
 * V2 Sprint 4: Peak Hours Chart Component
 *
 * Animated bar chart showing delivery volume by hour.
 * Highlights peak hours with gradient colors.
 */

"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Clock } from "lucide-react";
import type { PeakHoursData } from "@/types/analytics";

interface PeakHoursChartProps {
  data: PeakHoursData[];
  height?: number;
}

export function PeakHoursChart({ data, height = 250 }: PeakHoursChartProps) {
  // Find max for color intensity
  const maxCount = Math.max(...data.map((d) => d.deliveryCount), 1);

  // V5 Chart colors - mapped to semantic tokens
  const V5_CHART_COLORS = {
    peak: "#D4A017", // --color-interactive-primary
    moderate: "#E5B82A", // --color-interactive-primary-light
    low: "#F5D876", // lighter variant
  };

  const getBarColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity >= 0.8) return V5_CHART_COLORS.peak;
    if (intensity >= 0.5) return V5_CHART_COLORS.moderate;
    return V5_CHART_COLORS.low;
  };

  const chartData = data.map((d) => ({
    name: d.label,
    deliveries: d.deliveryCount,
    avgDuration: d.avgDurationMinutes,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-interactive-primary" />
        <h3 className="text-lg font-semibold text-text-primary">
          Delivery Volume by Hour
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value, name) => {
              if (name === "deliveries") return [value, "Deliveries"];
              if (name === "avgDuration") return [`${value} min`, "Avg Duration"];
              return [value, name];
            }}
          />
          <Bar
            dataKey="deliveries"
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(data[index].deliveryCount)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Peak hours legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-interactive-primary" />
          <span>Peak hours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-interactive-primary-light" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[var(--color-saffron-light,#F5D876)]" />
          <span>Low volume</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact peak hours display for dashboards
 */
export function PeakHoursCompact({ data }: { data: PeakHoursData[] }) {
  // Sort by delivery count and take top 3
  const topHours = [...data]
    .sort((a, b) => b.deliveryCount - a.deliveryCount)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <p className="text-sm font-medium text-text-secondary">Busiest Hours</p>
      <div className="flex gap-2">
        {topHours.map((hour, i) => (
          <motion.div
            key={hour.hour}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 rounded-lg bg-interactive-primary-light p-2 text-center"
          >
            <p className="text-lg font-bold text-interactive-primary">{hour.label}</p>
            <p className="text-xs text-text-secondary">
              {hour.deliveryCount} deliveries
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
