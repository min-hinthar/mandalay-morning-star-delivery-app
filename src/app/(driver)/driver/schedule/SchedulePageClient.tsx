"use client";

import { useState, useMemo, useCallback } from "react";
import { m } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks";
import { DayOfWeekPills, BlockedDateChips } from "@/components/ui/driver/AvailabilityPicker";
import { HistorySummaryCard } from "@/components/ui/driver/DriverDashboard/HistorySummaryCard";
import type { HistoryRouteData } from "@/components/ui/driver/DriverDashboard/HistorySummaryCard";
import type { DayOfWeek, DriverAvailability } from "@/types/driver";

interface SchedulePageClientProps {
  routes: HistoryRouteData[];
  availability: DriverAvailability | null;
}

const dateHeaderFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

export function SchedulePageClient({ routes, availability }: SchedulePageClientProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Availability state (interactive -- driver can change days here)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(availability?.available_days ?? []);
  const [blockedDates, setBlockedDates] = useState<string[]>(availability?.blocked_dates ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const handleDaysChange = useCallback(
    async (days: DayOfWeek[]) => {
      setSelectedDays(days);
      setIsSaving(true);
      try {
        await fetch("/api/driver/availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            available_days: days,
            blocked_dates: blockedDates,
          }),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [blockedDates]
  );

  const handleBlockedDatesChange = useCallback(
    async (dates: string[]) => {
      setBlockedDates(dates);
      setIsSaving(true);
      try {
        await fetch("/api/driver/availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            available_days: selectedDays,
            blocked_dates: dates,
          }),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedDays]
  );

  // Group routes by date
  const groupedRoutes = useMemo(() => {
    const groups: { date: string; label: string; routes: HistoryRouteData[] }[] = [];
    const seen = new Map<string, number>();

    for (const route of routes) {
      const idx = seen.get(route.date);
      if (idx !== undefined) {
        groups[idx].routes.push(route);
      } else {
        const dateObj = new Date(route.date + "T12:00:00Z");
        groups.push({
          date: route.date,
          label: dateHeaderFormatter.format(dateObj),
          routes: [route],
        });
        seen.set(route.date, groups.length - 1);
      }
    }

    return groups;
  }, [routes]);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-secondary" />
        <h1 className="text-xl font-heading font-bold text-text-primary">Schedule</h1>
      </div>

      {/* Availability Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">Your Available Days</p>
          {isSaving && <span className="text-xs text-text-muted animate-pulse">Saving...</span>}
        </div>
        <DayOfWeekPills selected={selectedDays} onChange={handleDaysChange} />
      </div>

      {/* Blocked Dates */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-secondary">Blocked Dates</p>
        <p className="text-xs text-text-muted">
          Block specific dates when you&apos;re unavailable (vacation, sick, etc.)
        </p>
        <BlockedDateChips dates={blockedDates} onChange={handleBlockedDatesChange} />
      </div>

      {/* Route List */}
      {groupedRoutes.length === 0 ? (
        <div className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border text-center">
          <CalendarDays className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-text-primary mb-1">No upcoming routes</h2>
          <p className="text-sm text-text-secondary">
            Routes will appear here when assigned by admin
          </p>
        </div>
      ) : (
        <m.div
          variants={staggerContainer(0.04, 0.08)}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          className="space-y-5"
        >
          {groupedRoutes.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Day header */}
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                {group.label}
              </h2>

              {/* Routes for this day */}
              <div className="space-y-3">
                {group.routes.map((route, idx) => (
                  <HistorySummaryCard key={route.id} route={route} index={idx} />
                ))}
              </div>
            </div>
          ))}
        </m.div>
      )}
    </div>
  );
}
