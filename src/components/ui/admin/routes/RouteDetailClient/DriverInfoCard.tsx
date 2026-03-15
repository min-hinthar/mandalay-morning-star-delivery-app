"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { User, Phone, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/admin/settings/ConfirmDialog";
import { isDriverAvailable } from "@/lib/availability";
import type { RouteDetailResponse, DriverOption } from "./types";

interface DriverInfoCardProps {
  route: RouteDetailResponse;
  drivers: DriverOption[];
  isUpdating: boolean;
  onDriverChange: (driverId: string) => void;
  showConfirmation?: boolean;
  onConfirmReassign?: () => void;
  onCancelReassign?: () => void;
  isReassigning?: boolean;
  pendingDriverId?: string | null;
}

export function DriverInfoCard({
  route,
  drivers,
  isUpdating,
  onDriverChange,
  showConfirmation = false,
  onConfirmReassign,
  onCancelReassign,
  isReassigning = false,
  pendingDriverId,
}: DriverInfoCardProps) {
  const pendingDriverName =
    pendingDriverId
      ? drivers.find((d) => d.id === pendingDriverId)?.fullName ?? "selected driver"
      : "selected driver";

  const deliveredCount = route.stops.filter(
    (s) => s.status === "delivered" || s.status === "skipped",
  ).length;
  const totalCount = route.stops.length;

  return (
    <>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-secondary rounded-card-sm border border-border p-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10 flex items-center justify-center">
              {route.driver ? (
                route.driver.profileImageUrl ? (
                  <Image
                    src={route.driver.profileImageUrl}
                    alt={route.driver.fullName || "Driver"}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-interactive-primary">
                    {route.driver.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "DR"}
                  </span>
                )
              ) : (
                <User className="h-6 w-6 text-text-muted" />
              )}
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {route.driver?.fullName || "Unassigned"}
              </p>
              {route.driver && (
                <div className="flex items-center gap-3 mt-1">
                  {route.driver.phone && (
                    <>
                      <a
                        href={`tel:${route.driver.phone}`}
                        className="flex items-center gap-1 text-sm text-interactive-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={`sms:${route.driver.phone}`}
                        className="flex items-center gap-1 text-sm text-interactive-primary hover:underline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        SMS
                      </a>
                    </>
                  )}
                  <span className="text-sm text-text-secondary">
                    {route.driver.deliveriesCount} deliveries
                  </span>
                </div>
              )}
            </div>
          </div>

          <Select
            value={route.driver?.id || "unassigned"}
            onValueChange={(value) => onDriverChange(value === "unassigned" ? "" : value)}
            disabled={isUpdating || isReassigning || route.status === "completed"}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {drivers.map((driver) => {
                const available = isDriverAvailable(
                  driver.availability ?? null,
                  route.deliveryDate,
                );
                const label = driver.fullName || driver.userId.slice(0, 8);
                const displayLabel = available ? label : `${label} (Unavailable)`;
                return (
                  <SelectItem key={driver.id} value={driver.id}>
                    {displayLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </m.div>

      {onConfirmReassign && onCancelReassign && (
        <ConfirmDialog
          open={showConfirmation}
          title="Reassign Driver"
          description={`${route.driver?.fullName ?? "Current driver"} is currently delivering this route (${deliveredCount}/${totalCount} stops done). Reassign to ${pendingDriverName}?`}
          confirmLabel="Reassign"
          confirmVariant="primary"
          onConfirm={onConfirmReassign}
          onCancel={onCancelReassign}
          isLoading={isReassigning}
        />
      )}
    </>
  );
}
