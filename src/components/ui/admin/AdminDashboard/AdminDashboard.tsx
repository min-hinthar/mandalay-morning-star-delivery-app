"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Package, Truck, AlertTriangle, RefreshCw, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, celebration } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { KPICard } from "./KPICard";
import { KPISkeleton } from "./KPISkeleton";
import { QuickStat } from "./QuickStat";
import type { AdminDashboardProps } from "./types";

export function AdminDashboard({
  kpis,
  loading = false,
  refreshing = false,
  onRefresh,
  className,
}: AdminDashboardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [goalCelebration, setGoalCelebration] = useState(false);
  const goalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (goalTimeoutRef.current) clearTimeout(goalTimeoutRef.current);
    };
  }, []);

  const handleGoalReached = useCallback(() => {
    setGoalCelebration(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }
    if (goalTimeoutRef.current) clearTimeout(goalTimeoutRef.current);
    goalTimeoutRef.current = setTimeout(() => setGoalCelebration(false), 3000);
  }, []);

  const ordersToday = kpis.find((k) => k.icon === "orders")?.value || 0;
  const activeDrivers = kpis.find((k) => k.icon === "drivers")?.value || 0;
  const exceptionsCount = kpis.find((k) => k.icon === "exceptions")?.value || 0;

  return (
    <div className={cn("space-y-6", className)}>
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <m.div
            animate={shouldAnimate ? { rotate: [0, 5, -5, 0] } : undefined}
            transition={{ duration: 2, repeat: 5, repeatDelay: 3 }}
          >
            <Zap className="w-6 h-6 text-secondary" />
          </m.div>
          <h2 className="text-xl font-bold text-text-primary">Dashboard Overview</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <QuickStat
            label="orders today"
            value={ordersToday}
            icon={<Package className="w-4 h-4 text-accent-teal" />}
          />
          <QuickStat
            label="active drivers"
            value={activeDrivers}
            icon={<Truck className="w-4 h-4 text-green" />}
            pulse
          />
          {exceptionsCount > 0 && (
            <QuickStat
              label="exceptions"
              value={exceptionsCount}
              icon={<AlertTriangle className="w-4 h-4 text-status-error" />}
            />
          )}

          {onRefresh && (
            <m.button
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              onClick={onRefresh}
              disabled={refreshing}
              className={cn(
                "p-2 rounded-lg",
                "bg-surface-secondary hover:bg-surface-tertiary",
                "text-text-secondary hover:text-text-primary",
                "transition-colors",
                "disabled:opacity-50"
              )}
            >
              <m.div
                animate={refreshing && shouldAnimate ? { rotate: 360 } : undefined}
                transition={{ duration: 1, repeat: 5, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4" />
              </m.div>
            </m.button>
          )}
        </div>
      </m.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </div>
      ) : (
        <m.div
          variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map((kpi, index) => (
            <KPICard
              key={kpi.id}
              data={kpi}
              index={index}
              refreshing={refreshing}
              onGoalReached={handleGoalReached}
            />
          ))}
        </m.div>
      )}

      <AnimatePresence>
        {goalCelebration && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
          >
            <m.div
              variants={celebration.badge}
              initial="initial"
              animate="animate"
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-green text-text-inverse shadow-2xl"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Goal Reached!</span>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
