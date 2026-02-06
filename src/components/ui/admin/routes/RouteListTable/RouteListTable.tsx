"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Trash2,
  MapPin,
  Route,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
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
  RoutePreviewPanel,
  useExpandedRows,
} from "@/components/ui/admin/ExpandableTableRow";
import { RouteMobileCard } from "./RouteMobileCard";
import { STATUS_CONFIG, NEXT_STATUSES } from "./types";
import type { RouteListTableProps, SortField, SortDirection } from "./types";
import type { RouteStatus } from "@/types/driver";

export function RouteListTable({
  routes,
  onViewRoute,
  onStatusChange,
  onDeleteRoute,
}: RouteListTableProps) {
  const [sortField, setSortField] = useState<SortField>("deliveryDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [updatingRouteId, setUpdatingRouteId] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const { isExpanded, handleExpandChange } = useExpandedRows();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "deliveryDate":
        comparison = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "stopCount":
        comparison = a.stopCount - b.stopCount;
        break;
      case "completionRate":
        comparison = a.completionRate - b.completionRate;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleStatusChange = async (routeId: string, status: RouteStatus) => {
    setUpdatingRouteId(routeId);
    try {
      await onStatusChange(routeId, status);
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    setDeletingRouteId(routeId);
    try {
      await onDeleteRoute(routeId);
    } finally {
      setDeletingRouteId(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline text-interactive-primary" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline text-interactive-primary" />
    );
  };

  if (routes.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-gradient-to-br from-surface-secondary to-surface-tertiary rounded-xl border border-border-v5"
      >
        <div className="rounded-full bg-interactive-primary-light w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Route className="h-10 w-10 text-interactive-primary" />
        </div>
        <h2 className="text-xl font-display text-text-primary mb-2">No routes found</h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Create your first delivery route to start managing deliveries.
        </p>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-v5 bg-surface-primary shadow-md overflow-hidden"
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-surface-secondary to-surface-tertiary hover:bg-surface-secondary/80">
              <TableHead
                className="cursor-pointer hover:text-interactive-primary transition-colors font-display"
                onClick={() => handleSort("deliveryDate")}
              >
                Delivery Date
                <SortIcon field="deliveryDate" />
              </TableHead>
              <TableHead className="font-display">Driver</TableHead>
              <TableHead
                className="cursor-pointer hover:text-interactive-primary transition-colors text-center font-display"
                onClick={() => handleSort("stopCount")}
              >
                Stops
                <SortIcon field="stopCount" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-interactive-primary transition-colors font-display"
                onClick={() => handleSort("completionRate")}
              >
                Progress
                <SortIcon field="completionRate" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-interactive-primary transition-colors font-display"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon field="status" />
              </TableHead>
              <TableHead className="w-[80px] font-display">Actions</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
              {sortedRoutes.map((route) => {
                const isUpdating = updatingRouteId === route.id;
                const isDeleting = deletingRouteId === route.id;
                const nextStatuses = NEXT_STATUSES[route.status];
                const statusConfig = STATUS_CONFIG[route.status];

                const mockStops = Array.from({ length: Math.min(route.stopCount, 5) }, (_, i) => ({
                  address: `Stop ${i + 1} address`,
                  customerName: `Customer ${i + 1}`,
                  status: i < route.deliveredCount ? "delivered" : "pending",
                }));

                return (
                  <ExpandableTableRow
                    key={route.id}
                    id={route.id}
                    isExpanded={isExpanded(route.id)}
                    onExpandChange={handleExpandChange}
                    colSpan={6}
                    className={cn(isDeleting && "opacity-50")}
                    previewContent={
                      <RoutePreviewPanel
                        stops={mockStops}
                        estimatedDuration={`${route.stopCount * 15} min`}
                        detailsLink={`/admin/routes/${route.id}`}
                      />
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10">
                          <MapPin className="h-4 w-4 text-interactive-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {format(parseISO(route.deliveryDate), "EEEE, MMM d")}
                          </p>
                          <p className="text-xs text-text-secondary font-mono">
                            #{route.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {route.driver ? (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-status-success-bg flex items-center justify-center text-status-success text-xs font-medium">
                            {route.driver.fullName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "DR"}
                          </div>
                          <span className="text-sm">
                            {route.driver.fullName || "Unnamed"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-secondary italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tertiary/10">
                        <Package className="h-3.5 w-3.5 text-accent-tertiary" />
                        <span className="text-sm font-semibold text-accent-tertiary">
                          {route.deliveredCount}/{route.stopCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={route.completionRate} className="w-24 h-2" />
                        <span className="text-sm font-medium text-text-primary w-10">
                          {route.completionRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {nextStatuses.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge
                              className={cn(
                                statusConfig.className,
                                "cursor-pointer gap-1.5 border transition-all",
                                isUpdating && "opacity-50"
                              )}
                            >
                              {statusConfig.icon}
                              {isUpdating ? "..." : statusConfig.label}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {nextStatuses.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(route.id, status)}
                                className="cursor-pointer"
                              >
                                <Badge className={cn(STATUS_CONFIG[status].className, "gap-1.5 border")}>
                                  {STATUS_CONFIG[status].icon}
                                  {STATUS_CONFIG[status].label}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge className={cn(statusConfig.className, "gap-1.5 border")}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      )}
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
                            onClick={() => onViewRoute(route.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {route.status === "planned" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(route.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Route
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </ExpandableTableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <RouteMobileCard
        routes={sortedRoutes}
        updatingRouteId={updatingRouteId}
        onViewRoute={onViewRoute}
        onDelete={handleDelete}
      />
    </m.div>
  );
}
