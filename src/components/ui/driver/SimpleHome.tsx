/**
 * SimpleHome - Minimal home screen for simple mode drivers
 *
 * Shows only: greeting, date, and a large route CTA button.
 * No stats, badges, streaks, earnings, or onboarding content.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Calendar, Package, Play, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface SimpleHomeProps {
  driverName: string | null;
  todayRoute: {
    id: string;
    status: string;
    stopCount: number;
    deliveredCount: number;
  } | null;
  dayOfWeek: string;
  dateDisplay: string;
}

export function SimpleHome({ driverName, todayRoute, dayOfWeek, dateDisplay }: SimpleHomeProps) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isStarting, setIsStarting] = useState(false);

  const firstName = driverName?.split(" ")[0] ?? "Driver";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-primary to-surface-tertiary/30">
      <div className="px-4 py-8 space-y-8">
        {/* Greeting */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.default)}
          className="text-center"
        >
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Hello, {firstName}!
          </h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 font-body text-text-muted">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </m.div>

        {/* Route CTA */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.15 }}
          className="mt-8"
        >
          {todayRoute ? (
            todayRoute.status === "in_progress" ? (
              /* Continue Route */
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-body text-lg font-medium text-text-primary">
                    {todayRoute.deliveredCount} of {todayRoute.stopCount} done
                  </p>
                  <div className="mt-2 mx-auto h-2 w-48 overflow-hidden rounded-full bg-surface-tertiary">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${todayRoute.stopCount > 0 ? (todayRoute.deliveredCount / todayRoute.stopCount) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-accent-teal"
                    />
                  </div>
                </div>
                <button
                  onClick={handleContinueRoute}
                  className={cn(
                    "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card-sm",
                    "bg-accent-teal font-body text-xl font-semibold text-text-inverse shadow-md",
                    "transition-all duration-fast hover:shadow-lg",
                    "active:scale-[0.98]"
                  )}
                >
                  <ArrowRight className="h-7 w-7" />
                  <span>Continue Route</span>
                </button>
              </div>
            ) : (
              /* Start Route */
              <button
                onClick={handleStartRoute}
                disabled={isStarting}
                className={cn(
                  "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card-sm",
                  "bg-green font-body text-xl font-semibold text-text-inverse shadow-md",
                  "transition-all duration-fast hover:bg-green/90 hover:shadow-lg",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isStarting ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <>
                    <Play className="h-7 w-7" />
                    <span>Start Today&apos;s Route</span>
                  </>
                )}
              </button>
            )
          ) : (
            /* No Route */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-tertiary">
                <Package className="h-10 w-10 text-text-muted" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
                No Route Today
              </h2>
              <p className="mt-1 font-body text-text-muted">
                Check back when a route is assigned.
              </p>
            </div>
          )}
        </m.div>
      </div>
    </div>
  );
}
