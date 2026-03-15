import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";
import type { RouteStatus } from "@/types/driver";

interface UseReassignDriverOptions {
  routeId: string;
  routeStatus: RouteStatus;
  currentDriverName: string | null;
  onSuccess?: () => void;
}

export function useReassignDriver({
  routeId,
  routeStatus,
  onSuccess,
}: UseReassignDriverOptions) {
  const [isReassigning, setIsReassigning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);

  const fireReassign = useCallback(
    async (driverId: string) => {
      setIsReassigning(true);
      try {
        const response = await fetch(`/api/admin/routes/${routeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId }),
        });

        if (!response.ok) {
          toast({ message: "Failed to reassign driver", type: "error" });
          return;
        }

        toast({ message: "Driver reassigned successfully", type: "success" });
        onSuccess?.();
      } catch {
        toast({ message: "Failed to reassign driver", type: "error" });
      } finally {
        setIsReassigning(false);
        setShowConfirmation(false);
        setPendingDriverId(null);
      }
    },
    [routeId, onSuccess],
  );

  const reassignDriver = useCallback(
    async (driverId: string) => {
      if (routeStatus === "in_progress") {
        setPendingDriverId(driverId);
        setShowConfirmation(true);
        return;
      }
      await fireReassign(driverId);
    },
    [routeStatus, fireReassign],
  );

  const confirmReassign = useCallback(async () => {
    if (pendingDriverId) {
      await fireReassign(pendingDriverId);
    }
  }, [pendingDriverId, fireReassign]);

  const cancelReassign = useCallback(() => {
    setShowConfirmation(false);
    setPendingDriverId(null);
  }, []);

  return {
    reassignDriver,
    isReassigning,
    showConfirmation,
    confirmReassign,
    cancelReassign,
    pendingDriverId,
  };
}
