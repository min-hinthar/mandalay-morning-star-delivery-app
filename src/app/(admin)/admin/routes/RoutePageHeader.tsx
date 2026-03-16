"use client";

import { m } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Filter, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { RouteStatus } from "@/types/driver";

type StatusFilter = "all" | RouteStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Routes" },
  { value: "planned", label: "Planned" },
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

interface RoutePageHeaderProps {
  selectedDate: string | null;
  statusFilter: StatusFilter;
  routeCount: number;
  statusCounts: Record<RouteStatus | "all", number>;
  deliveredStops: number;
  totalStops: number;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onClearDate: () => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export type { StatusFilter };

export function RoutePageHeader({
  selectedDate,
  statusFilter,
  routeCount,
  statusCounts,
  deliveredStops,
  totalStops,
  onPreviousDay,
  onNextDay,
  onToday,
  onClearDate,
  onStatusFilterChange,
}: RoutePageHeaderProps) {
  return (
    <>
      {/* Date Navigation & Status Filters */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
      >
        <div className="flex items-center gap-2 bg-surface-primary rounded-xl border border-accent-teal/10 p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousDay}
            className="h-11 w-11 md:h-8 md:w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="h-4 w-4 text-accent-teal" />
            <span className="text-sm font-medium min-w-[120px] text-center">
              {selectedDate ? format(parseISO(selectedDate), "EEE, MMM d") : "All Dates"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextDay}
            className="h-11 w-11 md:h-8 md:w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-11 md:h-9 text-xs text-accent-teal hover:text-accent-teal"
            >
              Today
            </Button>
          )}
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearDate}
              className="h-11 md:h-9 text-xs text-accent-teal hover:text-accent-teal"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-text-muted">
            <Filter className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Status:</span>
          </div>
          {STATUS_FILTERS.map((f) => {
            const count = statusCounts[f.value] ?? (f.value === "all" ? routeCount : 0);
            const isActive = statusFilter === f.value;

            return (
              <Badge
                key={f.value}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all min-h-[44px] md:min-h-0 inline-flex items-center px-3",
                  isActive
                    ? "bg-accent-teal hover:bg-accent-teal/90 text-text-inverse border-transparent"
                    : "bg-surface-primary border-accent-teal/20 text-text-primary hover:bg-accent-teal/10 hover:border-accent-teal/30"
                )}
                onClick={() => onStatusFilterChange(f.value)}
              >
                {f.label}
                {count > 0 && <span className="ml-1.5 text-xs opacity-80">({count})</span>}
              </Badge>
            );
          })}
        </div>
      </m.div>

      {/* Delivery Progress Summary */}
      {totalStops > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-r from-accent-teal/5 to-accent-teal/10 rounded-xl border border-accent-teal/10 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-accent-teal" />
              <div>
                <p className="text-sm font-medium text-text-primary">Delivery Progress</p>
                <p className="text-xs text-text-muted">
                  {deliveredStops} of {totalStops} stops completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display text-text-primary">
                {Math.round((deliveredStops / totalStops) * 100)}%
              </p>
            </div>
          </div>
        </m.div>
      )}
    </>
  );
}
