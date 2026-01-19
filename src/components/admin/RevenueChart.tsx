"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * V6 Revenue Chart - Pepper Aesthetic
 *
 * Chart colors using V6 primary red palette
 */

// V6 Chart colors - Pepper aesthetic
const V6_CHART_COLORS = {
  primary: "#A41034", // V6 primary red
  secondary: "#EBCD00", // V6 secondary yellow
  grid: "#E8E1DC", // V6 border color
  text: "#6B6560", // V6 text muted
};

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: DailyRevenue[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={V6_CHART_COLORS.grid}
          strokeOpacity={0.6}
        />
        <XAxis
          dataKey="date"
          className="text-xs font-v6-body"
          tick={{ fill: V6_CHART_COLORS.text }}
          tickLine={{ stroke: V6_CHART_COLORS.grid }}
          axisLine={{ stroke: V6_CHART_COLORS.grid }}
        />
        <YAxis
          tickFormatter={formatCurrency}
          className="text-xs font-v6-body"
          tick={{ fill: V6_CHART_COLORS.text }}
          tickLine={{ stroke: V6_CHART_COLORS.grid }}
          axisLine={{ stroke: V6_CHART_COLORS.grid }}
        />
        <Tooltip
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            return [
              name === "revenue" ? formatCurrency(numValue) : numValue,
              name === "revenue" ? "Revenue" : "Orders",
            ];
          }}
          contentStyle={{
            backgroundColor: "#FFFFFF",
            borderColor: V6_CHART_COLORS.grid,
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(164, 16, 52, 0.08)",
            fontFamily: "var(--font-v6-body)",
          }}
          labelStyle={{
            color: "#111111",
            fontWeight: 600,
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={V6_CHART_COLORS.primary}
          strokeWidth={3}
          dot={{ fill: V6_CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
          activeDot={{
            r: 7,
            fill: V6_CHART_COLORS.primary,
            stroke: "#FFFFFF",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
