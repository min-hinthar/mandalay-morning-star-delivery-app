/**
 * V8 Active Route View - Driver Polish
 *
 * Active route display with teal progress bar, AnimatedValue count,
 * staggered stop list entry, and premium animations.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Play, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDriverReorderStops } from "@/lib/hooks/useDriverReorderStops";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";
import {
  DragReorderList,
  SortableItem,
  DragHandle,
  MoveButtons,
} from "@/components/ui/DragReorderList";
import { StopList } from "./StopList";
import { StopCard } from "./StopCard";
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

export function ActiveRouteView({ routeId, routeStatus, stops }: ActiveRouteViewProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isFullMotion, shouldAnimate, getSpring } = useAnimationPreference();

  // Local stops state for optimistic reorder
  const [localStops, setLocalStops] = useState(stops);
  useEffect(() => {
    setLocalStops(stops);
  }, [stops]);

  // Drag reorder hook
  const { reorderStops, isReordering } = useDriverReorderStops({
    routeId,
    onError: () => setLocalStops(stops), // Revert on error
  });

  // Split stops into reorderable (pending/enroute) and locked (delivered/skipped)
  const reorderableStops = localStops.filter(
    (s) => s.status === "pending" || s.status === "enroute"
  );
  const lockedStops = localStops.filter((s) => s.status === "delivered" || s.status === "skipped");

  // Reorder is available on accepted and in_progress routes
  const canReorder = routeStatus === "accepted" || routeStatus === "in_progress";

  // Calculate current stop index (first pending or enroute stop)
  const currentStopIndex =
    localStops.find((s) => s.status === "enroute")?.stopIndex ??
    localStops.find((s) => s.status === "pending")?.stopIndex ??
    0;

  // Calculate progress
  const deliveredCount = localStops.filter((s) => s.status === "delivered").length;
  const skippedCount = localStops.filter((s) => s.status === "skipped").length;
  const completedCount = deliveredCount + skippedCount;
  const totalCount = localStops.length;
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
    <m.div
      className={cn(
        "space-y-4",
        isFullMotion && routeStatus === "in_progress" && "shadow-glow-primary"
      )}
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      transition={getSpring(spring.default)}
    >
      {/* Progress Bar */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="mb-2 flex justify-between font-body text-sm">
          <span className="font-medium text-text-primary">Progress</span>
          <span className="text-text-secondary">
            {completedCount}/{totalCount} stops
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={
              isFullMotion ? { type: "spring", stiffness: 80, damping: 20 } : { duration: 0.3 }
            }
            className="h-full rounded-full bg-accent-teal"
          />
        </div>
        <p className="mt-2 font-body text-xs text-text-secondary">
          <AnimatedValue
            value={completedCount}
            format="number"
            className="font-semibold text-accent-teal"
          />{" "}
          of {totalCount} stops completed
        </p>
        {deliveredCount > 0 && skippedCount > 0 && (
          <div className="mt-1 flex gap-4 font-body text-xs text-text-muted">
            <span>{deliveredCount} delivered</span>
            <span>{skippedCount} skipped</span>
          </div>
        )}
      </m.div>

      {/* Start Route Button (for planned and accepted routes) */}
      {(routeStatus === "planned" || routeStatus === "accepted") && (
        <m.button
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
        </m.button>
      )}

      {/* Complete Route Button (when all stops done) */}
      {routeStatus === "in_progress" && canComplete && (
        <m.button
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
        </m.button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-center font-body text-sm text-status-error" role="alert">
          {error}
        </p>
      )}

      {/* Stop List - with drag reorder for reorderable stops */}
      {canReorder && reorderableStops.length > 0 ? (
        <div className="space-y-4">
          {/* Reorderable stops */}
          <DragReorderList
            items={reorderableStops}
            getItemId={(stop) => stop.id}
            disabled={isReordering}
            onReorder={(reordered) => {
              const newOrder = [...reordered, ...lockedStops];
              setLocalStops(newOrder);
              reorderStops(reordered.map((s, i) => ({ stopId: s.id, stopIndex: i })));
            }}
            renderItem={(stop, isDragging) => (
              <SortableItem id={stop.id}>
                {({ listeners, attributes }) => (
                  <div className={cn("flex items-center gap-2", isDragging && "opacity-50")}>
                    <DragHandle listeners={listeners} attributes={attributes} />
                    <div className="min-w-0 flex-1">
                      <StopCard
                        stopIndex={stop.stopIndex}
                        status={stop.status}
                        customerName={stop.order.customer.fullName}
                        address={stop.order.address}
                        timeWindow={{
                          start: stop.order.deliveryWindowStart,
                          end: stop.order.deliveryWindowEnd,
                        }}
                        eta={stop.eta}
                        isCurrentStop={stop.stopIndex === currentStopIndex}
                        onClick={() => router.push(`/driver/route/${stop.id}`)}
                      />
                    </div>
                    <MoveButtons
                      onMoveUp={() => {
                        const idx = reorderableStops.findIndex((s) => s.id === stop.id);
                        if (idx <= 0) return;
                        const reordered = [...reorderableStops];
                        [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
                        const newOrder = [...reordered, ...lockedStops];
                        setLocalStops(newOrder);
                        reorderStops(reordered.map((s, i) => ({ stopId: s.id, stopIndex: i })));
                      }}
                      onMoveDown={() => {
                        const idx = reorderableStops.findIndex((s) => s.id === stop.id);
                        if (idx >= reorderableStops.length - 1) return;
                        const reordered = [...reorderableStops];
                        [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
                        const newOrder = [...reordered, ...lockedStops];
                        setLocalStops(newOrder);
                        reorderStops(reordered.map((s, i) => ({ stopId: s.id, stopIndex: i })));
                      }}
                      isFirst={reorderableStops.findIndex((s) => s.id === stop.id) === 0}
                      isLast={
                        reorderableStops.findIndex((s) => s.id === stop.id) ===
                        reorderableStops.length - 1
                      }
                    />
                  </div>
                )}
              </SortableItem>
            )}
            renderOverlay={(stop) => (
              <div className="scale-[1.02] shadow-lg rounded-xl">
                <StopCard
                  stopIndex={stop.stopIndex}
                  status={stop.status}
                  customerName={stop.order.customer.fullName}
                  address={stop.order.address}
                  timeWindow={{
                    start: stop.order.deliveryWindowStart,
                    end: stop.order.deliveryWindowEnd,
                  }}
                  eta={stop.eta}
                  isCurrentStop={stop.stopIndex === currentStopIndex}
                />
              </div>
            )}
          />

          {/* Locked stops (delivered/skipped) -- not draggable, visually muted */}
          {lockedStops.length > 0 && (
            <div className="space-y-2 opacity-50">
              <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted">
                Completed ({lockedStops.length})
              </h3>
              {lockedStops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stopIndex={stop.stopIndex}
                  status={stop.status}
                  customerName={stop.order.customer.fullName}
                  address={stop.order.address}
                  timeWindow={{
                    start: stop.order.deliveryWindowStart,
                    end: stop.order.deliveryWindowEnd,
                  }}
                  eta={stop.eta}
                  onClick={() => router.push(`/driver/route/${stop.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <StopList stops={localStops} currentStopIndex={currentStopIndex} />
      )}
    </m.div>
  );
}
