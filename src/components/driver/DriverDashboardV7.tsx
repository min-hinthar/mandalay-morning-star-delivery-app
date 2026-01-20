"use client";

/**
 * V7 Driver Dashboard - Motion-First Gamified Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Gamification with streaks, badges, confetti milestones, animated stats
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Star,
  TrendingUp,
  Calendar,
  Flame,
  Trophy,
  Target,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  Award,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import type { VehicleType, RouteStatus } from "@/types/driver";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

export interface DriverDashboardV7Props {
  /** Driver information */
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
    profileImageUrl: string | null;
    deliveriesCount: number;
    ratingAvg: number;
  };
  /** Today's route information */
  todayRoute: {
    id: string;
    status: RouteStatus;
    stopCount: number;
    deliveredCount: number;
    pendingCount: number;
    totalDurationMinutes: number | null;
    startedAt: string | null;
  } | null;
  /** Current streak days */
  streakDays?: number;
  /** Weekly earnings in cents */
  weeklyEarningsCents?: number;
  /** Badges earned */
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  /** Day of week display */
  dayOfWeek: string;
  /** Date display string */
  dateDisplay: string;
  /** Callback to start route */
  onStartRoute?: () => void;
  /** Callback to continue route */
  onContinueRoute?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED STAT CARD
// ============================================

interface StatCardV7Props {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  index: number;
  trend?: "up" | "down" | null;
}

function StatCardV7({ icon, value, label, color, index, trend }: StatCardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ ...getSpring(v7Spring.rubbery), delay: index * 0.1 }}
      whileHover={shouldAnimate ? { scale: 1.03, y: -4 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-v6-surface-primary p-4",
        "shadow-v6-card border border-v6-border"
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10",
          color
        )}
      />

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <motion.div
          initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={{ ...getSpring(v7Spring.ultraBouncy), delay: index * 0.1 + 0.1 }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            color.replace("bg-", "bg-") + "/10"
          )}
        >
          {icon}
        </motion.div>

        {/* Value and label */}
        <div>
          <motion.p
            initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: index * 0.1 + 0.15 }}
            className="text-2xl font-bold text-v6-text-primary flex items-center gap-1"
          >
            {value}
            {trend && (
              <motion.span
                animate={shouldAnimate ? { y: [0, -3, 0] } : undefined}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-v6-green" />
                ) : null}
              </motion.span>
            )}
          </motion.p>
          <p className="text-sm text-v6-text-muted">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// STREAK DISPLAY
// ============================================

interface StreakDisplayV7Props {
  days: number;
}

function StreakDisplayV7({ days }: StreakDisplayV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const isOnFire = days >= 5;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(v7Spring.ultraBouncy)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-r",
        isOnFire
          ? "from-orange-500/20 via-red-500/20 to-yellow-500/20 border-orange-500/30"
          : "from-v6-primary/10 to-v6-secondary/10 border-v6-primary/20",
        "border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={
              shouldAnimate && isOnFire
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }
                : undefined
            }
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              isOnFire ? "bg-orange-500/20" : "bg-v6-primary/10"
            )}
          >
            <Flame
              className={cn(
                "w-6 h-6",
                isOnFire ? "text-orange-500" : "text-v6-primary"
              )}
            />
          </motion.div>
          <div>
            <p className="font-semibold text-v6-text-primary">
              {days} Day Streak!
            </p>
            <p className="text-sm text-v6-text-muted">
              {isOnFire ? "You're on fire! Keep going!" : "Keep delivering daily!"}
            </p>
          </div>
        </div>

        {/* Fire particles when on streak */}
        {isOnFire && shouldAnimate && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-orange-400"
                initial={{
                  x: `${20 + Math.random() * 60}%`,
                  y: "100%",
                  opacity: 0,
                }}
                animate={{
                  y: "-20%",
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// ROUTE CARD
// ============================================

interface RouteCardV7Props {
  route: DriverDashboardV7Props["todayRoute"];
  dateDisplay: string;
  dayOfWeek: string;
  onStartRoute?: () => void;
  onContinueRoute?: () => void;
}

function RouteCardV7({
  route,
  dateDisplay,
  dayOfWeek,
  onStartRoute,
  onContinueRoute,
}: RouteCardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  if (!route) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(v7Spring.default)}
        className={cn(
          "rounded-2xl bg-v6-surface-primary p-6",
          "shadow-v6-card border border-v6-border",
          "text-center"
        )}
      >
        <motion.div
          animate={shouldAnimate ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Calendar className="w-12 h-12 text-v6-text-muted mx-auto mb-3" />
        </motion.div>
        <p className="font-semibold text-v6-text-primary">No Route Today</p>
        <p className="text-sm text-v6-text-muted mt-1">
          Enjoy your day off! Check back tomorrow.
        </p>
      </motion.div>
    );
  }

  const progress = route.stopCount > 0
    ? Math.round((route.deliveredCount / route.stopCount) * 100)
    : 0;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "rounded-2xl bg-v6-surface-primary overflow-hidden",
        "shadow-v6-card border border-v6-border"
      )}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-v6-primary/10 to-v6-secondary/10 border-b border-v6-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-v6-text-primary">Today&apos;s Route</p>
            <p className="text-sm text-v6-text-muted">
              {dayOfWeek}, {dateDisplay}
            </p>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              route.status === "planned" && "bg-v6-secondary/10 text-v6-secondary",
              route.status === "in_progress" && "bg-v6-primary/10 text-v6-primary",
              route.status === "completed" && "bg-v6-green/10 text-v6-green"
            )}
          >
            {route.status === "planned" && "Ready to Start"}
            {route.status === "in_progress" && "In Progress"}
            {route.status === "completed" && "Completed"}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-v6-text-muted">Progress</span>
          <span className="font-semibold text-v6-text-primary">
            {route.deliveredCount}/{route.stopCount} stops
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 rounded-full bg-v6-surface-tertiary overflow-hidden">
          <motion.div
            initial={shouldAnimate ? { scaleX: 0 } : undefined}
            animate={shouldAnimate ? { scaleX: progress / 100 } : undefined}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-v6-primary to-v6-green origin-left"
            style={{ width: "100%" }}
          />

          {/* Animated progress indicator */}
          {route.status === "in_progress" && shouldAnimate && (
            <motion.div
              className="absolute top-0 h-full w-8 bg-white/30"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-v6-text-muted">
            <MapPin className="w-4 h-4" />
            <span>{route.pendingCount} remaining</span>
          </div>
          {route.totalDurationMinutes && (
            <div className="flex items-center gap-1.5 text-v6-text-muted">
              <Clock className="w-4 h-4" />
              <span>~{Math.round(route.totalDurationMinutes)} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="p-4 pt-0">
        {route.status === "planned" && (
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            onClick={onStartRoute}
          >
            <Zap className="w-5 h-5" />
            Start Route
          </Button>
        )}
        {route.status === "in_progress" && (
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            onClick={onContinueRoute}
          >
            Continue Route
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        {route.status === "completed" && (
          <div className="flex items-center justify-center gap-2 py-2 text-v6-green">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Route Completed!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// BADGES DISPLAY
// ============================================

interface BadgesDisplayV7Props {
  badges: NonNullable<DriverDashboardV7Props["badges"]>;
}

function BadgesDisplayV7({ badges }: BadgesDisplayV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  if (badges.length === 0) return null;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "rounded-2xl bg-v6-surface-primary p-4",
        "shadow-v6-card border border-v6-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-v6-text-primary">Recent Badges</h3>
        <Award className="w-5 h-5 text-v6-secondary" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {badges.slice(0, 5).map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ ...getSpring(v7Spring.ultraBouncy), delay: index * 0.1 }}
            whileHover={shouldAnimate ? { scale: 1.1, y: -2 } : undefined}
            className="flex-shrink-0 flex flex-col items-center gap-1 p-2"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-v6-secondary/20 to-v6-primary/20 flex items-center justify-center text-2xl">
              {badge.icon}
            </div>
            <span className="text-xs text-v6-text-muted whitespace-nowrap">
              {badge.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DriverDashboardV7({
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
}: DriverDashboardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  const greeting = getGreeting();
  const firstName = driver.fullName?.split(" ")[0] ?? "Driver";

  return (
    <div
      className={cn(
        "min-h-screen",
        "bg-gradient-to-b from-v6-surface-primary to-v6-surface-tertiary/30",
        className
      )}
    >
      <div className="px-4 py-6 space-y-6">
        {/* Greeting Section */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(v7Spring.default)}
        >
          <h1 className="text-2xl font-bold text-v6-text-primary">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="flex items-center gap-1.5 text-v6-text-muted mt-1">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </motion.div>

        {/* Streak Display */}
        {streakDays > 0 && <StreakDisplayV7 days={streakDays} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCardV7
            icon={<TrendingUp className="w-6 h-6 text-v6-green" />}
            value={driver.deliveriesCount}
            label="Total Deliveries"
            color="bg-v6-green"
            index={0}
            trend="up"
          />
          <StatCardV7
            icon={<Star className="w-6 h-6 text-v6-secondary fill-v6-secondary" />}
            value={driver.ratingAvg.toFixed(1)}
            label="Rating"
            color="bg-v6-secondary"
            index={1}
          />
        </div>

        {/* Today's Route */}
        <RouteCardV7
          route={todayRoute}
          dateDisplay={dateDisplay}
          dayOfWeek={dayOfWeek}
          onStartRoute={onStartRoute}
          onContinueRoute={onContinueRoute}
        />

        {/* Badges */}
        {badges.length > 0 && <BadgesDisplayV7 badges={badges} />}

        {/* Weekly Goal (optional motivational element) */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(v7Spring.default), delay: 0.3 }}
          className={cn(
            "rounded-2xl bg-gradient-to-r from-v6-primary/5 to-v6-green/5",
            "p-4 border border-v6-primary/10"
          )}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="w-10 h-10 rounded-full bg-v6-primary/10 flex items-center justify-center"
            >
              <Target className="w-5 h-5 text-v6-primary" />
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-v6-text-primary">Weekly Goal</p>
              <p className="text-sm text-v6-text-muted">
                Complete 5 more deliveries to unlock bonus!
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-v6-secondary" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// HELPER
// ============================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default DriverDashboardV7;
