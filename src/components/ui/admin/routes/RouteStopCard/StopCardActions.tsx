"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/admin/settings/ConfirmDialog";
import type { RouteStopStatus, StopDetail, RouteStatus } from "@/types/driver";
import { STOP_STATUS_CONFIG } from "./StopCardContent";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
}

const STOP_STATUSES: RouteStopStatus[] = ["pending", "enroute", "arrived", "delivered", "skipped"];

interface StopCardActionsProps {
  stop: StopDetail;
  routeStatus: RouteStatus;
  onStatusChange: (stopId: string, status: RouteStopStatus) => void;
  onRemoveStop: (stopId: string) => void;
  availableRoutes?: AvailableRoute[];
  onReassign?: (stopId: string, targetRouteId: string) => void;
}

export function StopCardActions({
  stop,
  routeStatus,
  onStatusChange,
  onRemoveStop,
  availableRoutes,
  onReassign,
}: StopCardActionsProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const canRemove = routeStatus === "planned";
  const canReassign = routeStatus === "planned" && availableRoutes && availableRoutes.length > 0;

  return (
    <>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" rightIcon={<ChevronDown className="h-3.5 w-3.5" />}>
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STOP_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onStatusChange(stop.id, status)}
                className={cn("cursor-pointer", status === stop.status && "bg-surface-tertiary")}
              >
                <Badge className={cn(STOP_STATUS_CONFIG[status].className, "border")} size="sm">
                  {STOP_STATUS_CONFIG[status].label}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {canReassign && (
          <>
            <DropdownMenuSeparator className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                  rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                >
                  Reassign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {availableRoutes!.map((route) => (
                  <DropdownMenuItem
                    key={route.id}
                    onClick={() => onReassign?.(stop.id, route.id)}
                    className="cursor-pointer"
                  >
                    {route.driverName ?? "Unassigned"} &mdash; {route.stopCount} stops
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {canRemove && (
          <>
            <DropdownMenuSeparator className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRemoveDialogOpen(true)}
              className="text-status-error hover:text-status-error hover:bg-status-error/10"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Remove
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={removeDialogOpen}
        title="Remove stop from route"
        description="This will return the order to the unassigned pool. The order will need to be re-added to a route before delivery."
        confirmLabel="Remove stop"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={() => {
          setRemoveDialogOpen(false);
          onRemoveStop(stop.id);
        }}
        onCancel={() => setRemoveDialogOpen(false)}
      />
    </>
  );
}
