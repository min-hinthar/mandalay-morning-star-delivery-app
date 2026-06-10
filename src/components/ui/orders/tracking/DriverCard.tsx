/**
 * Driver Card — After Dark warm-paper card with driver + delivery progress.
 */

"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { Phone, Car, Bike, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VehicleType } from "@/types/driver";
import { Button } from "@/components/ui/button";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { useTilt } from "@/components/ui/homepage/Hero/interactions";
import { GoldLeaf } from "@/components/ui/GoldLeaf";

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

export function DriverCard({ driver, stopProgress, onContactDriver, className }: DriverCardProps) {
  // Gentle pointer tilt (kit tactile pass). Small 3° swing + no preserve-3d so
  // the "Call" tel button stays put under the cursor (menu-card gotcha respected).
  const tilt = useTilt(3);
  const displayName = driver.fullName || "Your Driver";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const progressPercent =
    stopProgress.totalStops > 0 ? (stopProgress.currentStop / stopProgress.totalStops) * 100 : 0;

  const handleContact = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    if (driver.phone) {
      window.location.href = `tel:${driver.phone}`;
    }
    onContactDriver?.();
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("hero-surface-paper relative overflow-hidden rounded-2xl p-4", className)}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <HeroCardLayers accent="blue" radius="rounded-2xl" />
      {/* Gold-leaf flecks + lacquer sheen (kit) */}
      <GoldLeaf radius="rounded-2xl" />

      <div className="relative flex items-start gap-4">
        {/* Driver Avatar */}
        <div className="relative">
          {driver.profileImageUrl ? (
            <Image
              src={driver.profileImageUrl}
              alt={displayName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-hero-blue/30"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full bg-hero-blue/12 ring-2 ring-hero-blue/25",
              driver.profileImageUrl && "hidden"
            )}
          >
            <span className="text-lg font-semibold text-hero-ink">{initials}</span>
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hero-sage/70 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-hero-card-strong bg-hero-sage" />
          </span>
        </div>

        {/* Driver Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-hero-ink">{displayName}</h3>

          {driver.vehicleType && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-hero-ink/5 px-2 py-0.5 text-xs text-hero-ink-muted">
              {vehicleIcons[driver.vehicleType]}
              <span>{vehicleLabels[driver.vehicleType]}</span>
            </div>
          )}

          {/* Stop Progress */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-hero-ink-muted">
              <span>
                Delivery progress
                <span className="ml-1 font-burmese" lang="my">
                  · ပို့ဆောင်မှု
                </span>
              </span>
              <span className="font-medium text-hero-ink">
                Stop {stopProgress.currentStop} of {stopProgress.totalStops}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hero-ink/10">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-hero-clay to-hero-sage"
              />
            </div>
          </div>
        </div>

        {/* Call Driver */}
        {driver.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleContact}
            className="shrink-0 gap-1.5 rounded-full border-hero-blue/30 hover:border-hero-blue/50 hover:bg-hero-blue/10"
            aria-label="Call driver"
          >
            <Phone className="h-4 w-4 text-hero-blue" />
            <span className="text-xs font-medium text-hero-ink">Call</span>
          </Button>
        )}
      </div>
    </m.div>
  );
}

/** Skeleton placeholder for DriverCard */
export function DriverCardSkeleton() {
  return (
    <div className="hero-surface-paper relative overflow-hidden rounded-2xl p-4">
      <div className="flex animate-pulse items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-hero-ink/10" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-hero-ink/10" />
          <div className="h-4 w-20 rounded bg-hero-ink/10" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-hero-ink/10" />
        </div>
      </div>
    </div>
  );
}
