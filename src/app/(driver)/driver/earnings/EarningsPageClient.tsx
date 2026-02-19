"use client";

import { useMemo, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Banknote, Award, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PerformanceChart } from "@/components/ui/admin/analytics/PerformanceChart";
import { StreakDisplay } from "@/components/ui/driver/DriverDashboard/StreakDisplay";
import { aggregateByPeriod } from "@/lib/earnings";
import type { RouteEarning, EarningsPeriod } from "@/lib/earnings";
import type { DailyMetricPoint } from "@/types/analytics";

// ===========================================
// TYPES
// ===========================================

interface EarningsPageClientProps {
  routeEarnings: RouteEarning[];
  rateCents: number;
  badges: Array<{ id: string; name: string; icon: string; earnedAt: string }>;
  streakDays: number;
  driverStats: { deliveriesCount: number; ratingAvg: number };
}

// ===========================================
// PERIOD CONFIG
// ===========================================

const PERIODS: { value: EarningsPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

/** Get start date for filtering route earnings by period */
function getPeriodStartDate(period: EarningsPeriod): string {
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

/** Format cents to dollar string */
function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export function EarningsPageClient({
  routeEarnings,
  rateCents,
  badges,
  streakDays,
}: EarningsPageClientProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>("weekly");

  // Aggregate chart data for selected period
  const chartData = useMemo<DailyMetricPoint[]>(() => {
    const aggregated = aggregateByPeriod(routeEarnings, selectedPeriod);
    return aggregated.map((point) => ({
      date: point.label,
      label: point.label,
      value: point.value / 100, // Convert cents to dollars for chart
    }));
  }, [routeEarnings, selectedPeriod]);

  // Filter route earnings by selected period's date range
  const filteredRouteEarnings = useMemo(() => {
    const startDate = getPeriodStartDate(selectedPeriod);
    return routeEarnings.filter((re) => re.date >= startDate);
  }, [routeEarnings, selectedPeriod]);

  // Total earnings for selected period
  const totalCents = useMemo(
    () => filteredRouteEarnings.reduce((sum, re) => sum + re.earningsCents, 0),
    [filteredRouteEarnings]
  );

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6 text-secondary" />
          <h1 className="text-xl font-heading font-bold text-text-primary">Earnings</h1>
        </div>
        <p className="text-lg font-bold text-text-primary">{formatDollars(totalCents)}</p>
      </m.div>

      {/* Period Toggle */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.05 }}
        className="flex gap-0.5 rounded-lg border border-border bg-surface-primary p-1"
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

      {/* Chart */}
      {chartData.length > 0 ? (
        <PerformanceChart
          data={chartData}
          title="Earnings Trend"
          type="area"
          color="var(--color-secondary)"
          height={220}
        />
      ) : (
        <m.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border text-center"
        >
          <p className="text-text-muted">No data for this period</p>
        </m.div>
      )}

      {/* Per-Route Breakdown */}
      {filteredRouteEarnings.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">
            Route Earnings ({filteredRouteEarnings.length})
          </h2>
          <m.div
            variants={staggerContainer(0.04, 0.08)}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredRouteEarnings.map((re, index) => (
              <EarningsRouteCard
                key={re.routeId}
                earning={re}
                rateCents={rateCents}
                index={index}
              />
            ))}
          </m.div>
        </div>
      ) : (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.15 }}
          className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border text-center"
        >
          <Banknote className="h-10 w-10 mx-auto mb-2 text-text-muted" />
          <p className="text-text-secondary font-medium">No earnings yet</p>
          <p className="text-sm text-text-muted mt-1">
            Complete your first delivery to see earnings here!
          </p>
        </m.div>
      )}

      {/* Badges Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">Achievements</h2>
        </div>

        {streakDays > 0 && <StreakDisplay days={streakDays} />}

        {badges.length > 0 ? (
          <m.div
            variants={staggerContainer(0.04, 0.08)}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-4 gap-3"
          >
            {badges.map((badge, index) => (
              <m.div
                key={badge.id}
                initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.1 }}
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center text-2xl">
                  {badge.icon}
                </div>
                <span className="text-xs text-text-muted text-center leading-tight">
                  {badge.name}
                </span>
              </m.div>
            ))}
          </m.div>
        ) : (
          <div className="rounded-2xl bg-surface-primary/80 p-4 border border-border text-center">
            <p className="text-sm text-text-muted">Complete deliveries to earn badges!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// ROUTE EARNINGS CARD (inline component)
// ===========================================

interface EarningsRouteCardProps {
  earning: RouteEarning;
  rateCents: number;
  index: number;
}

function EarningsRouteCard({ earning, rateCents, index }: EarningsRouteCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [expanded, setExpanded] = useState(false);

  const dateDisplay = useMemo(() => {
    const d = new Date(earning.date + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }, [earning.date]);

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...getSpring(spring.default), delay: index * 0.04 }}
      className={cn(
        "rounded-2xl bg-surface-primary/80 backdrop-blur-sm",
        "border-2 border-border shadow-card overflow-hidden"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-teal/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-accent-teal" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{dateDisplay}</p>
            <p className="text-xs text-text-muted">
              {earning.deliveredStops} stop{earning.deliveredStops !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">
            {formatDollars(earning.earningsCents)}
          </span>
          <m.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </m.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <p className="text-sm text-text-secondary mt-3">
                {earning.deliveredStops} stop{earning.deliveredStops !== 1 ? "s" : ""} delivered
                at {formatDollars(rateCents)} per stop = {formatDollars(earning.earningsCents)}
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
