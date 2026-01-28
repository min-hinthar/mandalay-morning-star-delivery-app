/**
 * V2 Sprint 3: Driver Card Component
 *
 * Shows driver information and delivery progress.
 * Includes contact button when driver is out for delivery.
 */

"use client";

import { motion } from "framer-motion";
import { Phone, Car, Bike, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VehicleType } from "@/types/driver";
import { Button } from "@/components/ui/button";

interface DriverCardProps {
  driver: {
    fullName: string | null;
    profileImageUrl: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
  };
  stopProgress: {
    currentStop: number;
    totalStops: number;
  };
  onContactDriver?: () => void;
  className?: string;
}

const vehicleIcons: Record<VehicleType, React.ReactNode> = {
  car: <Car className="h-4 w-4" />,
  motorcycle: <Bike className="h-4 w-4" />,
  bicycle: <Bike className="h-4 w-4" />,
  van: <Truck className="h-4 w-4" />,
  truck: <Truck className="h-4 w-4" />,
};

const vehicleLabels: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  van: "Van",
  truck: "Truck",
};

export function DriverCard({
  driver,
  stopProgress,
  onContactDriver,
  className,
}: DriverCardProps) {
  const displayName = driver.fullName || "Your Driver";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const progressPercent =
    stopProgress.totalStops > 0
      ? (stopProgress.currentStop / stopProgress.totalStops) * 100
      : 0;

  const handleContact = () => {
    if (driver.phone) {
      window.location.href = `tel:${driver.phone}`;
    }
    onContactDriver?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl bg-surface-primary p-4 shadow-warm-sm",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Driver Avatar */}
        <div className="relative">
          {driver.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={driver.profileImageUrl}
              alt={displayName}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-jade-100"
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
            />
          ) : null}
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-full bg-jade-100 ring-2 ring-jade-200", driver.profileImageUrl && "hidden")}>
            <span className="text-lg font-semibold text-jade-700">
              {initials}
            </span>
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-jade-500" />
          </span>
        </div>

        {/* Driver Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-charcoal truncate">
            {displayName}
          </h3>

          {/* Vehicle Type Badge */}
          {driver.vehicleType && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-charcoal-100 px-2 py-0.5 text-xs text-charcoal-600">
              {vehicleIcons[driver.vehicleType]}
              <span>{vehicleLabels[driver.vehicleType]}</span>
            </div>
          )}

          {/* Stop Progress */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-charcoal-500">
              <span>Delivery progress</span>
              <span className="font-medium">
                Stop {stopProgress.currentStop} of {stopProgress.totalStops}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-charcoal-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-jade-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Button */}
        {driver.phone && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleContact}
            className="shrink-0 h-10 w-10 rounded-full border-jade-200 hover:bg-jade-50 hover:border-jade-300"
            aria-label="Call driver"
          >
            <Phone className="h-4 w-4 text-jade-600" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Skeleton placeholder for DriverCard
 */
export function DriverCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface-primary p-4 shadow-warm-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-charcoal-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-charcoal-200" />
          <div className="h-4 w-20 rounded bg-charcoal-200" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-charcoal-200" />
        </div>
      </div>
    </div>
  );
}
