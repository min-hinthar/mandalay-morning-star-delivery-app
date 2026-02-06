"use client";

import { m } from "framer-motion";
import { Package, CheckCircle2, Clock, Route, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Progress } from "@/components/ui/progress";
import type { RouteStats } from "@/types/driver";

interface RouteStatsBarProps {
  route: {
    stats: RouteStats | null;
    stops: { status: string }[];
  };
  className?: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}

function StatItem({ icon, label, value, subValue, className }: StatItemProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="p-2 rounded-lg bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-text-primary">{value}</p>
        {subValue && <p className="text-xs text-text-muted">{subValue}</p>}
      </div>
    </div>
  );
}

export function RouteStatsBar({ route, className }: RouteStatsBarProps) {
  const stats = route.stats;
  const stops = route.stops;

  // Calculate stats from stops if not available in stats_json
  const totalStops = stats?.total_stops ?? stops.length;
  const deliveredStops = stats?.delivered_stops ?? stops.filter((s) => s.status === "delivered").length;
  const pendingStops = stats?.pending_stops ?? stops.filter((s) => s.status === "pending" || s.status === "enroute" || s.status === "arrived").length;
  const completionRate = stats?.completion_rate ?? (totalStops > 0 ? Math.round((deliveredStops / totalStops) * 100) : 0);

  // Distance and time from stats_json
  const totalDistance = stats?.total_distance_miles;
  const totalDuration = stats?.total_duration_minutes;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-surface-secondary rounded-card-sm border border-border p-4",
        className
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {/* Total Stops */}
        <StatItem
          icon={<Package className="h-5 w-5 text-interactive-primary" />}
          label="Total Stops"
          value={totalStops}
        />

        {/* Completed */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-status-success-bg">
            <CheckCircle2 className="h-5 w-5 text-status-success" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Completed</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-text-primary">{deliveredStops}</p>
              <Progress value={completionRate} className="w-16 h-2" />
              <span className="text-xs text-text-muted">{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Pending */}
        <StatItem
          icon={<Clock className="h-5 w-5 text-status-info" />}
          label="Pending"
          value={pendingStops}
        />

        {/* Distance */}
        <StatItem
          icon={<Route className="h-5 w-5 text-accent-tertiary" />}
          label="Distance"
          value={totalDistance ? `${totalDistance.toFixed(1)} mi` : "—"}
        />

        {/* Estimated Time */}
        <StatItem
          icon={<Timer className="h-5 w-5 text-orange" />}
          label="Est. Time"
          value={totalDuration ? `${totalDuration} min` : "—"}
        />
      </div>
    </m.div>
  );
}
