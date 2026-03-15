import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseMergeRoutesOptions {
  onSuccess: (totalStops: number) => void;
}

export function useMergeRoutes({ onSuccess }: UseMergeRoutesOptions) {
  const [isMerging, setIsMerging] = useState(false);

  const mergeRoutes = useCallback(
    async (destinationRouteId: string, sourceRouteId: string) => {
      setIsMerging(true);
      try {
        const response = await fetch(
          `/api/admin/routes/${destinationRouteId}/merge`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceRouteId }),
          },
        );

        if (!response.ok) {
          const data = await response.json();
          toast({
            message: data.error || "Failed to merge routes",
            type: "error",
          });
          return;
        }

        const data = await response.json();
        toast({
          message:
            "Routes merged successfully. Route may need reordering.",
          type: "success",
        });
        onSuccess(data.totalStops);
      } catch {
        toast({ message: "Failed to merge routes", type: "error" });
      } finally {
        setIsMerging(false);
      }
    },
    [onSuccess],
  );

  return { mergeRoutes, isMerging };
}
