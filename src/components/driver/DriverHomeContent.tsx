/**
 * V6 Driver Home Content - Pepper Aesthetic
 *
 * Main driver home content with V6 colors, typography, and high-contrast support.
 * Features greeting, route card, and stats display.
 */

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-gradient-to-b from-v6-surface-primary to-v6-surface-tertiary/30">
      <div className="px-4 py-6">
        {/* Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-v6-display text-2xl font-bold text-v6-text-primary">
            {greeting}, {firstName}
          </h1>
          <p className="flex items-center gap-1.5 font-v6-body text-v6-text-muted">
            <Calendar className="h-4 w-4" />
            {dayOfWeek}, {dateDisplay}
          </p>
        </motion.div>

        {/* Today's Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RouteCard
            route={todayRoute}
            dateDisplay={dateDisplay}
            dayOfWeek={dayOfWeek}
            onStartRoute={handleStartRoute}
            onContinueRoute={handleContinueRoute}
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          {/* Deliveries Card */}
          <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-surface-primary p-4 shadow-v6-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-v6-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v6-green/10">
                <TrendingUp className="h-5 w-5 text-v6-green" />
              </div>
              <div>
                <p className="font-v6-display text-2xl font-bold text-v6-text-primary">
                  {driver.deliveriesCount}
                </p>
                <p className="font-v6-body text-sm text-v6-text-muted">Deliveries</p>
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-surface-primary p-4 shadow-v6-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-v6-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v6-primary/10">
                <Star className="h-5 w-5 text-v6-primary fill-v6-primary" />
              </div>
              <div>
                <p className="font-v6-display text-2xl font-bold text-v6-text-primary">
                  {driver.ratingAvg.toFixed(1)}
                </p>
                <p className="font-v6-body text-sm text-v6-text-muted">Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
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
