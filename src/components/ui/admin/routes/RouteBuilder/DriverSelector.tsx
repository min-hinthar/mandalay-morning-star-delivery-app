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
  ratingAvg: number | null;
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

/**
 * Three states, not two. `isDriverAvailable` returns TRUE for an empty
 * `available_days` ("no restrictions = available all days"), which is the DB
 * default — so a two-state green/grey dot confidently marked every
 * freshly-onboarded driver as available, and a reason gated on `!isAvailable`
 * never rendered for exactly the case this component needs to explain.
 * "We haven't heard from them" is its own state.
 */
type AvailabilityState = "available" | "unknown" | "unavailable";

const DOT_CLASS: Record<AvailabilityState, string> = {
  available: "bg-green-500",
  unknown: "bg-amber-500",
  unavailable: "bg-text-muted",
};

function DriverCard({
  driver,
  state,
  isSelected,
  isSelectable,
  unavailableReason,
  onSelect,
}: {
  driver: DriverApiResponse;
  state: AvailabilityState;
  isSelected: boolean;
  /**
   * Only a DEACTIVATED driver is a hard block. A driver who simply has no
   * schedule set, or isn't down for this date, stays selectable — the admin
   * often knows they're working. Disabling every "unavailable" card would make
   * assignment impossible whenever schedules are unset, which is the DB default
   * (availability_json starts with an empty available_days and only the
   * driver's own schedule screen fills it in).
   */
  isSelectable: boolean;
  unavailableReason: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!isSelectable}
      aria-label={
        unavailableReason
          ? `${driver.fullName ?? "Driver"} — ${unavailableReason}`
          : (driver.fullName ?? "Driver")
      }
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl p-3 border transition-all",
        isSelected
          ? "border-accent-teal bg-accent-teal/5 ring-2 ring-accent-teal"
          : "border-border bg-surface-primary hover:bg-surface-secondary",
        // Dim only what's genuinely unavailable. An unset schedule is missing
        // information, not a negative — dimming those would grey out the whole
        // list on a fleet that has never filled schedules in.
        state === "unavailable" && "opacity-60",
        !isSelectable && "cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <DriverAvatar driver={driver} />
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-primary",
              DOT_CLASS[state]
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
            <span className="text-xs text-text-muted">
              {driver.ratingAvg !== null ? driver.ratingAvg.toFixed(1) : "—"}
            </span>
          </div>
          {unavailableReason && (
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
    // "No schedule set" is not the same as "declined this date" — the former is
    // the DB default and says nothing about the driver.
    const hasSchedule = (driver.availability?.available_days?.length ?? 0) > 0;
    const blockedToday = driver.availability?.blocked_dates?.includes(deliveryDate) ?? false;
    const available = isDriverAvailable(driver.availability, deliveryDate);

    let state: AvailabilityState = "available";
    let unavailableReason: string | null = null;
    if (!driver.isActive) {
      state = "unavailable";
      unavailableReason = "Inactive";
    } else if (blockedToday) {
      // Checked BEFORE the unset-schedule case: a block on this exact date is
      // the most specific thing the driver has told us, and it holds whether or
      // not they ever set weekly availability. Ordering it after `hasSchedule`
      // reported "Schedule not set" for a driver who had explicitly declined —
      // the same dishonesty this component is fixing, just inverted.
      state = "unavailable";
      unavailableReason = "Blocked this date";
    } else if (!hasSchedule) {
      state = "unknown";
      unavailableReason = "Schedule not set";
    } else if (!available) {
      state = "unavailable";
      unavailableReason = "Unavailable on this date";
    }

    return { driver, state, unavailableReason };
  });

  // Sort: confirmed available first, unknown next, unavailable last.
  const STATE_RANK: Record<AvailabilityState, number> = {
    available: 0,
    unknown: 1,
    unavailable: 2,
  };
  const sorted = [...driversWithAvailability].sort(
    (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state]
  );

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
        {sorted.map(({ driver, state, unavailableReason }) => (
          <DriverCard
            key={driver.id}
            driver={driver}
            state={state}
            isSelected={selectedDriverId === driver.id}
            isSelectable={driver.isActive}
            unavailableReason={unavailableReason}
            onSelect={() => onSelect(selectedDriverId === driver.id ? null : driver.id)}
          />
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Route can be created without a driver and assigned later.
      </p>
    </div>
  );
}
