"use client";

/**
 * V7 Leaderboard - Motion-First Gamified Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Animated rankings, position change animations, podium display
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Star,
  Minus,
  Crown,
  Flame,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring, v7StaggerContainer } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  profileImageUrl: string | null;
  score: number;
  deliveriesCount: number;
  rating: number;
  isCurrentUser?: boolean;
  streak?: number;
}

export interface LeaderboardV7Props {
  /** Leaderboard entries */
  entries: LeaderboardEntry[];
  /** Time period label */
  period?: "daily" | "weekly" | "monthly" | "all-time";
  /** Current user ID */
  currentUserId?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// PODIUM POSITION
// ============================================

interface PodiumPositionV7Props {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

function PodiumPositionV7({ entry, position }: PodiumPositionV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  const config = {
    1: {
      height: "h-32",
      color: "from-yellow-400 to-yellow-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      icon: <Crown className="w-8 h-8 text-yellow-500" />,
      delay: 0.3,
    },
    2: {
      height: "h-24",
      color: "from-v6-border-strong to-v6-text-muted",
      bgColor: "bg-v6-text-muted/10",
      borderColor: "border-v6-text-muted/30",
      icon: <Medal className="w-6 h-6 text-v6-text-muted" />,
      delay: 0.2,
    },
    3: {
      height: "h-20",
      color: "from-v6-accent-orange to-v6-accent-orange-hover",
      bgColor: "bg-v6-accent-orange/10",
      borderColor: "border-v6-accent-orange/30",
      icon: <Medal className="w-6 h-6 text-v6-accent-orange" />,
      delay: 0.4,
    },
  };

  const cfg = config[position];

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 50 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...getSpring(v7Spring.ultraBouncy), delay: cfg.delay }}
      className={cn(
        "flex flex-col items-center",
        position === 1 && "order-2",
        position === 2 && "order-1",
        position === 3 && "order-3"
      )}
    >
      {/* Profile avatar */}
      <motion.div
        initial={shouldAnimate ? { scale: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1 } : undefined}
        transition={{ ...getSpring(v7Spring.ultraBouncy), delay: cfg.delay + 0.1 }}
        className="relative mb-2"
      >
        {/* Avatar ring */}
        <div
          className={cn(
            "w-16 h-16 rounded-full p-1",
            "bg-gradient-to-br",
            cfg.color
          )}
        >
          {entry.profileImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- User avatar with dynamic URL */
            <img
              src={entry.profileImageUrl}
              alt={entry.name}
              className="w-full h-full rounded-full object-cover bg-v6-surface-primary"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-v6-surface-primary flex items-center justify-center">
              <span className="text-xl font-bold text-v6-text-muted">
                {entry.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Position badge */}
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={{ ...getSpring(v7Spring.ultraBouncy), delay: cfg.delay + 0.2 }}
          className={cn(
            "absolute -bottom-1 -right-1",
            "w-7 h-7 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            cfg.color
          )}
        >
          <span className="text-xs font-bold text-white">{position}</span>
        </motion.div>

        {/* Crown for #1 */}
        {position === 1 && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: cfg.delay + 0.3 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            {cfg.icon}
          </motion.div>
        )}
      </motion.div>

      {/* Name */}
      <p className="text-sm font-semibold text-v6-text-primary text-center max-w-[80px] truncate">
        {entry.name.split(" ")[0]}
      </p>

      {/* Score */}
      <p className="text-xs text-v6-text-muted">{entry.score} pts</p>

      {/* Podium stand */}
      <motion.div
        initial={shouldAnimate ? { scaleY: 0 } : undefined}
        animate={shouldAnimate ? { scaleY: 1 } : undefined}
        transition={{ ...getSpring(v7Spring.rubbery), delay: cfg.delay + 0.1 }}
        className={cn(
          "w-20 mt-2 rounded-t-lg origin-bottom",
          "bg-gradient-to-t",
          cfg.color,
          cfg.height
        )}
      />
    </motion.div>
  );
}

// ============================================
// LEADERBOARD ROW
// ============================================

interface LeaderboardRowV7Props {
  entry: LeaderboardEntry;
  index: number;
}

function LeaderboardRowV7({ entry, index }: LeaderboardRowV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  // Calculate position change
  const positionChange = entry.previousRank
    ? entry.previousRank - entry.rank
    : 0;

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(v7Spring.snappy), delay: index * 0.05 }}
      whileHover={shouldAnimate ? { scale: 1.02, x: 4 } : undefined}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "transition-colors",
        entry.isCurrentUser
          ? "bg-v6-primary/10 border border-v6-primary/20"
          : "bg-v6-surface-primary hover:bg-v6-surface-secondary"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        <span
          className={cn(
            "text-lg font-bold",
            entry.rank <= 3 ? "text-v6-secondary" : "text-v6-text-muted"
          )}
        >
          {entry.rank}
        </span>
      </div>

      {/* Position change indicator */}
      <div className="w-6 flex justify-center">
        {positionChange > 0 && (
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            className="flex items-center text-v6-green"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="text-xs font-medium">{positionChange}</span>
          </motion.div>
        )}
        {positionChange < 0 && (
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            className="flex items-center text-v6-status-error"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-xs font-medium">{Math.abs(positionChange)}</span>
          </motion.div>
        )}
        {positionChange === 0 && (
          <Minus className="w-4 h-4 text-v6-text-muted" />
        )}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-v6-surface-tertiary">
          {entry.profileImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- User avatar with dynamic URL */
            <img
              src={entry.profileImageUrl}
              alt={entry.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-bold text-v6-text-muted">
                {entry.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Streak badge */}
        {entry.streak && entry.streak >= 3 && (
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"
          >
            <Flame className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Name and stats */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-semibold truncate",
            entry.isCurrentUser ? "text-v6-primary" : "text-v6-text-primary"
          )}
        >
          {entry.name}
          {entry.isCurrentUser && (
            <span className="ml-2 text-xs text-v6-primary">(You)</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-v6-text-muted">
          <span>{entry.deliveriesCount} deliveries</span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-v6-secondary fill-v6-secondary" />
            {entry.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="font-bold text-v6-text-primary">{entry.score}</p>
        <p className="text-xs text-v6-text-muted">points</p>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LeaderboardV7({
  entries,
  period = "weekly",
  currentUserId,
  className,
}: LeaderboardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  // Mark current user and sort by rank
  const sortedEntries = useMemo(() => {
    return [...entries]
      .map((entry) => ({
        ...entry,
        isCurrentUser: entry.id === currentUserId,
      }))
      .sort((a, b) => a.rank - b.rank);
  }, [entries, currentUserId]);

  // Top 3 for podium
  const podiumEntries = sortedEntries.slice(0, 3);

  // Rest of entries
  const listEntries = sortedEntries.slice(3);

  // Period labels
  const periodLabels = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    "all-time": "All Time",
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(v7Spring.default)}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          >
            <Trophy className="w-6 h-6 text-v6-secondary" />
          </motion.div>
          <h2 className="text-xl font-bold text-v6-text-primary">Leaderboard</h2>
        </div>
        <div className="px-3 py-1 rounded-full bg-v6-primary/10 text-sm font-medium text-v6-primary">
          {periodLabels[period]}
        </div>
      </motion.div>

      {/* Podium */}
      {podiumEntries.length >= 3 && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          className={cn(
            "flex items-end justify-center gap-4 pt-8 pb-4 px-4",
            "rounded-2xl bg-gradient-to-b from-v6-surface-secondary to-transparent"
          )}
        >
          {podiumEntries.map((entry, i) => (
            <PodiumPositionV7
              key={entry.id}
              entry={entry}
              position={(i + 1) as 1 | 2 | 3}
            />
          ))}
        </motion.div>
      )}

      {/* List */}
      {listEntries.length > 0 && (
        <motion.div
          variants={shouldAnimate ? v7StaggerContainer(0.05, 0.2) : undefined}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {listEntries.map((entry, index) => (
            <LeaderboardRowV7 key={entry.id} entry={entry} index={index} />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          className="text-center py-12"
        >
          <Sparkles className="w-12 h-12 text-v6-text-muted mx-auto mb-3" />
          <p className="text-v6-text-muted">No entries yet. Start delivering!</p>
        </motion.div>
      )}
    </div>
  );
}

export default LeaderboardV7;
