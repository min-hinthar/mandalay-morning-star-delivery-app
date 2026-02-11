"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { cardContainer } from "@/components/ui/admin/CardRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { RouteCardRow, RouteDateHeader } from "./RouteCardRow";
import { RouteDetailDrawer } from "../RouteDetailDrawer";
import type { RouteListTableProps, SortField, SortDirection, AdminRoute } from "./types";

// ============================================
// CONSTANTS
// ============================================

const INITIAL_DISPLAY = 20;

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: "deliveryDate", label: "Date" },
  { field: "status", label: "Status" },
  { field: "stopCount", label: "Stops" },
  { field: "completionRate", label: "Progress" },
];

// ============================================
// HELPERS
// ============================================

function groupByDate(routes: AdminRoute[]): Map<string, AdminRoute[]> {
  const groups = new Map<string, AdminRoute[]>();
  for (const route of routes) {
    const dateKey = format(parseISO(route.deliveryDate), "yyyy-MM-dd");
    const existing = groups.get(dateKey) ?? [];
    existing.push(route);
    groups.set(dateKey, existing);
  }
  return groups;
}

// ============================================
// COMPONENT
// ============================================

export function RouteListTable({
  routes,
  onViewRoute: _onViewRoute,
  onStatusChange: _onStatusChange,
  onDeleteRoute,
}: RouteListTableProps) {
  // onViewRoute/onStatusChange reserved for future per-row actions
  void _onViewRoute;
  void _onStatusChange;
  const [sortField, setSortField] = useState<SortField>("deliveryDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [drawerRoute, setDrawerRoute] = useState<AdminRoute | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "deliveryDate":
          comparison =
            new Date(a.deliveryDate).getTime() -
            new Date(b.deliveryDate).getTime();
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
  }, [routes, sortField, sortDirection]);

  const displayedRoutes = sortedRoutes.slice(0, displayCount);
  const hasMore = sortedRoutes.length > displayCount;
  const dateGroups = useMemo(() => groupByDate(displayedRoutes), [displayedRoutes]);

  const handleRowClick = (route: AdminRoute) => {
    setSelectedRouteId(route.id);
    setDrawerRoute(route);
  };

  const handleDrawerClose = () => {
    setDrawerRoute(null);
    setSelectedRouteId(null);
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    await onDeleteRoute(routeId);
    handleDrawerClose();
  };

  // Truly empty
  if (routes.length === 0) {
    return (
      <EmptyState
        variant="admin-routes"
        onAction={() => {
          // Trigger create from parent -- no-op here, parent has the modal
        }}
      />
    );
  }

  return (
    <>
      {/* Sort controls (desktop) */}
      <div className="hidden md:flex items-center gap-1 mb-3 px-1">
        <span className="text-xs text-text-muted mr-2">Sort:</span>
        {SORT_FIELDS.map((sf) => {
          const isActive = sortField === sf.field;
          return (
            <button
              key={sf.field}
              onClick={() => handleSort(sf.field)}
              className={cn(
                "flex items-center gap-0.5 px-2 py-1 rounded-md text-xs transition-colors",
                isActive
                  ? "text-accent-teal font-semibold bg-accent-teal/10"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-secondary"
              )}
            >
              {sf.label}
              {isActive &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                ))}
            </button>
          );
        })}
      </div>

      {/* Card rows grouped by date */}
      <AnimatePresence mode="wait">
        <m.div
          key={`${sortField}-${sortDirection}`}
          variants={cardContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {Array.from(dateGroups.entries()).map(([dateKey, groupRoutes]) => (
            <div key={dateKey}>
              <RouteDateHeader dateString={dateKey} />
              <div className="space-y-2 mt-2">
                {groupRoutes.map((route) => (
                  <RouteCardRow
                    key={route.id}
                    route={route}
                    selected={selectedRouteId === route.id}
                    onClick={() => handleRowClick(route)}
                  />
                ))}
              </div>
            </div>
          ))}
        </m.div>
      </AnimatePresence>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayCount((c) => c + INITIAL_DISPLAY)}
            className="border-accent-teal/20 text-accent-teal hover:bg-accent-teal/10"
          >
            Load More ({sortedRoutes.length - displayCount} remaining)
          </Button>
        </div>
      )}

      {/* Detail drawer */}
      <RouteDetailDrawer
        route={drawerRoute}
        open={drawerRoute !== null}
        onClose={handleDrawerClose}
        onDelete={handleDelete}
      />
    </>
  );
}
