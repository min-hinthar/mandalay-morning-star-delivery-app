"use client";

import { Scissors, GitMerge, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RouteStatus } from "@/types/driver";

interface RouteActionsMenuProps {
  routeStatus: RouteStatus;
  pendingStopCount: number;
  hasSameDatePlannedRoutes: boolean;
  onSplit: () => void;
  onMerge: () => void;
  onDelete: () => void;
}

export function RouteActionsMenu({
  routeStatus,
  pendingStopCount,
  hasSameDatePlannedRoutes,
  onSplit,
  onMerge,
  onDelete,
}: RouteActionsMenuProps) {
  const showSplit = routeStatus !== "completed" && pendingStopCount > 1;
  const showMerge = routeStatus !== "completed" && hasSameDatePlannedRoutes;
  const showDelete = routeStatus !== "in_progress" && routeStatus !== "completed";

  // Don't render trigger if no items would show
  if (!showSplit && !showMerge && !showDelete) {
    return null;
  }

  const hasSeparator = (showSplit || showMerge) && showDelete;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Route actions">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showSplit && (
          <DropdownMenuItem onClick={onSplit} className="cursor-pointer gap-2">
            <Scissors className="h-4 w-4" />
            Split Route
          </DropdownMenuItem>
        )}
        {showMerge && (
          <DropdownMenuItem onClick={onMerge} className="cursor-pointer gap-2">
            <GitMerge className="h-4 w-4" />
            Merge Route
          </DropdownMenuItem>
        )}
        {hasSeparator && <DropdownMenuSeparator />}
        {showDelete && (
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete Route
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
