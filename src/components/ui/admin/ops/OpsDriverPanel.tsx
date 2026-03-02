"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Car, Bike, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cardContainer, cardItem } from "@/components/ui/admin/CardRow";
import { deriveDriverReadiness, type DriverInput, type DriverReadiness } from "./helpers";

// ============================================
// TYPES
// ============================================

interface DriverApiResponse {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: string | null;
  isActive: boolean;
  ratingAvg: number;
  deliveriesCount: number;
  availability: { available_days: string[]; blocked_dates: string[] } | null;
}

// ============================================
// HELPERS
// ============================================

function getVehicleIcon(vehicleType: string | null) {
  switch (vehicleType?.toLowerCase()) {
    case "motorcycle":
    case "bicycle":
      return <Bike className="h-4 w-4" />;
    case "van":
    case "truck":
      return <Truck className="h-4 w-4" />;
    case "car":
    default:
      return <Car className="h-4 w-4" />;
  }
}

function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "N/A";
}

function sortDrivers(drivers: DriverReadiness[]): DriverReadiness[] {
  return [...drivers].sort((a, b) => {
    // Available first, then unavailable
    if (a.isAvailable !== b.isAvailable) {
      return a.isAvailable ? -1 : 1;
    }
    // Within each group, sort by name (nulls last)
    const nameA = a.fullName?.toLowerCase() ?? "\uffff";
    const nameB = b.fullName?.toLowerCase() ?? "\uffff";
    return nameA.localeCompare(nameB);
  });
}

// ============================================
// SKELETON
// ============================================

function DriverPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ml-auto h-4 w-4" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function OpsDriverPanel() {
  const [drivers, setDrivers] = useState<DriverApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDrivers() {
      try {
        const res = await fetch("/api/admin/drivers");
        if (!res.ok) {
          throw new Error(`Failed to fetch drivers: ${res.status}`);
        }
        const json = await res.json();
        const data: DriverApiResponse[] = json.data ?? json;
        if (!cancelled) {
          setDrivers(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load drivers");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchDrivers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter to active drivers and derive readiness
  const readinessData = useMemo(() => {
    const activeDrivers = drivers.filter((d) => d.isActive);
    const today = new Date();
    const readiness = activeDrivers.map((d) => {
      const input: DriverInput = {
        id: d.id,
        fullName: d.fullName,
        vehicleType: d.vehicleType,
        ratingAvg: d.ratingAvg,
        isActive: d.isActive,
        availability: d.availability,
      };
      return deriveDriverReadiness(input, today);
    });
    return sortDrivers(readiness);
  }, [drivers]);

  const availableCount = useMemo(
    () => readinessData.filter((d) => d.isAvailable).length,
    [readinessData]
  );

  return (
    <Card variant="default">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Driver Readiness</CardTitle>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            availableCount > 0
              ? "bg-green-100 text-green-800"
              : "bg-surface-tertiary text-text-muted"
          )}
        >
          {availableCount}/{readinessData.length} available
        </span>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <DriverPanelSkeleton />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : readinessData.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-text-muted">No active drivers</p>
            <Link
              href="/admin/drivers"
              className="mt-1 text-sm font-medium text-accent-teal underline-offset-4 hover:underline"
            >
              Manage drivers
            </Link>
          </div>
        ) : (
          <m.div variants={cardContainer} initial="hidden" animate="visible" className="space-y-2">
            {readinessData.map((driver) => (
              <m.div key={driver.id} variants={cardItem}>
                <Link
                  href={`/admin/drivers/${driver.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                    driver.isAvailable
                      ? "border-green-200 bg-green-50/50 hover:bg-green-50"
                      : "border-border bg-surface-secondary opacity-60 hover:opacity-80"
                  )}
                >
                  {/* Availability indicator */}
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      driver.isAvailable ? "bg-green-500" : "bg-gray-300"
                    )}
                    aria-label={driver.isAvailable ? "Available" : "Unavailable"}
                  />

                  {/* Name */}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      driver.isAvailable
                        ? "font-semibold text-text-primary"
                        : "font-normal text-text-muted"
                    )}
                  >
                    {driver.fullName ?? "Unnamed Driver"}
                  </span>

                  {/* Unavailable reason */}
                  {!driver.isAvailable && driver.unavailableReason && (
                    <span className="hidden text-xs text-text-muted sm:block">
                      {driver.unavailableReason}
                    </span>
                  )}

                  {/* Vehicle type */}
                  <span
                    className="shrink-0 text-text-muted"
                    title={driver.vehicleType ?? "Unknown"}
                  >
                    {getVehicleIcon(driver.vehicleType)}
                  </span>

                  {/* Rating */}
                  <span className="shrink-0 text-xs font-medium tabular-nums text-text-secondary">
                    {formatRating(driver.ratingAvg)}
                  </span>
                </Link>
              </m.div>
            ))}
          </m.div>
        )}
      </CardContent>
    </Card>
  );
}
