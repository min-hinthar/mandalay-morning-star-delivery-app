/**
 * V2 Sprint 4: Exception Breakdown Component
 *
 * Pie chart and list view for delivery exceptions.
 * Shows breakdown by exception type with animated transitions.
 */

"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  AlertTriangle,
  Home,
  MapPin,
  Lock,
  XCircle,
  Package,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DeliveryExceptionType } from "@/types/driver";
import type { RecentException } from "@/types/analytics";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ExceptionBreakdownProps {
  byType: Record<DeliveryExceptionType, number>;
  total: number;
  height?: number;
}

// V5 Chart colors - mapped to semantic tokens
const V5_CHART_COLORS = {
  warning: "#D97706", // --color-status-warning
  error: "#DC2626", // --color-status-error
  tertiary: "#8B4513", // --color-accent-tertiary
  secondary: "#2E8B57", // --color-accent-secondary
  muted: "#6B7280", // --color-text-secondary
};

const exceptionConfig: Record<
  DeliveryExceptionType,
  { label: string; color: string; icon: LucideIcon }
> = {
  customer_not_home: {
    label: "Customer Not Home",
    color: V5_CHART_COLORS.warning,
    icon: Home,
  },
  wrong_address: {
    label: "Wrong Address",
    color: V5_CHART_COLORS.error,
    icon: MapPin,
  },
  access_issue: {
    label: "Access Issue",
    color: V5_CHART_COLORS.tertiary,
    icon: Lock,
  },
  refused_delivery: {
    label: "Refused Delivery",
    color: V5_CHART_COLORS.error,
    icon: XCircle,
  },
  damaged_order: {
    label: "Damaged Order",
    color: V5_CHART_COLORS.error,
    icon: Package,
  },
  other: {
    label: "Other",
    color: V5_CHART_COLORS.muted,
    icon: HelpCircle,
  },
};

export function ExceptionBreakdown({
  byType,
  total,
  height = 250,
}: ExceptionBreakdownProps) {
  const chartData = Object.entries(byType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      name: exceptionConfig[type as DeliveryExceptionType].label,
      value: count,
      color: exceptionConfig[type as DeliveryExceptionType].color,
    }));

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl bg-surface-primary p-6 shadow-sm"
        style={{ minHeight: height }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="rounded-full bg-status-success-bg p-4"
        >
          <AlertTriangle className="h-8 w-8 text-status-success" />
        </motion.div>
        <p className="mt-4 font-medium text-text-primary">No Exceptions</p>
        <p className="text-sm text-text-secondary">All deliveries completed successfully</p>
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
        <AlertTriangle className="h-5 w-5 text-status-warning" />
        <h3 className="text-lg font-semibold text-text-primary">
          Exception Breakdown
        </h3>
        <span className="ml-auto rounded-full bg-status-warning-bg px-2 py-0.5 text-xs font-medium text-status-warning">
          {total} total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius-md)",
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-text-secondary">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * Recent exceptions list
 */
export function RecentExceptionsList({
  exceptions,
  limit = 5,
}: {
  exceptions: RecentException[];
  limit?: number;
}) {
  const displayExceptions = exceptions.slice(0, limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-primary p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-status-warning" />
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Exceptions
        </h3>
      </div>

      {displayExceptions.length === 0 ? (
        <p className="text-sm text-text-secondary">No recent exceptions</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="space-y-3"
        >
          {displayExceptions.map((exception) => (
            <ExceptionRow key={exception.id} exception={exception} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function ExceptionRow({ exception }: { exception: RecentException }) {
  const config = exceptionConfig[exception.type];
  const Icon = config.icon;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      className="flex items-start gap-3 rounded-lg border border-border-v5 p-3"
    >
      <div
        className="rounded-lg p-2"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text-primary">{config.label}</p>
          {exception.resolved && (
            <span className="rounded-full bg-status-success-bg px-1.5 py-0.5 text-xs font-medium text-status-success">
              Resolved
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Order #{exception.orderNumber} • {exception.driverName ?? "Unknown"}
        </p>
        {exception.description && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {exception.description}
          </p>
        )}
      </div>

      <p className="shrink-0 text-xs text-text-muted">
        {formatDistanceToNow(parseISO(exception.createdAt), { addSuffix: true })}
      </p>
    </motion.div>
  );
}

/**
 * Compact exception summary for dashboard cards
 */
export function ExceptionSummaryCompact({
  byType,
  total,
}: {
  byType: Record<DeliveryExceptionType, number>;
  total: number;
}) {
  const topExceptions = Object.entries(byType)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-2">
      {total === 0 ? (
        <div className="flex items-center gap-2 text-status-success">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">No exceptions</span>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-text-secondary">
            Top Issues ({total} total)
          </p>
          {topExceptions.map(([type, count]) => {
            const config = exceptionConfig[type as DeliveryExceptionType];
            return (
              <div
                key={type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-secondary">{config.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    "bg-status-warning-bg text-status-warning"
                  )}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
