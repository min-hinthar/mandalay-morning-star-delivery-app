"use client";

import { m } from "framer-motion";
import { Calendar, Zap, ChevronRight, Trophy, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import type { DriverDashboardProps } from "./types";

interface RouteCardProps {
  route: DriverDashboardProps["todayRoute"];
  dateDisplay: string;
  dayOfWeek: string;
  onStartRoute?: () => void;
  onContinueRoute?: () => void;
}

export function RouteCard({
  route,
  dateDisplay,
  dayOfWeek,
  onStartRoute,
  onContinueRoute,
}: RouteCardProps) {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();

  if (!route) {
    return (
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className={cn(
          "rounded-2xl bg-surface-primary/80 sm:backdrop-blur-sm p-6",
          "shadow-card border-2 border-border",
          "text-center"
        )}
      >
        <m.div
          animate={shouldAnimate ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 2, repeat: 5 }}
        >
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3" />
        </m.div>
        <p className="font-semibold text-text-primary">No Route Today</p>
        <p className="text-sm text-text-muted mt-1">Enjoy your day off! Check back tomorrow.</p>
      </m.div>
    );
  }

  const progress =
    route.stopCount > 0 ? Math.round((route.deliveredCount / route.stopCount) * 100) : 0;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      whileHover={shouldAnimate ? { y: -4, scale: 1.03 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      className={cn(
        "rounded-2xl bg-surface-primary/80 sm:backdrop-blur-sm overflow-hidden",
        "shadow-card border-2 border-border"
      )}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-accent-teal/10 to-secondary/10 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">Today&apos;s Route</p>
            <p className="text-sm text-text-muted">
              {dayOfWeek}, {dateDisplay}
            </p>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              route.status === "planned" && "bg-secondary/10 text-secondary",
              route.status === "in_progress" && "bg-accent-teal/10 text-accent-teal",
              route.status === "completed" && "bg-green/10 text-green"
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
          <span className="text-sm text-text-muted">Progress</span>
          <span className="font-semibold text-text-primary">
            {route.deliveredCount}/{route.stopCount} stops
          </span>
        </div>

        <div className="relative h-3 rounded-full bg-surface-tertiary overflow-hidden">
          <m.div
            initial={shouldAnimate ? { scaleX: 0 } : undefined}
            animate={shouldAnimate ? { scaleX: progress / 100 } : undefined}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-teal to-green origin-left"
            style={{ width: "100%" }}
          />
          {route.status === "in_progress" && shouldAnimate && (
            <m.div
              className="absolute top-0 h-full w-8 bg-overlay-light"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.5, repeat: 5, ease: "linear" }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-text-muted">
            <MapPin className="w-4 h-4" />
            <span>{route.pendingCount} remaining</span>
          </div>
          {route.totalDurationMinutes && (
            <div className="flex items-center gap-1.5 text-text-muted">
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
            className={cn("w-full gap-2", isFullMotion && "animate-shine-sweep")}
            onClick={onStartRoute}
          >
            <Zap className="w-5 h-5" />
            Start Route
          </Button>
        )}
        {route.status === "in_progress" && (
          <Button variant="primary" size="lg" className="w-full gap-2" onClick={onContinueRoute}>
            Continue Route
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        {route.status === "completed" && (
          <div className="flex items-center justify-center gap-2 py-2 text-green">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Route Completed!</span>
          </div>
        )}
      </div>
    </m.div>
  );
}
