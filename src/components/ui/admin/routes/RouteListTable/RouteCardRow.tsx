"use client";

import { m } from "framer-motion";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { MapPin, Eye, Zap, User } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { CardRow } from "@/components/ui/admin/CardRow";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminRoute } from "./types";

// ============================================
// TYPES
// ============================================

export interface RouteCardRowProps {
  route: AdminRoute;
  selected?: boolean;
  onClick?: () => void;
}

// ============================================
// STATUS TINT MAP
// ============================================

const STATUS_TINT: Record<string, string> = {
  in_progress: "bg-blue-50/50",
  completed: "bg-green-50/50",
  planned: "bg-gray-50/50",
};

// ============================================
// DATE SECTION HEADER
// ============================================

export function RouteDateHeader({ dateString }: { dateString: string }) {
  const date = parseISO(dateString);
  let label: string;
  if (isToday(date)) {
    label = "Today";
  } else if (isYesterday(date)) {
    label = "Yesterday";
  } else {
    label = format(date, "EEEE, MMM d");
  }

  return (
    <div className="sticky top-0 z-10 bg-surface-secondary/80 backdrop-blur-sm px-4 py-2 border-b border-border">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

function DeliveryProgressBar({ delivered, total }: { delivered: number; total: number }) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-text-secondary">
            {delivered}/{total} delivered
          </span>
          <span className="text-xs font-semibold text-accent-teal">{pct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-surface-tertiary overflow-hidden">
          <m.div
            className="h-full rounded-full bg-accent-teal"
            initial={shouldAnimate ? { width: 0 } : { width: `${pct}%` }}
            animate={{ width: `${pct}%` }}
            transition={getSpring(spring.gentle)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function RouteCardRow({ route, selected, onClick }: RouteCardRowProps) {
  const statusTint = STATUS_TINT[route.status] ?? STATUS_TINT.planned;

  return (
    <CardRow statusTint={statusTint} selected={selected} onClick={onClick} className="gap-4">
      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4 w-full">
        {/* Date + ID */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="p-2 rounded-lg bg-accent-teal/10">
            <MapPin className="h-4 w-4 text-accent-teal" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {format(parseISO(route.deliveryDate), "EEE, MMM d")}
            </p>
            <p className="text-xs text-text-muted font-mono">#{route.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 min-w-[140px]">
          {route.driver ? (
            <>
              <div className="h-7 w-7 rounded-full bg-accent-teal/10 flex items-center justify-center text-accent-teal text-xs font-semibold">
                {route.driver.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "DR"}
              </div>
              <span className="text-sm text-text-primary truncate">
                {route.driver.fullName || "Unnamed"}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-text-muted italic">
              <User className="h-3.5 w-3.5" />
              Unassigned
            </span>
          )}
        </div>

        {/* Progress */}
        <DeliveryProgressBar delivered={route.deliveredCount} total={route.stopCount} />

        {/* Status */}
        <div className="min-w-[100px]">
          <StatusBadge status={route.status} />
        </div>

        {/* Duration */}
        <div className="min-w-[80px] text-sm text-text-secondary">
          {route.stopCount * 15} min est.
        </div>

        {/* Actions - always visible */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-accent-teal hover:text-accent-teal hover:bg-accent-teal/10"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-text-muted hover:text-accent-teal hover:bg-accent-teal/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-teal/10">
              <MapPin className="h-4 w-4 text-accent-teal" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {format(parseISO(route.deliveryDate), "EEE, MMM d")}
              </p>
              <p className="text-xs text-text-muted">{route.driver?.fullName || "Unassigned"}</p>
            </div>
          </div>
          <StatusBadge status={route.status} />
        </div>
        <DeliveryProgressBar delivered={route.deliveredCount} total={route.stopCount} />
      </div>
    </CardRow>
  );
}
