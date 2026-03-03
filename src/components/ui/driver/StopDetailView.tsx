/**
 * V8 Stop Detail View - Driver Polish
 *
 * Premium animated stop detail with:
 * - Status transition animation (scale/fade via AnimatePresence)
 * - Horizontal timeline step sequence with animated dots
 * - Cascading section reveals (0.1s increments)
 * - Map marker pulse for active stops
 * - Offline-aware photo capture
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { StopDetail } from "./StopDetail";
import { ExceptionModal } from "./ExceptionModal";
import { PhotoCapture } from "./PhotoCapture";
import type { RouteStopStatus } from "@/types/driver";

// ============================================
// TYPES
// ============================================

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
}

interface StopDetailViewProps {
  routeId: string;
  stopId: string;
  stopIndex: number;
  totalStops: number;
  status: RouteStopStatus;
  customer: {
    fullName: string | null;
    phone: string | null;
  };
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  timeWindow: {
    start: string | null;
    end: string | null;
  };
  deliveryNotes: string | null;
  orderItems: OrderItem[];
}

// ============================================
// TIMELINE STEP SEQUENCE
// ============================================

const STATUS_FLOW: RouteStopStatus[] = ["pending", "enroute", "arrived", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  enroute: "En Route",
  arrived: "Arrived",
  delivered: "Delivered",
};

function getStatusIndex(status: RouteStopStatus): number {
  const idx = STATUS_FLOW.indexOf(status);
  return idx >= 0 ? idx : -1;
}

function TimelineStepSequence({
  status,
  shouldAnimate,
  isFullMotion,
}: {
  status: RouteStopStatus;
  shouldAnimate: boolean;
  isFullMotion: boolean;
}) {
  const currentIdx = getStatusIndex(status);
  // If skipped, show all steps as gray
  const isSkipped = status === "skipped";

  return (
    <div className="flex items-center justify-between px-2">
      {STATUS_FLOW.map((step, idx) => {
        const isCompleted = !isSkipped && idx < currentIdx;
        const isCurrent = !isSkipped && idx === currentIdx;
        const isFuture = isSkipped || idx > currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1">
              <m.div
                initial={shouldAnimate && isCompleted ? { scale: 0 } : undefined}
                animate={shouldAnimate ? { scale: 1 } : undefined}
                transition={
                  shouldAnimate
                    ? { type: "spring", stiffness: 300, damping: 20, delay: idx * 0.1 }
                    : undefined
                }
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-colors",
                  isCompleted && "h-6 w-6 bg-green",
                  isCurrent && "h-7 w-7 bg-accent-teal",
                  isFuture && "h-5 w-5 border-2 border-border bg-surface-tertiary"
                )}
              >
                {isCompleted && <Check className="h-3.5 w-3.5 text-text-inverse" strokeWidth={3} />}
                {isCurrent && isFullMotion && (
                  <m.span
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.5, repeat: 3 }}
                    className="absolute inset-0 rounded-full bg-accent-teal"
                  />
                )}
                {isCurrent && <span className="relative h-2 w-2 rounded-full bg-surface-primary" />}
              </m.div>
              <span
                className={cn(
                  "font-body text-2xs font-medium",
                  isCompleted && "text-green",
                  isCurrent && "text-accent-teal",
                  isFuture && "text-text-muted"
                )}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>

            {/* Connecting line */}
            {idx < STATUS_FLOW.length - 1 && (
              <div className="flex-1 mx-1 h-0.5 rounded-full overflow-hidden bg-border">
                {shouldAnimate && (isCompleted || isCurrent) ? (
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, delay: idx * 0.15 }}
                    className={cn(
                      "h-full rounded-full",
                      isCompleted ? "bg-green" : "bg-accent-teal"
                    )}
                  />
                ) : (
                  (isCompleted || isCurrent) && (
                    <div
                      className={cn(
                        "h-full w-full rounded-full",
                        isCompleted ? "bg-green" : "bg-accent-teal"
                      )}
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// MAP MARKER PULSE (uses existing pulse-ring keyframe from globals.css)
// ============================================

const ACTIVE_STOP_STATUSES = new Set<RouteStopStatus>(["pending", "enroute", "arrived"]);

function MapMarkerPulse() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute h-3 w-3 rounded-full bg-accent-teal animate-[pulse-ring_1.5s_ease-out_3]" />
      <span className="relative h-3 w-3 rounded-full bg-accent-teal" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StopDetailView({
  routeId,
  stopId,
  stopIndex,
  totalStops,
  status,
  customer,
  address,
  timeWindow,
  deliveryNotes,
  orderItems,
}: StopDetailViewProps) {
  const router = useRouter();
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RouteStopStatus>(status);
  const { isFullMotion, shouldAnimate, getSpring } = useAnimationPreference();
  const { queuePhoto } = useOfflineSync({
    onDrain: () => router.refresh(),
  });

  const handleStatusChange = (newStatus: RouteStopStatus) => {
    setCurrentStatus(newStatus);
    router.refresh();
  };

  const handleExceptionSuccess = () => {
    setCurrentStatus("skipped");
    router.push("/driver/route");
    router.refresh();
  };

  const handlePhotoUpload = useCallback(
    async (blob: Blob) => {
      try {
        if (!navigator.onLine) {
          await queuePhoto(routeId, stopId, blob);
          setHasPhoto(true);
          return;
        }

        const formData = new FormData();
        formData.append("photo", blob, "delivery-photo.jpg");

        const response = await fetch(`/api/driver/routes/${routeId}/stops/${stopId}/photo`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          if (response.status >= 500) {
            await queuePhoto(routeId, stopId, blob);
            setHasPhoto(true);
            return;
          }
          throw new Error("Failed to upload photo");
        }

        setHasPhoto(true);
      } catch (err) {
        if (err instanceof TypeError) {
          await queuePhoto(routeId, stopId, blob);
          setHasPhoto(true);
          return;
        }
        throw err;
      }
    },
    [routeId, stopId, queuePhoto]
  );

  const handlePhotoCapture = useCallback(() => {
    setIsPhotoCaptureOpen(false);
  }, []);

  const canTakePhoto = currentStatus === "arrived";
  const showMarkerPulse = isFullMotion && ACTIVE_STOP_STATUSES.has(currentStatus);

  return (
    <>
      {/* Timeline Step Sequence */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className="mb-4 rounded-xl bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-body text-sm font-semibold text-text-primary">
            Delivery Progress
          </span>
          {showMarkerPulse && <MapMarkerPulse />}
        </div>
        <TimelineStepSequence
          status={currentStatus}
          shouldAnimate={shouldAnimate}
          isFullMotion={isFullMotion}
        />
      </m.div>

      {/* Status Transition Animation */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.1 }}
        className="mb-4"
      >
        <AnimatePresence mode="wait">
          <m.div
            key={currentStatus}
            initial={shouldAnimate ? { opacity: 0, scale: 1.2 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
            transition={getSpring(spring.default)}
          />
        </AnimatePresence>
      </m.div>

      {/* Cascading section reveals */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...getSpring(spring.default), delay: 0.1 }}
      >
        <StopDetail
          routeId={routeId}
          stopId={stopId}
          stopIndex={stopIndex}
          totalStops={totalStops}
          status={currentStatus}
          customer={customer}
          address={address}
          timeWindow={timeWindow}
          deliveryNotes={deliveryNotes}
          orderItems={orderItems}
          onStatusChange={handleStatusChange}
          onException={() => setIsExceptionModalOpen(true)}
          photoRequired={canTakePhoto && !hasPhoto}
          onPhotoPrompt={() => setIsPhotoCaptureOpen(true)}
        />
      </m.div>

      {/* Photo capture button (when arrived) */}
      {canTakePhoto && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.4 }}
        >
          <button
            onClick={() => setIsPhotoCaptureOpen(true)}
            className={cn(
              "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-card-sm",
              "font-body font-medium transition-all duration-fast",
              hasPhoto
                ? "border-2 border-green bg-green/10 text-green"
                : "bg-primary text-text-inverse shadow-md hover:bg-primary-hover"
            )}
          >
            <Camera className="h-5 w-5" />
            <span>{hasPhoto ? "Photo Added" : "Take Delivery Photo"}</span>
          </button>
        </m.div>
      )}

      <ExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        routeId={routeId}
        stopId={stopId}
        onSuccess={handleExceptionSuccess}
      />

      <PhotoCapture
        isOpen={isPhotoCaptureOpen}
        onClose={() => setIsPhotoCaptureOpen(false)}
        onCapture={handlePhotoCapture}
        onUpload={handlePhotoUpload}
        title="Delivery Photo"
      />
    </>
  );
}
