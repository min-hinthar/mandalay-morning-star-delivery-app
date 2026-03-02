/**
 * DriverHomeSwitch - Client wrapper that conditionally renders
 * SimpleHome or DriverDashboard based on simple mode state.
 */

"use client";

import { useSimpleMode } from "@/components/ui/driver/SimpleModeProvider";
import { SimpleHome } from "@/components/ui/driver/SimpleHome";
import { DriverDashboard } from "@/components/ui/driver/DriverDashboard";
import type { RoutesRow, VehicleType } from "@/types/driver";

interface DriverHomeData {
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
    licensePlate: string | null;
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
  nextRouteDate: string | null;
  streakDays: number;
  todayEarningsCents: number;
  weeklyEarningsCents: number;
  badges: { id: string; name: string; icon: string; earnedAt: string }[];
  dayOfWeek: string;
  dateDisplay: string;
}

export function DriverHomeSwitch(data: DriverHomeData) {
  const { isSimpleMode } = useSimpleMode();

  if (isSimpleMode) {
    return (
      <SimpleHome
        driverName={data.driver.fullName}
        todayRoute={data.todayRoute}
        dayOfWeek={data.dayOfWeek}
        dateDisplay={data.dateDisplay}
      />
    );
  }

  return <DriverDashboard {...data} />;
}
