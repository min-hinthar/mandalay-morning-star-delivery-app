"use client";

import { m } from "framer-motion";
import { TrendingUp, Star, Clock } from "lucide-react";
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
// COMPONENT
// ============================================

export function DriverHistoryContent({
  driver,
  routes,
  totalRoutes,
}: DriverHistoryContentProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div className="p-4">
      {/* Stats Cards */}
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

      {/* Past Routes */}
      <m.h2
        initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.2 }}
        className="mb-3 font-display text-lg font-semibold text-text-primary"
      >
        Past Routes ({totalRoutes})
      </m.h2>

      {routes.length === 0 ? (
        <DriverHistoryEmptyState />
      ) : (
        <m.div
          variants={staggerContainer(0.04, 0.1)}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {routes.map((route, idx) => (
            <HistorySummaryCard key={route.id} route={route} index={idx} />
          ))}
        </m.div>
      )}
    </div>
  );
}
