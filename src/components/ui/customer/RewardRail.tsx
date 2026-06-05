"use client";

/**
 * RewardRail — multi-goal progress, one motivator with several payoffs.
 *
 * The cart already nudges toward free delivery; this generalizes that into a
 * stacked set of goals (e.g. "$12 to free delivery" + "$8 to your next Star")
 * so a single subtotal visibly powers two rewards at once. Presentational and
 * value-agnostic — feed it goals in any unit.
 */

import type { ComponentType } from "react";
import { m } from "framer-motion";
import { Check, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export type RewardTone = "delivery" | "reward" | "tier";

export interface RewardGoal {
  id: string;
  /** Short label, e.g. "Free delivery" or "Next Star reward". */
  label: string;
  icon: ComponentType<LucideProps>;
  /** Current progress value (same unit as `target`). */
  value: number;
  /** Goal value; progress is `value / target`. */
  target: number;
  /** Render a remaining amount, e.g. (n) => `$${(n / 100).toFixed(2)}`. */
  formatRemaining?: (remaining: number) => string;
  /** Copy shown once the goal is reached. */
  reachedLabel: string;
  tone?: RewardTone;
}

export interface RewardRailProps {
  goals: RewardGoal[];
  className?: string;
}

const toneStyles: Record<RewardTone, { fill: string; ring: string; text: string; soft: string }> = {
  delivery: {
    fill: "bg-accent-teal",
    ring: "border-accent-teal/30",
    text: "text-accent-teal",
    soft: "bg-accent-teal/10",
  },
  reward: {
    fill: "bg-primary",
    ring: "border-primary/30",
    text: "text-primary",
    soft: "bg-primary/10",
  },
  tier: {
    fill: "bg-magenta",
    ring: "border-magenta/30",
    text: "text-magenta",
    soft: "bg-magenta/10",
  },
};

function GoalRow({ goal }: { goal: RewardGoal }) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const tone = toneStyles[goal.tone ?? "reward"];

  const remaining = Math.max(0, goal.target - goal.value);
  const reached = remaining === 0;
  const percent = goal.target > 0 ? Math.min(100, (goal.value / goal.target) * 100) : 0;
  const Icon = reached ? Check : goal.icon;
  const remainingLabel = goal.formatRemaining ? goal.formatRemaining(remaining) : String(remaining);

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-fast",
          reached ? tone.fill : tone.soft
        )}
      >
        <Icon className={cn("h-4 w-4", reached ? "text-text-inverse" : tone.text)} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-body text-sm font-semibold text-text-primary">
            {goal.label}
          </span>
          <span
            className={cn(
              "shrink-0 font-body text-xs font-semibold tabular-nums",
              reached ? tone.text : "text-text-secondary"
            )}
          >
            {reached ? goal.reachedLabel : `${remainingLabel} to go`}
          </span>
        </div>

        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-tertiary">
          <m.div
            className={cn("h-full rounded-full", tone.fill)}
            initial={shouldAnimate ? { width: 0 } : { width: `${percent}%` }}
            animate={{ width: `${percent}%` }}
            transition={getSpring(spring.rubbery)}
          />
        </div>
      </div>
    </div>
  );
}

export function RewardRail({ goals, className }: RewardRailProps) {
  if (goals.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-surface-primary/80 p-4 shadow-card backdrop-blur-sm",
        className
      )}
    >
      {goals.map((goal) => (
        <GoalRow key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

export default RewardRail;
