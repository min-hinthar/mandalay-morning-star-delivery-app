"use client";

import { m } from "framer-motion";
import { Route, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

interface RoutesStatsCardsProps {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
}

export function RoutesStatsCards({ total, planned, inProgress, completed }: RoutesStatsCardsProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* Total Routes */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream to-lotus/30 border border-curry/10 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-saffron">
            <Route className="h-5 w-5" />
            <span className="text-sm font-medium">Total Routes</span>
          </div>
          <p className="text-3xl font-display text-charcoal mt-2">{total}</p>
        </div>
      </div>

      {/* Planned */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Planned</span>
          </div>
          <p className="text-3xl font-display text-charcoal mt-2">{planned}</p>
        </div>
      </div>

      {/* In Progress */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-saffron/5 to-saffron/10 border border-saffron/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-saffron">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <p className="text-3xl font-display text-charcoal mt-2">{inProgress}</p>
        </div>
      </div>

      {/* Completed */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-jade/5 to-jade/10 border border-jade/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-jade/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-jade">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-3xl font-display text-charcoal mt-2">
            {completed}
            {total > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({Math.round((completed / total) * 100)}%)
              </span>
            )}
          </p>
        </div>
      </div>
    </m.div>
  );
}
