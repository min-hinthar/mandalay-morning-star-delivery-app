import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";
import type { StopDetail, RouteStatus } from "@/types/driver";

interface UseReorderStopsOptions {
  routeId: string;
  routeStatus: RouteStatus;
  onSuccess: () => void;
  onError: (previousStops: StopDetail[]) => void;
}

export function useReorderStops({
  routeId,
  routeStatus,
  onSuccess,
  onError,
}: UseReorderStopsOptions) {
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = useCallback(
    async (reorderedStops: StopDetail[], previousStops: StopDetail[]) => {
      setIsReordering(true);

      const stopOrder = reorderedStops.map((stop, index) => ({
        stopId: stop.id,
        stopIndex: index,
      }));

      const body: Record<string, unknown> = { stopOrder };
      if (routeStatus === "in_progress") {
        body.forceOverride = true;
      }

      try {
        const response = await fetch(`/api/admin/routes/${routeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          onError(previousStops);
          toast({ message: "Failed to reorder stops", type: "error" });
          return;
        }

        onSuccess();
      } catch {
        onError(previousStops);
        toast({ message: "Failed to reorder stops", type: "error" });
      } finally {
        setIsReordering(false);
      }
    },
    [routeId, routeStatus, onSuccess, onError]
  );

  return { handleReorder, isReordering };
}
