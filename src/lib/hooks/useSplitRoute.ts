import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseSplitRouteOptions {
  onSuccess: (newRouteId: string) => void;
}

export function useSplitRoute({ onSuccess }: UseSplitRouteOptions) {
  const [isSplitting, setIsSplitting] = useState(false);

  const splitRoute = useCallback(
    async (routeId: string, stopIds: string[], driverId?: string) => {
      if (stopIds.length === 0) {
        toast({ message: "Select at least one stop", type: "error" });
        return;
      }

      setIsSplitting(true);
      try {
        const body: Record<string, unknown> = { stopIds };
        if (driverId) {
          body.driverId = driverId;
        }

        const response = await fetch(`/api/admin/routes/${routeId}/split`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json();
          toast({
            message: data.error || "Failed to split route",
            type: "error",
          });
          return;
        }

        const data = await response.json();
        toast({
          message: "Route split successfully. View new route to assign a driver.",
          type: "success",
        });
        onSuccess(data.newRouteId);
      } catch {
        toast({ message: "Failed to split route", type: "error" });
      } finally {
        setIsSplitting(false);
      }
    },
    [onSuccess]
  );

  return { splitRoute, isSplitting };
}
