/**
 * V2 Sprint 4: Delivery Metrics Dashboard Client Component
 *
 * Client component with animated KPIs, charts, and exception tracking.
 * Fetches data from API and renders with Framer Motion animations.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MetricCard,
  MetricCardGrid,
  DeliverySuccessChart,
  ETAAccuracyGauge,
  PeakHoursChart,
  ExceptionBreakdown,
  RecentExceptionsList,
  LeaderboardCompact,
} from "@/components/ui/admin/analytics";
import type {
  DeliveryDashboardResponse,
  MetricsPeriod,
} from "@/types/analytics";
import { formatPrice } from "@/lib/utils/currency";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

export function DeliveryMetricsDashboard() {
  const [data, setData] = useState<DeliveryDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricsPeriod>("week");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/analytics/delivery?period=${period}`);

      if (!res.ok) {
        throw new Error("Failed to fetch delivery metrics");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-display text-charcoal">
            Delivery Metrics
          </h1>
          <p className="text-charcoal-500">
            Track delivery performance, success rates, and operational metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border bg-white p-1">
            {(["week", "month", "quarter"] as MetricsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-saffron text-white"
                    : "text-charcoal-500 hover:text-charcoal-900"
                }`}
              >
                {p === "week" ? "7 Days" : p === "month" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </motion.div>

      {/* Date range indicator */}
      {summary && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-charcoal-500">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(summary.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(summary.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </motion.div>
      )}

      {/* Summary Cards */}
      <MetricCardGrid>
        <MetricCard
          title="Total Orders"
          value={summary?.totalOrders ?? 0}
          icon={<Package className="h-5 w-5" />}
          trend={
            summary?.ordersTrend !== undefined
              ? summary.ordersTrend > 0
                ? "up"
                : summary.ordersTrend < 0
                  ? "down"
                  : "stable"
              : undefined
          }
          trendValue={summary?.ordersTrend}
          color="saffron"
          loading={loading}
        />
        <MetricCard
          title="Total Revenue"
          value={summary?.totalRevenueCents ?? 0}
          format="currency"
          icon={<DollarSign className="h-5 w-5" />}
          trend={
            summary?.revenueTrend !== undefined
              ? summary.revenueTrend > 0
                ? "up"
                : summary.revenueTrend < 0
                  ? "down"
                  : "stable"
              : undefined
          }
          trendValue={summary?.revenueTrend}
          color="jade"
          loading={loading}
        />
        <MetricCard
          title="Success Rate"
          value={summary?.deliverySuccessRate ?? 0}
          format="percent"
          icon={<CheckCircle className="h-5 w-5" />}
          color="jade"
          loading={loading}
        />
        <MetricCard
          title="Avg Order Value"
          value={summary?.avgOrderValueCents ?? 0}
          format="currency"
          icon={<Clock className="h-5 w-5" />}
          color="curry"
          loading={loading}
        />
      </MetricCardGrid>

      {/* Charts Row 1 */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {data && (
          <>
            <DeliverySuccessChart data={data.dailyMetrics} type="area" />
            <DeliverySuccessChart data={data.dailyMetrics} type="stacked" />
          </>
        )}
        {loading && !data && (
          <>
            <div className="h-80 animate-pulse rounded-xl bg-charcoal-100" />
            <div className="h-80 animate-pulse rounded-xl bg-charcoal-100" />
          </>
        )}
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        {/* ETA Accuracy */}
        {data && (
          <ETAAccuracyGauge value={data.summary.etaAccuracyRate} />
        )}
        {loading && !data && (
          <div className="h-72 animate-pulse rounded-xl bg-charcoal-100" />
        )}

        {/* Peak Hours */}
        {data && data.peakHours.length > 0 && (
          <PeakHoursChart data={data.peakHours} />
        )}
        {loading && !data && (
          <div className="h-72 animate-pulse rounded-xl bg-charcoal-100" />
        )}

        {/* Top Drivers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-6 shadow-warm-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-charcoal-900">
            Top Performers
          </h3>
          {data && <LeaderboardCompact entries={data.topDrivers} limit={5} />}
          {loading && !data && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-charcoal-100"
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Exceptions Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {data && (
          <>
            <ExceptionBreakdown
              byType={data.summary.exceptionsByType}
              total={data.summary.totalExceptions}
            />
            <RecentExceptionsList exceptions={data.recentExceptions} />
          </>
        )}
        {loading && !data && (
          <>
            <div className="h-80 animate-pulse rounded-xl bg-charcoal-100" />
            <div className="h-80 animate-pulse rounded-xl bg-charcoal-100" />
          </>
        )}
      </motion.div>

      {/* Quick Stats Footer */}
      {summary && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl bg-gradient-to-r from-saffron/10 to-curry/10 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <p className="text-sm text-charcoal-500">Avg Daily Orders</p>
              <p className="text-2xl font-bold text-charcoal-900">
                {summary.avgDailyOrders.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-charcoal-500">Avg Daily Revenue</p>
              <p className="text-2xl font-bold text-charcoal-900">
                {formatPrice(summary.avgDailyRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-charcoal-500">Total Deliveries</p>
              <p className="text-2xl font-bold text-jade">
                {summary.totalDeliveries}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-charcoal-500">Total Exceptions</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.totalExceptions}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
