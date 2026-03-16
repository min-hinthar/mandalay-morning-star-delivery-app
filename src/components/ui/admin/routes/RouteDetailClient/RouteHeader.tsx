"use client";

import { m } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  Plus,
  UserCheck,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RouteStatus } from "@/types/driver";
import type { RouteDetailResponse } from "./types";
import { RouteActionsMenu } from "./RouteActionsMenu";

const STATUS_CONFIG: Record<
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

interface RouteHeaderProps {
  route: RouteDetailResponse;
  routeId: string;
  isUpdating: boolean;
  isManuallyReordered: boolean;
  onStatusChange: (status: RouteStatus) => void;
  onOptimize: () => void;
  onAddStops: () => void;
  onRefresh: () => void;
  onBack: () => void;
  pendingStopCount: number;
  hasSameDatePlannedRoutes: boolean;
  onSplit: () => void;
  onMerge: () => void;
  onDelete: () => void;
}

export { STATUS_CONFIG };

export function RouteHeader({
  route,
  routeId,
  isUpdating,
  isManuallyReordered,
  onStatusChange,
  onOptimize,
  onAddStops,
  onRefresh,
  onBack,
  pendingStopCount,
  hasSameDatePlannedRoutes,
  onSplit,
  onMerge,
  onDelete,
}: RouteHeaderProps) {
  const statusConfig = STATUS_CONFIG[route.status];

  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to routes">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display text-text-primary">Route Details</h1>
            <Badge className={cn(statusConfig.className, "gap-1.5 border")}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {format(parseISO(route.deliveryDate), "EEEE, MMMM d, yyyy")} • #{routeId.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={route.status}
          onValueChange={(value) => onStatusChange(value as RouteStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {route.status === "planned" && (
          <Button variant="outline" onClick={onAddStops} leftIcon={<Plus className="h-4 w-4" />}>
            Add Stops
          </Button>
        )}

        {route.status === "planned" && route.stops.length > 1 && (
          <Button variant="outline" onClick={onOptimize} leftIcon={<Zap className="h-4 w-4" />}>
            Optimize
          </Button>
        )}

        {isManuallyReordered && route.status === "planned" && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30 gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Not optimized
          </Badge>
        )}

        <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh route">
          <RefreshCw className={cn("h-5 w-5", isUpdating && "animate-spin")} />
        </Button>

        <RouteActionsMenu
          routeStatus={route.status}
          pendingStopCount={pendingStopCount}
          hasSameDatePlannedRoutes={hasSameDatePlannedRoutes}
          onSplit={onSplit}
          onMerge={onMerge}
          onDelete={onDelete}
        />
      </div>
    </m.div>
  );
}
