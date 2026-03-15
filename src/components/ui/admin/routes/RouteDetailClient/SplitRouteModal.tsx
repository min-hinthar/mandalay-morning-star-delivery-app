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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSplitRoute } from "@/lib/hooks/useSplitRoute";
import type { StopDetail } from "@/types/driver";
import type { DriverOption } from "./types";

interface SplitRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStops: StopDetail[];
  routeId: string;
  drivers: DriverOption[];
  onSuccess: (newRouteId: string) => void;
}

export function SplitRouteModal({
  open,
  onOpenChange,
  selectedStops,
  routeId,
  drivers,
  onSuccess,
}: SplitRouteModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const { splitRoute, isSplitting } = useSplitRoute({
    onSuccess: (newRouteId) => {
      onOpenChange(false);
      setSelectedDriverId("");
      onSuccess(newRouteId);
    },
  });

  const handleConfirm = () => {
    const stopIds = selectedStops.map((s) => s.id);
    splitRoute(routeId, stopIds, selectedDriverId || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Route</DialogTitle>
          <DialogDescription>
            {selectedStops.length} stop{selectedStops.length !== 1 ? "s" : ""} selected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedStops.map((stop, i) => (
              <div
                key={stop.id}
                className="flex items-center gap-2 text-sm p-2 bg-surface-secondary rounded-lg"
              >
                <span className="font-semibold text-text-secondary">#{i + 1}</span>
                <span className="text-text-primary truncate">
                  {stop.order?.customer?.fullName || "Unknown Customer"}
                </span>
                <span className="text-text-secondary text-xs truncate ml-auto">
                  {stop.order?.address
                    ? `${stop.order.address.line1}, ${stop.order.address.city}`
                    : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Assign driver (optional)
            </label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="No driver assigned" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.fullName || "Unnamed Driver"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSplitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSplitting}>
            {isSplitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Splitting...
              </>
            ) : (
              `Split ${selectedStops.length} Stop${selectedStops.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
