"use client";

/**
 * TimelineStep Component
 *
 * Individual step in the order status timeline with animated icons and pulse.
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
            "relative flex h-12 w-12 items-center justify-center rounded-full border-3",
            "transition-all duration-300",
            isCompleted && "border-green bg-green text-text-inverse",
            isCurrent && "border-primary bg-primary text-text-inverse shadow-lg shadow-primary/30",
            isPending && "border-border bg-surface-secondary text-text-muted"
          )}
        >
          <m.div
            animate={isCurrent && isLive && shouldAnimate ? {
              scale: [1, 1.2, 1], rotate: [0, 5, -5, 0],
            } : undefined}
            transition={{ duration: 2, repeat: 5, repeatDelay: 1 }}
          >
            <Icon className="h-6 w-6" />
          </m.div>

          {isCurrent && isLive && (
            <>
              <m.span
                className="absolute inset-0 rounded-full bg-primary"
                animate={shouldAnimate ? { scale: [1, 1.5, 2], opacity: [0.4, 0.1, 0] } : undefined}
                transition={{ duration: 2, repeat: 5 }}
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-green border-2 border-surface-primary" />
              </span>
            </>
          )}

          {isCompleted && (
            <m.div
              initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
              animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-primary flex items-center justify-center shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-green" />
            </m.div>
          )}
        </m.div>

        {!isLast && (
          <div className="relative w-1 flex-1 min-h-8 my-1">
            <div className="absolute inset-0 rounded-full bg-border" />
            <m.div
              initial={shouldAnimate ? { scaleY: 0 } : undefined}
              animate={shouldAnimate ? { scaleY: isCompleted ? 1 : isCurrent ? 0.5 : 0 } : undefined}
              transition={{ ...getSpring(spring.gentle), delay: index * 0.1 + 0.2 }}
              className="absolute inset-0 rounded-full bg-green origin-top"
            />
            {isCurrent && isLive && (
              <m.div
                animate={shouldAnimate ? { y: [0, 20, 0] } : undefined}
                transition={{ duration: 2, repeat: 5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary"
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
            "font-semibold text-base",
            isCompleted && "text-green",
            isCurrent && "text-primary",
            isPending && "text-text-muted"
          )}
        >
          {label}
        </m.p>

        {timestamp && (isCompleted || isCurrent) && (
          <m.p
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-sm text-text-secondary mt-0.5"
          >
            {format(parseISO(timestamp), "MMM d, yyyy 'at' h:mm a")}
          </m.p>
        )}

        {isCurrent && !timestamp && (
          <m.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="flex items-center gap-1.5 mt-0.5"
          >
            {isLive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm text-primary font-medium">In progress...</span>
              </>
            ) : (
              <span className="text-sm text-text-muted">Current step</span>
            )}
          </m.div>
        )}
      </div>
    </m.div>
  );
}
