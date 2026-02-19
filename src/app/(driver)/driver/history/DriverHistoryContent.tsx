"use client";

import { useState, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { TrendingUp, Star, Clock, ChevronDown, Loader2, MapPin, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";
import { HistorySummaryCard } from "@/components/ui/driver/DriverDashboard/HistorySummaryCard";
import type { HistoryRouteData } from "@/components/ui/driver/DriverDashboard/HistorySummaryCard";
import { DriverHistoryEmptyState } from "@/components/ui/EmptyState";

// ============================================
// TYPES
// ============================================

type HistoryPeriod = "daily" | "weekly" | "monthly";

interface DriverHistoryContentProps {
  driver: {
    deliveriesCount: number;
    ratingAvg: number;
    onTimePercentage: number;
  };
  routes: HistoryRouteData[];
  totalRoutes: number;
}

// ============================================
// CONSTANTS
// ============================================

const PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const PAGE_SIZE = 20;

// ============================================
// HELPERS
// ============================================

function getPeriodStartDate(period: HistoryPeriod): string {
  const now = new Date();
  switch (period) {
    case "daily":
      now.setDate(now.getDate() - 14);
      break;
    case "weekly":
      now.setDate(now.getDate() - 12 * 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() - 12);
      break;
  }
  return now.toISOString().split("T")[0];
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function formatMonthHeader(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

// ============================================
// STAT MINI-CARD
// ============================================

function StatMiniCard({
  icon,
  value,
  label,
  format,
  suffix,
  index,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  format: "number" | "percentage";
  suffix?: string;
  index: number;
}) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.95 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ ...getSpring(spring.default), delay: index * 0.08 }}
      className={cn(
        "rounded-xl bg-gradient-to-br from-accent-teal/5 to-accent-teal/10",
        "p-3 text-center shadow-sm border border-border"
      )}
    >
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-xl font-bold text-text-primary">
          <AnimatedValue value={value} format={format} />
          {suffix}
        </span>
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
    </m.div>
  );
}

// ============================================
// MONTH GROUP
// ============================================

function MonthGroup({
  monthKey,
  routes,
  startIndex,
}: {
  monthKey: string;
  routes: HistoryRouteData[];
  startIndex: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-surface-secondary"
      >
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          {formatMonthHeader(monthKey)}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted bg-surface-tertiary px-2 py-0.5 rounded-full">
            {routes.length}
          </span>
          <m.div
            animate={shouldAnimate ? { rotate: expanded ? 0 : -90 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </m.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <m.div
            key="content"
            initial={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={getSpring(spring.snappy)}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {routes.map((route, idx) => (
                <HistorySummaryCard key={route.id} route={route} index={startIndex + idx} />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DriverHistoryContent({
  driver,
  routes: initialRoutes,
  totalRoutes,
}: DriverHistoryContentProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<HistoryPeriod>("weekly");
  const [routes, setRoutes] = useState<HistoryRouteData[]>(initialRoutes);
  const [offset, setOffset] = useState(initialRoutes.length);
  const [hasMore, setHasMore] = useState(initialRoutes.length < totalRoutes);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter routes by period
  const filteredRoutes = useMemo(() => {
    const startDate = getPeriodStartDate(selectedPeriod);
    return routes.filter((r) => r.date >= startDate);
  }, [routes, selectedPeriod]);

  // Period aggregate stats
  const periodStats = useMemo(() => {
    const routeCount = filteredRoutes.length;
    const totalStops = filteredRoutes.reduce((sum, r) => sum + r.stopCount, 0);
    const avgStops = routeCount > 0 ? Math.round(totalStops / routeCount) : 0;
    return { routeCount, totalStops, avgStops };
  }, [filteredRoutes]);

  // Group by month
  const monthGroups = useMemo(() => {
    const groups: { key: string; routes: HistoryRouteData[] }[] = [];
    const seen = new Map<string, number>();

    for (const route of filteredRoutes) {
      const key = getMonthKey(route.date);
      const idx = seen.get(key);
      if (idx !== undefined) {
        groups[idx].routes.push(route);
      } else {
        groups.push({ key, routes: [route] });
        seen.set(key, groups.length - 1);
      }
    }

    return groups;
  }, [filteredRoutes]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/driver/routes/history?limit=${PAGE_SIZE}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        const newRoutes: HistoryRouteData[] = (data.routes ?? []).map(
          (r: {
            id: string;
            deliveryDate: string;
            stopCount: number;
            deliveredCount: number;
            completionRate: number;
            durationMinutes: number | null;
          }) => ({
            id: r.id,
            date: r.deliveryDate,
            stopCount: r.stopCount,
            deliveredCount: r.deliveredCount,
            onTimePercentage: 0,
            totalDurationMinutes: r.durationMinutes,
            stops: [],
          })
        );

        setRoutes((prev) => [...prev, ...newRoutes]);
        setOffset((prev) => prev + newRoutes.length);
        setHasMore(offset + newRoutes.length < (data.totalRoutes ?? totalRoutes));
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [offset, totalRoutes]);

  return (
    <div className="p-4">
      {/* Lifetime Stats Cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatMiniCard
          icon={<TrendingUp className="h-4 w-4 text-accent-teal" />}
          value={driver.deliveriesCount}
          label="Deliveries"
          format="number"
          index={0}
        />
        <StatMiniCard
          icon={<Star className="h-4 w-4 text-secondary fill-secondary" />}
          value={parseFloat(driver.ratingAvg.toFixed(1))}
          label="Rating"
          format="number"
          index={1}
        />
        <StatMiniCard
          icon={<Clock className="h-4 w-4 text-accent-teal" />}
          value={driver.onTimePercentage}
          label="On Time"
          format="percentage"
          index={2}
        />
      </div>

      {/* Period Toggle */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.05 }}
        className="mb-4 flex gap-0.5 rounded-lg border border-border bg-surface-primary p-1"
      >
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedPeriod === period.value
                ? "bg-secondary text-text-inverse"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {period.label}
          </button>
        ))}
      </m.div>

      {/* Period Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatMiniCard
          icon={<BarChart3 className="h-4 w-4 text-secondary" />}
          value={periodStats.routeCount}
          label="Routes"
          format="number"
          index={3}
        />
        <StatMiniCard
          icon={<MapPin className="h-4 w-4 text-secondary" />}
          value={periodStats.totalStops}
          label="Total Stops"
          format="number"
          index={4}
        />
        <StatMiniCard
          icon={<TrendingUp className="h-4 w-4 text-secondary" />}
          value={periodStats.avgStops}
          label="Avg Stops"
          format="number"
          index={5}
        />
      </div>

      {/* Past Routes Header */}
      <m.h2
        initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.2 }}
        className="mb-3 font-display text-lg font-semibold text-text-primary"
      >
        Past Routes ({totalRoutes})
      </m.h2>

      {filteredRoutes.length === 0 ? (
        <DriverHistoryEmptyState />
      ) : (
        <m.div
          variants={staggerContainer(0.04, 0.1)}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {monthGroups.map((group) => {
            // Compute cumulative start index for stagger animation
            let startIdx = 0;
            for (const g of monthGroups) {
              if (g.key === group.key) break;
              startIdx += g.routes.length;
            }
            return (
              <MonthGroup
                key={group.key}
                monthKey={group.key}
                routes={group.routes}
                startIndex={startIdx}
              />
            );
          })}
        </m.div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className={cn(
            "mt-4 w-full rounded-xl border border-border bg-surface-primary py-3",
            "text-sm font-medium text-text-secondary",
            "hover:bg-surface-secondary transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoadingMore ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            "Load More"
          )}
        </button>
      )}
    </div>
  );
}
