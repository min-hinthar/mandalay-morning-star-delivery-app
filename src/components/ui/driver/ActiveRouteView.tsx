/**
 * V6 Active Route View - Pepper Aesthetic
 *
 * Active route display with progress, start/complete buttons, and stop list.
 * V6 colors, typography, and high-contrast support.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StopList } from "./StopList";
import { LocationTracker } from "./LocationTracker";
import type { RouteStopStatus } from "@/types/driver";

interface StopData {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  eta: string | null;
  order: {
    id: string;
    deliveryWindowStart: string | null;
    deliveryWindowEnd: string | null;
    customer: {
      fullName: string | null;
    };
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
    };
  };
}

interface ActiveRouteViewProps {
  routeId: string;
  routeStatus: string;
  stops: StopData[];
}

export function ActiveRouteView({
  routeId,
  routeStatus,
  stops,
}: ActiveRouteViewProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate current stop index (first pending or enroute stop)
  const currentStopIndex =
    stops.find((s) => s.status === "enroute")?.stopIndex ??
    stops.find((s) => s.status === "pending")?.stopIndex ??
    0;

  // Calculate progress
  const deliveredCount = stops.filter((s) => s.status === "delivered").length;
  const skippedCount = stops.filter((s) => s.status === "skipped").length;
  const completedCount = deliveredCount + skippedCount;
  const totalCount = stops.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Check if route can be completed (all stops delivered or skipped)
  const canComplete = totalCount > 0 && completedCount === totalCount;

  const handleStartRoute = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/driver/routes/${routeId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start route");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteRoute = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/driver/routes/${routeId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete route");
      }

      router.push("/driver?completed=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="mb-2 flex justify-between font-body text-sm">
          <span className="font-medium text-text-primary">Progress</span>
          <span className="text-text-secondary">
            {completedCount}/{totalCount} stops
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-tertiary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-green"
          />
        </div>
        {deliveredCount > 0 && skippedCount > 0 && (
          <div className="mt-2 flex gap-4 font-body text-xs text-text-secondary">
            <span>{deliveredCount} delivered</span>
            <span>{skippedCount} skipped</span>
          </div>
        )}
      </motion.div>

      {/* Location Tracker (when route in progress) */}
      {routeStatus === "in_progress" && (
        <LocationTracker
          routeId={routeId}
          enabled={true}
          showDetails={false}
        />
      )}

      {/* Start Route Button (for planned routes) */}
      {routeStatus === "planned" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleStartRoute}
          disabled={isStarting}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-3 rounded-card-sm font-body font-semibold",
            "bg-green text-text-inverse shadow-sm",
            "transition-all duration-fast hover:bg-green/90 hover:shadow-md",
            "active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isStarting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Play className="h-6 w-6" />
              <span>Start Route</span>
            </>
          )}
        </motion.button>
      )}

      {/* Complete Route Button (when all stops done) */}
      {routeStatus === "in_progress" && canComplete && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCompleteRoute}
          disabled={isCompleting}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-3 rounded-card-sm font-body font-semibold",
            "bg-green text-text-inverse shadow-sm",
            "transition-all duration-fast hover:bg-green/90 hover:shadow-md",
            "active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isCompleting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-6 w-6" />
              <span>Complete Route</span>
            </>
          )}
        </motion.button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-center font-body text-sm text-status-error" role="alert">
          {error}
        </p>
      )}

      {/* Stop List */}
      <StopList
        stops={stops}
        currentStopIndex={currentStopIndex}
      />
    </div>
  );
}
