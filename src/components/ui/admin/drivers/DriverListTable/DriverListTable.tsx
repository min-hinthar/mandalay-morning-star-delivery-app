"use client";

import { useState } from "react";
import { m } from "framer-motion";
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
import { DriverMobileCard } from "./DriverMobileCard";
import { VehicleIcon, VEHICLE_LABELS } from "./types";
import type { DriverListTableProps, SortField, SortDirection } from "./types";

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

  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.fullName?.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query)
    );
  });

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
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
      <m.div
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
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card-sm border border-border bg-surface-primary shadow-sm overflow-hidden"
    >
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
                        <div className="h-10 w-10 rounded-full bg-gradient-avatar flex items-center justify-center text-text-inverse font-display text-sm shadow-sm">
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
                        <span className="text-text-muted text-sm font-body">Not set</span>
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
                        <span className="text-text-muted text-sm font-body">{"\u2014"}</span>
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

      <DriverMobileCard
        drivers={sortedDrivers}
        togglingDriverId={togglingDriverId}
        onToggleActive={handleToggleActive}
        onViewDriver={onViewDriver}
      />
    </m.div>
  );
}
