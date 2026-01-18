"use client";

import { useRouter } from "next/navigation";
import { Star, TrendingUp, Calendar } from "lucide-react";
import { RouteCard } from "./RouteCard";
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
  const router = useRouter();
  const greeting = getGreeting();
  const firstName = driver.fullName?.split(" ")[0] ?? "Driver";

  const handleStartRoute = () => {
    router.push("/driver/route");
  };

  const handleContinueRoute = () => {
    router.push("/driver/route");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-[var(--color-lotus)]/30">
      <div className="px-4 py-6">
        {/* Greeting Section */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
            {greeting}, {firstName}
          </h1>
          <p className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </div>

        {/* Today's Route Card */}
        <RouteCard
          route={todayRoute}
          dateDisplay={dateDisplay}
          dayOfWeek={dayOfWeek}
          onStartRoute={handleStartRoute}
          onContinueRoute={handleContinueRoute}
        />

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-jade-light)]">
                <TrendingUp className="h-5 w-5 text-[var(--color-jade)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {driver.deliveriesCount}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">Deliveries</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-saffron-light)]">
                <Star className="h-5 w-5 text-[var(--color-saffron)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {driver.ratingAvg.toFixed(1)}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
