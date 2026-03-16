/**
 * DriverHomeSwitch - Client wrapper that conditionally renders
 * SimpleHome or DriverDashboard based on simple mode state.
 */

"use client";

import { useRouter } from "next/navigation";
import { useSimpleMode } from "@/components/ui/driver/SimpleModeProvider";
import { SimpleHome } from "@/components/ui/driver/SimpleHome";
import { DriverDashboard } from "@/components/ui/driver/DriverDashboard";
import { AcceptDeclineCard } from "@/components/ui/driver/AcceptDeclineCard";
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
    areaDescription: string | null;
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
  const router = useRouter();

  // Show accept/decline card when route is assigned (same UI for both modes)
  if (data.todayRoute?.status === "assigned") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-primary to-surface-tertiary/30">
        <div className="px-4 py-8 space-y-8">
          <AcceptDeclineCard
            route={{
              id: data.todayRoute.id,
              status: data.todayRoute.status,
              stopCount: data.todayRoute.stopCount,
              area_description: data.todayRoute.areaDescription,
            }}
            onAccepted={() => router.refresh()}
            onDeclined={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

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
