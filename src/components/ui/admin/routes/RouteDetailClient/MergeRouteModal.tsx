"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMergeRoutes } from "@/lib/hooks/useMergeRoutes";

interface AvailableRouteOption {
  id: string;
  driverName: string | null;
  stopCount: number;
  status: string;
}

interface MergeRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  availableRoutes: AvailableRouteOption[];
  onSuccess: (totalStops: number) => void;
  onOptimize: () => void;
}

export function MergeRouteModal({
  open,
  onOpenChange,
  routeId,
  availableRoutes,
  onSuccess,
  onOptimize,
}: MergeRouteModalProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  const { mergeRoutes, isMerging } = useMergeRoutes({
    onSuccess: (totalStops) => {
      onOpenChange(false);
      setSelectedRouteId("");
      onSuccess(totalStops);
      onOptimize();
    },
  });

  const handleConfirm = () => {
    if (!selectedRouteId) return;
    mergeRoutes(routeId, selectedRouteId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Route</DialogTitle>
          <DialogDescription>
            Select a route to merge into this one. The selected route will be deleted and its stops
            appended.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableRoutes.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">
              No same-date planned routes available to merge.
            </p>
          ) : (
            availableRoutes.map((route) => (
              <label
                key={route.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRouteId === route.id
                    ? "border-interactive-primary bg-interactive-primary-light"
                    : "border-border hover:bg-surface-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="merge-route"
                  value={route.id}
                  checked={selectedRouteId === route.id}
                  onChange={() => setSelectedRouteId(route.id)}
                  className="accent-interactive-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      #{route.id.slice(0, 8)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {route.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {route.driverName || "No driver"} &middot; {route.stopCount} stop
                    {route.stopCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMerging}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isMerging || !selectedRouteId}>
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Merging...
              </>
            ) : (
              "Merge Route"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
