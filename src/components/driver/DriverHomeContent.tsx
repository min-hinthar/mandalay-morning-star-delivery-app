"use client";

import Link from "next/link";
import { Package, Star, TrendingUp, Clock, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { RoutesRow, VehicleType } from "@/types/driver";

interface DriverHomeContentProps {
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
    profileImageUrl: string | null;
    deliveriesCount: number;
    ratingAvg: number;
  };
  todayRoute: {
    id: string;
    status: RoutesRow["status"];
    stopCount: number;
    deliveredCount: number;
    pendingCount: number;
    totalDurationMinutes: number | null;
    startedAt: string | null;
  } | null;
  dayOfWeek: string;
  dateDisplay: string;
}

export function DriverHomeContent({
  driver,
  todayRoute,
  dayOfWeek,
  dateDisplay,
}: DriverHomeContentProps) {
  const greeting = getGreeting();
  const firstName = driver.fullName?.split(" ")[0] ?? "Driver";

  const completionRate = todayRoute
    ? Math.round((todayRoute.deliveredCount / todayRoute.stopCount) * 100) || 0
    : 0;

  const estimatedHours = todayRoute?.totalDurationMinutes
    ? (todayRoute.totalDurationMinutes / 60).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-lotus/30">
      <div className="px-4 py-6">
        {/* Greeting Section */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-charcoal">
            {greeting}, {firstName}
          </h1>
          <p className="flex items-center gap-1.5 text-charcoal/60">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </div>

        {/* Today's Route Card */}
        <div className="rounded-2xl bg-white p-6 shadow-warm-md">
          {todayRoute ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-charcoal">
                  Today&apos;s Route
                </h2>
                <StatusBadge status={todayRoute.status} />
              </div>

              <div className="mb-4 flex items-center gap-4 text-sm text-charcoal/70">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {todayRoute.stopCount} Stops
                </span>
                {estimatedHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ~{estimatedHours} hrs
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/60">Progress</span>
                  <span className="font-medium text-jade-600">
                    {todayRoute.deliveredCount}/{todayRoute.stopCount} ({completionRate}%)
                  </span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-jade-500 to-jade-400 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                {todayRoute.status === "planned" ? (
                  <Link href={`/driver/route`} className="block">
                    <Button
                      className="h-14 w-full bg-jade-500 text-lg font-semibold hover:bg-jade-600"
                      size="lg"
                    >
                      Start Route
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/driver/route`} className="block">
                    <Button
                      className="h-14 w-full bg-saffron-500 text-lg font-semibold text-white hover:bg-saffron-600"
                      size="lg"
                    >
                      Continue Route
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-charcoal/5">
                <Package className="h-8 w-8 text-charcoal/40" />
              </div>
              <h2 className="mb-1 font-display text-lg font-semibold text-charcoal">
                No Route Today
              </h2>
              <p className="text-sm text-charcoal/60">
                {dayOfWeek === "Saturday"
                  ? "Check back later for route assignment"
                  : "Routes are only scheduled on Saturdays"}
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-warm-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jade-100">
                <TrendingUp className="h-5 w-5 text-jade-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal">
                  {driver.deliveriesCount}
                </p>
                <p className="text-sm text-charcoal/60">Deliveries</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-warm-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100">
                <Star className="h-5 w-5 text-saffron-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal">
                  {driver.ratingAvg.toFixed(1)}
                </p>
                <p className="text-sm text-charcoal/60">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RoutesRow["status"] }) {
  const statusConfig = {
    planned: {
      label: "Ready",
      className: "bg-saffron-100 text-saffron-700",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-jade-100 text-jade-700",
    },
    completed: {
      label: "Completed",
      className: "bg-charcoal/10 text-charcoal/70",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
