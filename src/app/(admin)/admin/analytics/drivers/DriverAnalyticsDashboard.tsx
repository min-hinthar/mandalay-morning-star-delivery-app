/**
 * V2 Sprint 4: Driver Analytics Dashboard Client Component
 *
 * Client component with animated metrics, leaderboard, and charts.
 * Fetches data from API and renders with Framer Motion animations.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Clock,
  Star,
  TrendingUp,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MetricCard,
  MetricCardGrid,
  DriverLeaderboard,
  PerformanceChart,
  RatingDistributionBars,
} from "@/components/admin/analytics";
import type {
  DriverAnalyticsListResponse,
  DriverStats,
  MetricsPeriod,
} from "@/types/analytics";

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

export function DriverAnalyticsDashboard() {
  const [data, setData] = useState<DriverAnalyticsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricsPeriod>("month");
  const [selectedDriver, setSelectedDriver] = useState<DriverStats | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/analytics/drivers?period=${period}&includeInactive=false`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch driver analytics");
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

  const handleDriverClick = (driverId: string) => {
    const driver = data?.drivers.find((d) => d.driverId === driverId);
    setSelectedDriver(driver ?? null);
  };

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
            Driver Analytics
          </h1>
          <p className="text-charcoal-500">
            Monitor driver performance, ratings, and delivery metrics
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

      {/* Team Summary Cards */}
      <MetricCardGrid>
        <MetricCard
          title="Active Drivers"
          value={data?.summary.totalActiveDrivers ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="saffron"
          loading={loading}
        />
        <MetricCard
          title="Team Rating"
          value={data?.summary.avgTeamRating?.toFixed(1) ?? "N/A"}
          icon={<Star className="h-5 w-5" />}
          color="saffron"
          loading={loading}
        />
        <MetricCard
          title="On-Time Rate"
          value={data?.summary.avgOnTimeRate ?? 0}
          format="percent"
          icon={<Clock className="h-5 w-5" />}
          color="jade"
          loading={loading}
        />
        <MetricCard
          title="Deliveries This Week"
          value={data?.summary.totalDeliveriesThisWeek ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
          color="curry"
          loading={loading}
        />
      </MetricCardGrid>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Driver List */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <DriverLeaderboard
            entries={data?.leaderboard ?? []}
            onDriverClick={handleDriverClick}
            loading={loading}
            showMedals
          />
        </motion.div>

        {/* Selected Driver Details or Team Stats */}
        <motion.div variants={itemVariants} className="space-y-6">
          {selectedDriver ? (
            <DriverDetailCard
              driver={selectedDriver}
              onClose={() => setSelectedDriver(null)}
            />
          ) : (
            <TeamStatsCard
              totalDeliveriesMonth={data?.summary.totalDeliveriesThisMonth ?? 0}
              totalDeliveriesWeek={data?.summary.totalDeliveriesThisWeek ?? 0}
              activeCount={data?.summary.totalActiveDrivers ?? 0}
              inactiveCount={data?.summary.totalInactiveDrivers ?? 0}
            />
          )}
        </motion.div>
      </div>

      {/* Performance Charts */}
      {data && data.drivers.length > 0 && (
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <PerformanceChart
            data={data.drivers
              .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
              .slice(0, 10)
              .map((d) => ({
                date: d.fullName ?? "Unknown",
                value: d.totalDeliveries,
                label: d.fullName?.split(" ")[0] ?? "?",
              }))}
            title="Top Drivers by Deliveries"
            type="bar"
            color="#D4A017"
          />
          <PerformanceChart
            data={data.drivers
              .filter((d) => d.avgRating !== null)
              .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
              .slice(0, 10)
              .map((d) => ({
                date: d.fullName ?? "Unknown",
                value: d.avgRating ?? 0,
                label: d.fullName?.split(" ")[0] ?? "?",
              }))}
            title="Drivers by Average Rating"
            type="bar"
            color="#2E8B57"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

function DriverDetailCard({
  driver,
  onClose,
}: {
  driver: DriverStats;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl bg-white p-6 shadow-warm-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal-900">
          {driver.fullName ?? "Unknown Driver"}
        </h3>
        <button
          onClick={onClose}
          className="text-charcoal-400 hover:text-charcoal-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-charcoal-500">Total Deliveries</p>
            <p className="text-2xl font-bold text-charcoal-900">
              {driver.totalDeliveries}
            </p>
          </div>
          <div>
            <p className="text-sm text-charcoal-500">On-Time Rate</p>
            <p className="text-2xl font-bold text-jade">
              {driver.onTimeRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-charcoal-500">Rating Distribution</p>
          <RatingDistributionBars
            distribution={driver.ratingDistribution}
            total={driver.totalRatings}
          />
        </div>

        {driver.avgDeliveryMinutes !== null && (
          <div>
            <p className="text-sm text-charcoal-500">Avg Delivery Time</p>
            <p className="text-lg font-semibold text-charcoal-900">
              {driver.avgDeliveryMinutes} min
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TeamStatsCard({
  totalDeliveriesMonth,
  totalDeliveriesWeek,
  activeCount,
  inactiveCount,
}: {
  totalDeliveriesMonth: number;
  totalDeliveriesWeek: number;
  activeCount: number;
  inactiveCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white p-6 shadow-warm-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-saffron" />
        <h3 className="text-lg font-semibold text-charcoal-900">Team Overview</h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between border-b pb-3">
          <span className="text-charcoal-500">This Month</span>
          <span className="font-semibold text-charcoal-900">
            {totalDeliveriesMonth} deliveries
          </span>
        </div>
        <div className="flex justify-between border-b pb-3">
          <span className="text-charcoal-500">This Week</span>
          <span className="font-semibold text-charcoal-900">
            {totalDeliveriesWeek} deliveries
          </span>
        </div>
        <div className="flex justify-between border-b pb-3">
          <span className="text-charcoal-500">Active Drivers</span>
          <span className="font-semibold text-jade">{activeCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-charcoal-500">Inactive Drivers</span>
          <span className="font-semibold text-charcoal-400">{inactiveCount}</span>
        </div>
      </div>
    </motion.div>
  );
}
