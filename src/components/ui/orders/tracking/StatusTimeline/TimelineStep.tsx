"use client";

/**
 * TimelineStep — one step in the After Dark order-status timeline.
 * Triad accents on warm paper: completed = sage, current = clay (glowing/live),
 * pending = muted. Constant ink tokens (the host card is cream in both themes).
 */

import React from "react";
import { m } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { format, parseISO } from "date-fns";

interface TimelineStepProps {
  status: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  isLast: boolean;
  isLive: boolean;
  index: number;
}

export function TimelineStep({
  status: _status,
  label,
  icon: Icon,
  timestamp,
  isCompleted,
  isCurrent,
  isPending,
  isLast,
  isLive,
  index,
}: TimelineStepProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(spring.rubbery), delay: index * 0.1 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center">
        <m.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.1 + 0.1 }}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border-2",
            "transition-all duration-300",
            isCompleted && "border-hero-sage bg-hero-sage text-hero-card-strong",
            isCurrent && "border-hero-clay bg-hero-clay text-hero-card-strong shadow-lg",
            isPending && "border-hero-line bg-hero-card/50 text-hero-ink-muted/60"
          )}
        >
          <m.div
            animate={
              isCurrent && isLive && shouldAnimate
                ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
                : undefined
            }
            transition={{ duration: 2, repeat: 5, repeatDelay: 1 }}
          >
            <Icon className="h-6 w-6" />
          </m.div>

          {isCurrent && isLive && (
            <>
              <m.span
                className="absolute inset-0 rounded-full bg-hero-clay"
                animate={shouldAnimate ? { scale: [1, 1.5, 2], opacity: [0.4, 0.1, 0] } : undefined}
                transition={{ duration: 2, repeat: 5 }}
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hero-sage opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-hero-card-strong bg-hero-sage" />
              </span>
            </>
          )}

          {isCompleted && (
            <m.div
              initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
              animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-hero-card-strong shadow-sm"
            >
              <CheckCircle className="h-4 w-4 text-hero-sage" />
            </m.div>
          )}
        </m.div>

        {!isLast && (
          <div className="relative my-1 min-h-8 w-1 flex-1">
            <div className="absolute inset-0 rounded-full bg-hero-ink/10" />
            <m.div
              initial={shouldAnimate ? { scaleY: 0 } : undefined}
              animate={
                shouldAnimate ? { scaleY: isCompleted ? 1 : isCurrent ? 0.5 : 0 } : undefined
              }
              transition={{ ...getSpring(spring.gentle), delay: index * 0.1 + 0.2 }}
              className="absolute inset-0 origin-top rounded-full bg-hero-clay"
            />
            {isCurrent && isLive && (
              <m.div
                animate={shouldAnimate ? { y: [0, 20, 0] } : undefined}
                transition={{ duration: 2, repeat: 5 }}
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-hero-clay"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 pb-8">
        <m.p
          initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: index * 0.1 + 0.15 }}
          className={cn(
            "text-base font-semibold",
            isCompleted && "text-hero-sage",
            isCurrent && "text-hero-accent",
            isPending && "text-hero-ink-muted/70"
          )}
        >
          {label}
        </m.p>

        {timestamp && (isCompleted || isCurrent) && (
          <m.p
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="mt-0.5 text-sm text-hero-ink-muted"
          >
            {format(parseISO(timestamp), "MMM d, yyyy 'at' h:mm a")}
          </m.p>
        )}

        {isCurrent && !timestamp && (
          <m.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="mt-0.5 flex items-center gap-1.5"
          >
            {isLive ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-hero-accent" />
                <span className="text-sm font-medium text-hero-accent">In progress…</span>
              </>
            ) : (
              <span className="text-sm text-hero-ink-muted">Current step</span>
            )}
          </m.div>
        )}
      </div>
    </m.div>
  );
}
