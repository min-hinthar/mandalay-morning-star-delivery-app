/**
 * V6 Stop Detail View - Pepper Aesthetic
 *
 * Full stop detail view with customer info, address, order items, and actions.
 * V6 colors, typography, and high-contrast support.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { StopDetail } from "./StopDetail";
import { ExceptionModal } from "./ExceptionModal";
import { PhotoCapture } from "./PhotoCapture";
import { cn } from "@/lib/utils/cn";
import type { RouteStopStatus } from "@/types/driver";

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

  const handleStatusChange = (newStatus: RouteStopStatus) => {
    setCurrentStatus(newStatus);
    // Refresh the page to get updated data
    router.refresh();
  };

  const handleExceptionSuccess = () => {
    setCurrentStatus("skipped");
    // Navigate back to route list
    router.push("/driver/route");
    router.refresh();
  };

  const handlePhotoUpload = useCallback(
    async (blob: Blob) => {
      const formData = new FormData();
      formData.append("photo", blob, "delivery-photo.jpg");

      const response = await fetch(
        `/api/driver/routes/${routeId}/stops/${stopId}/photo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      setHasPhoto(true);
    },
    [routeId, stopId]
  );

  const handlePhotoCapture = useCallback(() => {
    // Photo captured and uploaded successfully
    setIsPhotoCaptureOpen(false);
  }, []);

  // Show photo button only when arrived but not yet delivered
  const canTakePhoto = currentStatus === "arrived";

  return (
    <>
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
      />

      {/* Photo capture button (when arrived) */}
      {canTakePhoto && (
        <button
          onClick={() => setIsPhotoCaptureOpen(true)}
          className={cn(
            "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-v6-card-sm",
            "border-2 font-v6-body font-medium transition-all duration-v6-fast",
            hasPhoto
              ? "border-v6-green bg-v6-green/10 text-v6-green"
              : "border-v6-border bg-v6-surface-primary text-v6-text-primary hover:border-v6-text-muted"
          )}
        >
          <Camera className="h-5 w-5" />
          <span>{hasPhoto ? "Photo Added" : "Add Photo (Optional)"}</span>
        </button>
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
