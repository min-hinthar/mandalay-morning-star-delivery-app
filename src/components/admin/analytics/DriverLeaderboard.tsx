/**
 * V2 Sprint 4: Driver Leaderboard Component
 *
 * Animated leaderboard with medals, rankings, and hover effects.
 * iOS-like spring animations and haptic feedback visuals.
 */

"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaderboardProps, DriverLeaderboardEntry } from "@/types/analytics";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const medalColors = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

export function DriverLeaderboard({
  entries,
  onDriverClick,
  loading = false,
  showMedals = true,
}: LeaderboardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-warm-sm">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-saffron" />
          <h3 className="text-lg font-semibold text-charcoal-900">Top Drivers</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 rounded-lg bg-charcoal-50 p-4"
            >
              <div className="h-10 w-10 rounded-full bg-charcoal-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-charcoal-200" />
                <div className="h-3 w-16 rounded bg-charcoal-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white p-6 shadow-warm-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-saffron" />
        <h3 className="text-lg font-semibold text-charcoal-900">Top Drivers</h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.driverId}
            entry={entry}
            onClick={() => onDriverClick?.(entry.driverId)}
            showMedal={showMedals}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function LeaderboardRow({
  entry,
  onClick,
  showMedal,
}: {
  entry: DriverLeaderboardEntry;
  onClick?: () => void;
  showMedal: boolean;
}) {
  const initials =
    entry.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        scale: 1.01,
        backgroundColor: "rgba(212, 160, 23, 0.05)",
      }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors",
        "hover:bg-saffron-50"
      )}
    >
      {/* Rank */}
      <div className="flex w-8 items-center justify-center">
        {showMedal && entry.rank <= 3 ? (
          <Medal
            className={cn(
              "h-6 w-6",
              medalColors[entry.rank as keyof typeof medalColors]
            )}
          />
        ) : (
          <span className="text-lg font-bold text-charcoal-400">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.profileImageUrl ?? undefined} />
        <AvatarFallback className="bg-saffron/10 text-saffron font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name and stats */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-charcoal-900 truncate">
          {entry.fullName ?? "Unknown Driver"}
        </p>
        <div className="flex items-center gap-3 text-sm text-charcoal-500">
          <span>{entry.totalDeliveries} deliveries</span>
          {entry.avgRating && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-saffron text-saffron" />
              {entry.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* On-time rate */}
      <div className="text-right">
        <p className="font-semibold text-jade">{entry.onTimeRate.toFixed(0)}%</p>
        <p className="text-xs text-charcoal-400">on-time</p>
      </div>

      {/* Trend indicator */}
      <div className="w-6">
        {entry.trend === "up" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <TrendingUp className="h-5 w-5 text-jade" />
          </motion.div>
        )}
        {entry.trend === "down" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <TrendingDown className="h-5 w-5 text-red-500" />
          </motion.div>
        )}
        {entry.trend === "stable" && (
          <Minus className="h-5 w-5 text-charcoal-300" />
        )}
      </div>
    </motion.div>
  );
}

/**
 * Compact leaderboard for smaller displays
 */
export function LeaderboardCompact({
  entries,
  limit = 3,
}: {
  entries: DriverLeaderboardEntry[];
  limit?: number;
}) {
  return (
    <div className="space-y-2">
      {entries.slice(0, limit).map((entry, i) => (
        <motion.div
          key={entry.driverId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 rounded-lg bg-charcoal-50 p-2"
        >
          <Medal
            className={cn(
              "h-5 w-5",
              i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"
            )}
          />
          <span className="flex-1 truncate text-sm font-medium">
            {entry.fullName ?? "Unknown"}
          </span>
          <span className="text-sm font-semibold text-jade">
            {entry.onTimeRate.toFixed(0)}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}
