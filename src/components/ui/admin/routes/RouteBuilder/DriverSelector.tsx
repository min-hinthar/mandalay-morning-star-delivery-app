"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { isDriverAvailable } from "@/lib/availability";
import type { DriverAvailability } from "@/lib/availability";

// ============================================
// TYPES
// ============================================

export interface DriverApiResponse {
  id: string;
  fullName: string | null;
  vehicleType: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  ratingAvg: number;
  deliveriesCount: number;
  availability: DriverAvailability | null;
}

interface DriverSelectorProps {
  drivers: DriverApiResponse[];
  selectedDriverId: string | null;
  onSelect: (id: string | null) => void;
  deliveryDate: string;
}

// ============================================
// AVATAR HELPERS
// ============================================

function DriverAvatar({ driver }: { driver: DriverApiResponse }) {
  if (driver.profileImageUrl) {
    return (
      <Image
        src={driver.profileImageUrl}
        alt={driver.fullName ?? "Driver"}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = (driver.fullName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal font-semibold text-sm">
      {initials}
    </div>
  );
}

// ============================================
// DRIVER CARD
// ============================================

function DriverCard({
  driver,
  isSelected,
  isAvailable,
  unavailableReason,
  onSelect,
}: {
  driver: DriverApiResponse;
  isSelected: boolean;
  isAvailable: boolean;
  unavailableReason: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl p-3 border transition-all",
        isSelected
          ? "border-accent-teal bg-accent-teal/5 ring-2 ring-accent-teal"
          : "border-border bg-surface-primary hover:bg-surface-secondary",
        !isAvailable && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <DriverAvatar driver={driver} />
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-primary",
              isAvailable ? "bg-green-500" : "bg-text-muted"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {driver.fullName ?? "Unknown driver"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {driver.vehicleType && (
              <span className="text-xs text-text-muted capitalize">{driver.vehicleType}</span>
            )}
            <span className="text-text-muted text-xs">·</span>
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="text-xs text-text-muted">{driver.ratingAvg.toFixed(1)}</span>
          </div>
          {!isAvailable && unavailableReason && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{unavailableReason}</p>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DriverSelector({
  drivers,
  selectedDriverId,
  onSelect,
  deliveryDate,
}: DriverSelectorProps) {
  const driversWithAvailability = drivers.map((driver) => {
    const available = isDriverAvailable(driver.availability, deliveryDate);
    return { driver, available };
  });

  // Sort: available first, then unavailable
  const sorted = [...driversWithAvailability].sort((a, b) => {
    if (a.available === b.available) return 0;
    return a.available ? -1 : 1;
  });

  if (drivers.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-4 rounded-xl border border-dashed border-border">
        No drivers found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Assign Driver</p>
        {selectedDriverId && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {sorted.map(({ driver, available }) => {
          // Compute unavailable reason via simple check
          let unavailableReason: string | null = null;
          if (!driver.isActive) {
            unavailableReason = "Inactive";
          } else if (!available) {
            unavailableReason = "Unavailable on this date";
          }

          return (
            <DriverCard
              key={driver.id}
              driver={driver}
              isSelected={selectedDriverId === driver.id}
              isAvailable={available && driver.isActive}
              unavailableReason={unavailableReason}
              onSelect={() => onSelect(selectedDriverId === driver.id ? null : driver.id)}
            />
          );
        })}
      </div>

      <p className="text-xs text-text-muted">
        Route can be created without a driver and assigned later.
      </p>
    </div>
  );
}
