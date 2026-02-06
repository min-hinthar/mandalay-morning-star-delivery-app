"use client";

import { m } from "framer-motion";
import {
  Star,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { DriverDashboardProps } from "./types";
import { getGreeting } from "./types";
import { StatCard } from "./StatCard";
import { StreakDisplay } from "./StreakDisplay";
import { RouteCard } from "./RouteCard";
import { BadgesDisplay } from "./BadgesDisplay";

export function DriverDashboard({
  driver,
  todayRoute,
  streakDays = 0,
  weeklyEarningsCents: _weeklyEarningsCents = 0,
  badges = [],
  dayOfWeek,
  dateDisplay,
  onStartRoute,
  onContinueRoute,
  className,
}: DriverDashboardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const greeting = getGreeting();
  const firstName = driver.fullName?.split(" ")[0] ?? "Driver";

  return (
    <div
      className={cn(
        "min-h-screen",
        "bg-gradient-to-b from-surface-primary to-surface-tertiary/30",
        className
      )}
    >
      <div className="px-4 py-6 space-y-6">
        {/* Greeting Section */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.default)}
        >
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="flex items-center gap-1.5 text-text-muted mt-1">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </m.div>

        {/* Streak Display */}
        {streakDays > 0 && <StreakDisplay days={streakDays} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-green" />}
            value={driver.deliveriesCount}
            label="Total Deliveries"
            color="bg-green"
            index={0}
            trend="up"
          />
          <StatCard
            icon={<Star className="w-6 h-6 text-secondary fill-secondary" />}
            value={driver.ratingAvg.toFixed(1)}
            label="Rating"
            color="bg-secondary"
            index={1}
          />
        </div>

        {/* Today's Route */}
        <RouteCard
          route={todayRoute}
          dateDisplay={dateDisplay}
          dayOfWeek={dayOfWeek}
          onStartRoute={onStartRoute}
          onContinueRoute={onContinueRoute}
        />

        {/* Badges */}
        {badges.length > 0 && <BadgesDisplay badges={badges} />}

        {/* Weekly Goal */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.3 }}
          className={cn(
            "rounded-2xl bg-gradient-to-r from-primary/5 to-green/5",
            "p-4 border border-primary/10"
          )}
        >
          <div className="flex items-center gap-3">
            <m.div
              animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
              transition={{ duration: 2, repeat: 5, repeatDelay: 2 }}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Target className="w-5 h-5 text-primary" />
            </m.div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">Weekly Goal</p>
              <p className="text-sm text-text-muted">
                Complete 5 more deliveries to unlock bonus!
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-secondary" />
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default DriverDashboard;
