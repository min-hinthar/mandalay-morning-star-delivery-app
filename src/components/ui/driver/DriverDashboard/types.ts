import type { VehicleType, RouteStatus } from "@/types/driver";

export interface DriverDashboardProps {
  /** Driver information */
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
  /** Today's route information */
  todayRoute: {
    id: string;
    status: RouteStatus;
    stopCount: number;
    deliveredCount: number;
    pendingCount: number;
    totalDurationMinutes: number | null;
    startedAt: string | null;
  } | null;
  /** Current streak days */
  streakDays?: number;
  /** Weekly earnings in cents */
  weeklyEarningsCents?: number;
  /** Badges earned */
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  /** Day of week display */
  dayOfWeek: string;
  /** Date display string */
  dateDisplay: string;
  /** Callback to start route */
  onStartRoute?: () => void;
  /** Callback to continue route */
  onContinueRoute?: () => void;
  /** Additional className */
  className?: string;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
