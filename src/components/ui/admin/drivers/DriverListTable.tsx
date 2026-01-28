/**
 * V6 Driver List Table - Pepper Aesthetic
 *
 * Admin driver management table with V6 colors, typography, and spring animations.
 * Features desktop table view and mobile card view with expandable rows.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  UserX,
  UserCheck,
  Star,
  Phone,
  Mail,
  Truck,
  Car,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExpandableTableRow,
  DriverPreviewPanel,
  useExpandedRows,
} from "@/components/ui/admin/ExpandableTableRow";
import type { VehicleType } from "@/types/driver";

export interface AdminDriver {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  isActive: boolean;
  ratingAvg: number | null;
  deliveriesCount: number;
  createdAt: string;
}

interface DriverListTableProps {
  drivers: AdminDriver[];
  onToggleActive: (driverId: string, isActive: boolean) => Promise<void>;
  onViewDriver: (driverId: string) => void;
  searchQuery: string;
}

type SortField = "fullName" | "ratingAvg" | "deliveriesCount" | "createdAt";
type SortDirection = "asc" | "desc";

const VehicleIcon = ({ type }: { type: VehicleType | null }) => {
  switch (type) {
    case "car":
      return <Car className="h-4 w-4" />;
    case "motorcycle":
      return <Bike className="h-4 w-4" />;
    case "bicycle":
      return <Bike className="h-4 w-4" />;
    case "van":
    case "truck":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4 text-muted-foreground" />;
  }
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  van: "Van",
  truck: "Truck",
};

export function DriverListTable({
  drivers,
  onToggleActive,
  onViewDriver,
  searchQuery,
}: DriverListTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [togglingDriverId, setTogglingDriverId] = useState<string | null>(null);
  const { isExpanded, handleExpandChange } = useExpandedRows();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter drivers by search query
  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.fullName?.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query)
    );
  });

  // Sort drivers
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "fullName":
        comparison = (a.fullName || "").localeCompare(b.fullName || "");
        break;
      case "ratingAvg":
        comparison = (a.ratingAvg || 0) - (b.ratingAvg || 0);
        break;
      case "deliveriesCount":
        comparison = a.deliveriesCount - b.deliveriesCount;
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleToggleActive = async (driverId: string, currentActive: boolean) => {
    setTogglingDriverId(driverId);
    try {
      await onToggleActive(driverId, !currentActive);
    } finally {
      setTogglingDriverId(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline text-primary" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline text-primary" />
    );
  };

  if (filteredDrivers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border"
      >
        <div className="rounded-full bg-primary-light w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Truck className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
          {searchQuery ? "No drivers found" : "No drivers yet"}
        </h2>
        <p className="text-text-secondary font-body max-w-md mx-auto">
          {searchQuery
            ? `No drivers match "${searchQuery}". Try a different search term.`
            : "Add your first driver to start managing your delivery fleet."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card-sm border border-border bg-surface-primary shadow-sm overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-secondary hover:bg-surface-tertiary">
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors duration-fast font-display"
                onClick={() => handleSort("fullName")}
              >
                Driver
                <SortIcon field="fullName" />
              </TableHead>
              <TableHead className="font-display">Contact</TableHead>
              <TableHead className="font-display">Vehicle</TableHead>
              <TableHead className="text-center font-display">Status</TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors duration-fast text-center font-display"
                onClick={() => handleSort("ratingAvg")}
              >
                Rating
                <SortIcon field="ratingAvg" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors duration-fast text-center font-display"
                onClick={() => handleSort("deliveriesCount")}
              >
                Deliveries
                <SortIcon field="deliveriesCount" />
              </TableHead>
              <TableHead className="w-[80px] font-display">Actions</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Note: Removed AnimatePresence - ExpandableTableRow returns Fragment which can't accept animation props */}
              {sortedDrivers.map((driver) => {
                const isToggling = togglingDriverId === driver.id;

                return (
                  <ExpandableTableRow
                    key={driver.id}
                    id={driver.id}
                    isExpanded={isExpanded(driver.id)}
                    onExpandChange={handleExpandChange}
                    colSpan={7}
                    className={cn(!driver.isActive && "bg-surface-tertiary/50")}
                    previewContent={
                      <DriverPreviewPanel
                        email={driver.email}
                        phone={driver.phone || undefined}
                        vehicleInfo={driver.vehicleType ? VEHICLE_LABELS[driver.vehicleType] : undefined}
                        licensePlate={driver.licensePlate || undefined}
                        recentDeliveries={driver.deliveriesCount}
                        rating={driver.ratingAvg || undefined}
                        detailsLink={`/admin/drivers/${driver.id}`}
                      />
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-text-inverse font-display text-sm shadow-sm">
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
                          <p className="text-xs text-text-secondary font-mono">
                            ID: {driver.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[180px]">{driver.email}</span>
                        </div>
                        {driver.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.vehicleType ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-input bg-green/10 text-green">
                            <VehicleIcon type={driver.vehicleType} />
                          </div>
                          <div>
                            <p className="text-sm font-body font-medium text-text-primary">
                              {VEHICLE_LABELS[driver.vehicleType]}
                            </p>
                            {driver.licensePlate && (
                              <p className="text-xs text-text-secondary font-mono">
                                {driver.licensePlate}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm font-body">
                          Not set
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "transition-all duration-fast cursor-pointer",
                          driver.isActive
                            ? "bg-green/10 text-green hover:bg-green/20 border border-green/20"
                            : "bg-surface-tertiary text-text-secondary hover:bg-surface-secondary border border-border"
                        )}
                        onClick={() => handleToggleActive(driver.id, driver.isActive)}
                      >
                        {isToggling ? (
                          <span className="animate-pulse">...</span>
                        ) : driver.isActive ? (
                          "Active"
                        ) : (
                          "Inactive"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {driver.ratingAvg !== null ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-light">
                          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                          <span className="text-sm font-body font-medium text-text-primary">
                            {driver.ratingAvg.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm font-body">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full bg-secondary/10">
                        <span className="text-sm font-body font-semibold text-secondary-hover">
                          {driver.deliveriesCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onViewDriver(driver.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(driver.id, driver.isActive)}
                            className={cn(
                              "cursor-pointer",
                              driver.isActive
                                ? "text-status-error focus:text-status-error"
                                : "text-green focus:text-green"
                            )}
                          >
                            {driver.isActive ? (
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
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </ExpandableTableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border/50">
        <AnimatePresence>
          {sortedDrivers.map((driver, index) => {
            const isToggling = togglingDriverId === driver.id;

            return (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 hover:bg-primary-light/50 transition-colors duration-fast",
                  !driver.isActive && "bg-surface-tertiary/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-text-inverse font-display shadow-sm">
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
                  <Badge
                    className={cn(
                      "shrink-0",
                      driver.isActive
                        ? "bg-green/10 text-green border border-green/20"
                        : "bg-surface-tertiary text-text-secondary border border-border"
                    )}
                    onClick={() => handleToggleActive(driver.id, driver.isActive)}
                  >
                    {isToggling ? "..." : driver.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
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
                      {driver.ratingAvg?.toFixed(1) || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-hover">
                    <Truck className="h-4 w-4" />
                    <span className="font-body font-medium">{driver.deliveriesCount} deliveries</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-primary/30 text-primary hover:bg-primary-light"
                    onClick={() => onViewDriver(driver.id)}
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
                    onClick={() => handleToggleActive(driver.id, driver.isActive)}
                  >
                    {driver.isActive ? (
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
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
