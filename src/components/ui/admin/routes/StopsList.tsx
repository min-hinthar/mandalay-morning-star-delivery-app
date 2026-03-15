"use client";

import type { MutableRefObject } from "react";
import { m } from "framer-motion";
import { Package } from "lucide-react";
import { RouteStopCard } from "./RouteStopCard";
import {
  DragReorderList,
  SortableItem,
  DragHandle,
  MoveButtons,
} from "@/components/ui/DragReorderList";
import { Button } from "@/components/ui/button";
import type { RouteStopStatus, StopDetail, RouteStatus } from "@/types/driver";
import { StopCardContent } from "./RouteStopCard/StopCardContent";
import { selectAllStops, deselectAllStops } from "./route-selection-utils";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
}

interface StopsListProps {
  stops: StopDetail[];
  routeStatus: RouteStatus;
  onStatusChange: (stopId: string, status: RouteStopStatus) => void;
  onRemoveStop: (stopId: string) => void;
  stopRefs?: MutableRefObject<Record<string, HTMLDivElement | null>>;
  availableRoutes?: AvailableRoute[];
  onReassign?: (stopId: string, targetRouteId: string) => void;
  onReorder: (stops: StopDetail[]) => void;
  onMoveStop: (stopId: string, direction: "up" | "down") => void;
  disabled: boolean;
  selectionMode?: boolean;
  selectedStopIds?: Set<string>;
  onToggleSelect?: (stopId: string) => void;
  onSelectionChange?: (ids: Set<string>) => void;
}

function isStopDraggable(stop: StopDetail, routeStatus: RouteStatus): boolean {
  if (routeStatus === "completed") return false;
  if (routeStatus === "in_progress") return stop.status === "pending";
  return true;
}

export function StopsList({
  stops,
  routeStatus,
  onStatusChange,
  onRemoveStop,
  stopRefs,
  availableRoutes,
  onReassign,
  onReorder,
  onMoveStop,
  disabled,
  selectionMode,
  selectedStopIds,
  onToggleSelect,
  onSelectionChange,
}: StopsListProps) {
  const sortedStops = [...stops].sort((a, b) => a.stopIndex - b.stopIndex);
  const selectedCount = selectedStopIds?.size ?? 0;

  const handleSelectAll = () => {
    onSelectionChange?.(selectAllStops(sortedStops, routeStatus));
  };

  const handleDeselectAll = () => {
    onSelectionChange?.(deselectAllStops());
  };

  if (sortedStops.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-gradient-to-br from-surface-secondary to-surface-tertiary rounded-xl border border-border-v5"
      >
        <div className="rounded-full bg-interactive-primary-light w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-interactive-primary" />
        </div>
        <h2 className="text-xl font-display text-text-primary mb-2">No stops in this route</h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Add orders to this route to create delivery stops.
        </p>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-text-primary">Stops ({sortedStops.length})</h2>
        {selectionMode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">{selectedCount} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectedCount > 0 ? handleDeselectAll : handleSelectAll}
            >
              {selectedCount > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>
        )}
      </div>

      {selectionMode ? (
        <div className="space-y-3">
          {sortedStops.map((stop, index) => {
            const isSelectable = routeStatus !== "in_progress" || stop.status === "pending";
            return (
              <RouteStopCard
                key={stop.id}
                stop={stop}
                index={index}
                routeStatus={routeStatus}
                onStatusChange={onStatusChange}
                onRemoveStop={onRemoveStop}
                selectionMode
                selected={selectedStopIds?.has(stop.id) ?? false}
                onToggleSelect={onToggleSelect}
                selectionDisabled={!isSelectable}
              />
            );
          })}
        </div>
      ) : (
        <DragReorderList
          items={sortedStops}
          onReorder={onReorder}
          getItemId={(stop) => stop.id}
          disabled={disabled}
          renderItem={(stop) => {
            const index = sortedStops.indexOf(stop);
            const draggable = isStopDraggable(stop, routeStatus);

            return (
              <SortableItem id={stop.id} disabled={!draggable}>
                {({ listeners, attributes }) => (
                  <div
                    ref={(el) => {
                      if (stopRefs) {
                        stopRefs.current[stop.id] = el;
                      }
                    }}
                  >
                    <RouteStopCard
                      stop={stop}
                      index={index}
                      routeStatus={routeStatus}
                      onStatusChange={onStatusChange}
                      onRemoveStop={onRemoveStop}
                      availableRoutes={availableRoutes}
                      onReassign={onReassign}
                      dragHandle={
                        draggable ? (
                          <DragHandle listeners={listeners} attributes={attributes} />
                        ) : undefined
                      }
                      moveButtons={
                        draggable ? (
                          <MoveButtons
                            onMoveUp={() => onMoveStop(stop.id, "up")}
                            onMoveDown={() => onMoveStop(stop.id, "down")}
                            isFirst={index === 0}
                            isLast={index === sortedStops.length - 1}
                          />
                        ) : undefined
                      }
                    />
                  </div>
                )}
              </SortableItem>
            );
          }}
          renderOverlay={(stop) => (
            <div className="opacity-80 shadow-lg ring-2 ring-interactive-primary rounded-xl bg-surface-primary p-4">
              <StopCardContent stop={stop} index={sortedStops.indexOf(stop)} />
            </div>
          )}
        />
      )}
    </m.div>
  );
}
