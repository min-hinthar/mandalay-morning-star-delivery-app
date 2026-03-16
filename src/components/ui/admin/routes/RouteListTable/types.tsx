import { Play, CheckCircle2, Clock, UserCheck, ThumbsUp } from "lucide-react";
import type { RouteStatus } from "@/types/driver";

export interface AdminRoute {
  id: string;
  deliveryDate: string;
  driver: {
    id: string;
    fullName: string | null;
  } | null;
  status: RouteStatus;
  stopCount: number;
  deliveredCount: number;
  completionRate: number;
  createdAt: string;
  estimatedDurationMinutes?: number | null;
}

export interface RouteListTableProps {
  routes: AdminRoute[];
  onViewRoute: (routeId: string) => void;
  onStatusChange: (routeId: string, status: RouteStatus) => Promise<void>;
  onDeleteRoute: (routeId: string) => Promise<void>;
}

export type SortField = "deliveryDate" | "status" | "stopCount" | "completionRate";
export type SortDirection = "asc" | "desc";

export const STATUS_CONFIG: Record<
  RouteStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  assigned: {
    label: "Assigned",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    icon: <UserCheck className="h-3.5 w-3.5" />,
  },
  accepted: {
    label: "Accepted",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
  },
  planned: {
    label: "Planned",
    className: "bg-status-info-bg text-status-info border-status-info/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-interactive-primary-light text-interactive-primary border-interactive-primary/30",
    icon: <Play className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    className: "bg-status-success-bg text-status-success border-status-success/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

export const NEXT_STATUSES: Record<RouteStatus, RouteStatus[]> = {
  assigned: ["planned"],
  accepted: ["in_progress"],
  planned: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};
