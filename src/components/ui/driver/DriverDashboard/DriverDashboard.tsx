"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Star, TrendingUp, Calendar, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { DriverDashboardProps } from "./types";
import { StatCard } from "./StatCard";
import { StreakDisplay } from "./StreakDisplay";
import { RouteCard } from "./RouteCard";
import { BadgesDisplay } from "./BadgesDisplay";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";
import { EarningsSummaryCard } from "./EarningsSummaryCard";
import { NextRouteChip } from "./NextRouteChip";

export function DriverDashboard({
  driver,
  todayRoute,
  streakDays = 0,
  todayEarningsCents = 0,
  weeklyEarningsCents = 0,
  badges = [],
  nextRouteDate,
  dayOfWeek,
  dateDisplay,
  onStartRoute,
  onContinueRoute,
  className,
}: DriverDashboardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartRoute = useCallback(async () => {
    if (!todayRoute || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/driver/routes/${todayRoute.id}/start`, { method: "POST" });
      if (res.ok) {
        router.push("/driver/route");
      }
    } finally {
      setIsStarting(false);
    }
  }, [todayRoute, isStarting, router]);

  const handleContinueRoute = useCallback(() => {
    router.push("/driver/route");
  }, [router]);

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
          <h1 className="text-2xl font-bold text-text-primary">Hello, {firstName}!</h1>
          <p className="flex items-center gap-1.5 text-text-muted mt-1">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </m.div>

        {/* Profile Completeness */}
        <ProfileCompletenessCard driver={driver} />

        {/* Earnings Summary */}
        <EarningsSummaryCard
          todayEarningsCents={todayEarningsCents}
          weeklyEarningsCents={weeklyEarningsCents}
        />

        {/* Streak Display */}
        {streakDays > 0 && <StreakDisplay days={streakDays} />}

        {/* Stats Grid */}
        <m.div
          variants={staggerContainer(0.04, 0.08)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4"
        >
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-accent-teal" />}
            value={driver.deliveriesCount}
            label="Total Deliveries"
            color="bg-accent-teal"
            index={0}
            trend="up"
            animatedFormat="number"
          />
          <StatCard
            icon={<Star className="w-6 h-6 text-secondary fill-secondary" />}
            value={driver.ratingAvg.toFixed(1)}
            label="Rating"
            color="bg-secondary"
            index={1}
          />
        </m.div>

        {/* Today's Route */}
        <RouteCard
          route={todayRoute}
          dateDisplay={dateDisplay}
          dayOfWeek={dayOfWeek}
          onStartRoute={onStartRoute ?? handleStartRoute}
          onContinueRoute={onContinueRoute ?? handleContinueRoute}
        />

        {/* Next Route Chip */}
        {nextRouteDate && <NextRouteChip nextRouteDate={nextRouteDate} />}

        {/* Badges */}
        {badges.length > 0 && <BadgesDisplay badges={badges} />}

        {/* Weekly Goal */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.3 }}
          className={cn(
            "rounded-2xl bg-gradient-to-r from-accent-teal/5 to-green/5",
            "p-4 border border-accent-teal/10"
          )}
        >
          <div className="flex items-center gap-3">
            <m.div
              animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
              transition={{ duration: 2, repeat: 5, repeatDelay: 2 }}
              className="w-10 h-10 rounded-full bg-accent-teal/10 flex items-center justify-center"
            >
              <Target className="w-5 h-5 text-accent-teal" />
            </m.div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">Weekly Goal</p>
              <p className="text-sm text-text-muted">Complete 5 more deliveries to unlock bonus!</p>
            </div>
            <Sparkles className="w-5 h-5 text-secondary" />
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default DriverDashboard;
