import type {
  RouteStatus,
  DriverListItem,
  StopDetail,
  RouteStats,
  DriverAvailability,
} from "@/types/driver";

export interface RouteDetailResponse {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  optimizedPolyline: string | null;
  stats: RouteStats | null;
  startedAt: string | null;
  completedAt: string | null;
  driver: DriverListItem | null;
  stops: StopDetail[];
}

export interface DriverOption {
  id: string;
  userId: string;
  fullName: string | null;
  isActive: boolean;
  availability?: DriverAvailability | null;
}

export { type RouteStatus, type RouteStopStatus } from "@/types/driver";
