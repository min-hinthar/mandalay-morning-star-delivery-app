"use client";

import { m, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Eye, Trash2, MapPin, User, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STATUS_CONFIG } from "./types";
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
    <div className="md:hidden divide-y divide-border-v5/50">
      <AnimatePresence>
        {routes.map((route, index) => {
          const isUpdating = updatingRouteId === route.id;
          const statusConfig = STATUS_CONFIG[route.status];

          return (
            <m.div
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-interactive-primary-light/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10">
                    <MapPin className="h-5 w-5 text-interactive-primary" />
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
                <Badge
                  className={cn(
                    statusConfig.className,
                    "gap-1.5 border shrink-0"
                  )}
                >
                  {statusConfig.icon}
                  {isUpdating ? "..." : statusConfig.label}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-text-secondary" />
                  <span className="text-text-secondary">
                    {route.driver?.fullName || "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-accent-tertiary">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">
                    {route.deliveredCount}/{route.stopCount} delivered
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Progress value={route.completionRate} className="flex-1 h-2" />
                <span className="text-sm font-medium text-text-primary">
                  {route.completionRate}%
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-interactive-primary/30 text-interactive-primary hover:bg-interactive-primary-light"
                  onClick={() => onViewRoute(route.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                {route.status === "planned" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(route.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
