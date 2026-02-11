"use client";

import { AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Eye, Trash2, MapPin, User, Package } from "lucide-react";
import { CardRow, cardContainer } from "@/components/ui/admin/CardRow";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import type { AdminRoute } from "./types";

interface RouteMobileCardProps {
  routes: AdminRoute[];
  updatingRouteId: string | null;
  onViewRoute: (routeId: string) => void;
  onDelete: (routeId: string) => void;
}

export function RouteMobileCard({
  routes,
  updatingRouteId,
  onViewRoute,
  onDelete,
}: RouteMobileCardProps) {
  return (
    <div className="md:hidden">
      <AnimatePresence>
        <m.div variants={cardContainer} initial="hidden" animate="visible" className="space-y-2 p-2">
          {routes.map((route) => {
            const isUpdating = updatingRouteId === route.id;

            return (
              <CardRow
                key={route.id}
                statusTint={
                  route.status === "in_progress"
                    ? "bg-blue-50/50"
                    : route.status === "completed"
                      ? "bg-green-50/50"
                      : "bg-gray-50/50"
                }
                onClick={() => onViewRoute(route.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent-teal/10">
                        <MapPin className="h-5 w-5 text-accent-teal" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {format(parseISO(route.deliveryDate), "EEE, MMM d")}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {route.stopCount} stops
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={route.status}
                      label={isUpdating ? "..." : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-text-secondary" />
                      <span className="text-text-secondary">
                        {route.driver?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-accent-teal">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">
                        {route.deliveredCount}/{route.stopCount} delivered
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-teal transition-all"
                        style={{ width: `${route.completionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {route.completionRate}%
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-accent-teal/30 text-accent-teal hover:bg-accent-teal/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRoute(route.id);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {route.status === "planned" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(route.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardRow>
            );
          })}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
