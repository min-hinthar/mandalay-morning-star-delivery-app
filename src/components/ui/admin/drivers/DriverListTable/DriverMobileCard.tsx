"use client";

import { m, AnimatePresence } from "framer-motion";
import {
  Eye,
  UserX,
  UserCheck,
  Star,
  Phone,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { CardRow } from "@/components/ui/admin/CardRow";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { VehicleIcon, VEHICLE_LABELS } from "./types";
import type { AdminDriver } from "./types";

interface DriverMobileCardProps {
  drivers: AdminDriver[];
  togglingDriverId: string | null;
  onToggleActive: (driverId: string, isActive: boolean) => void;
  onViewDriver: (driverId: string) => void;
}

export function DriverMobileCard({
  drivers,
  togglingDriverId,
  onToggleActive,
  onViewDriver,
}: DriverMobileCardProps) {
  return (
    <div className="md:hidden space-y-2 p-2">
      <AnimatePresence>
        {drivers.map((driver) => {
          const isToggling = togglingDriverId === driver.id;

          return (
            <m.div
              key={driver.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CardRow
                statusTint={driver.isActive ? "bg-green-50/50" : "bg-gray-50/50"}
                onClick={() => onViewDriver(driver.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center font-display text-sm font-semibold shrink-0">
                        {driver.fullName
                          ? driver.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "DR"}
                      </div>
                      <div>
                        <p className="font-body font-medium text-text-primary">
                          {driver.fullName || "Unnamed Driver"}
                        </p>
                        <p className="text-xs font-body text-text-secondary">
                          {driver.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={driver.isActive ? "active" : "inactive"} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-sm font-body text-text-secondary">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                    {driver.vehicleType && (
                      <div className="flex items-center gap-2 text-sm font-body text-text-primary">
                        <VehicleIcon type={driver.vehicleType} />
                        <span>{VEHICLE_LABELS[driver.vehicleType]}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-body">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="text-text-primary">
                        {driver.ratingAvg?.toFixed(1) || "\u2014"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Truck className="h-4 w-4" />
                      <span className="font-body font-medium">{driver.deliveriesCount} deliveries</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-accent-teal/30 text-accent-teal hover:bg-accent-teal/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDriver(driver.id);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1",
                        driver.isActive
                          ? "border-status-error/30 text-status-error hover:bg-status-error/10"
                          : "border-green/30 text-green hover:bg-green/10"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActive(driver.id, driver.isActive);
                      }}
                    >
                      {isToggling ? (
                        "..."
                      ) : driver.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardRow>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
