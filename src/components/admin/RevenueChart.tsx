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
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          tickFormatter={formatCurrency}
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
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
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#D4A017"
          strokeWidth={2}
          dot={{ fill: "#D4A017", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#D4A017" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
