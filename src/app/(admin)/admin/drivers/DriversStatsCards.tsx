"use client";

import { m } from "framer-motion";
import { Truck, Users, Star, TrendingUp } from "lucide-react";

interface DriversStatsCardsProps {
  total: number;
  active: number;
  avgRating: number | null;
  totalDeliveries: number;
}

export function DriversStatsCards({
  total,
  active,
  avgRating,
  totalDeliveries,
}: DriversStatsCardsProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* Total Drivers */}
      <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Total Drivers</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">{total}</p>
        </div>
      </div>

      {/* Active Drivers */}
      <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-green">
            <Truck className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Active</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {active}
            <span className="text-sm font-body font-normal text-text-muted ml-2">/ {total}</span>
          </p>
        </div>
      </div>

      {/* Average Rating */}
      <div className="relative overflow-hidden rounded-card-sm bg-primary/5 border border-primary/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary">
            <Star className="h-5 w-5 fill-primary" />
            <span className="text-sm font-body font-medium">Avg Rating</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {avgRating ? avgRating.toFixed(1) : "\u2014"}
            {avgRating && (
              <span className="text-sm font-body font-normal text-text-muted ml-1">/ 5.0</span>
            )}
          </p>
        </div>
      </div>

      {/* Total Deliveries */}
      <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-secondary-hover">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Deliveries</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {totalDeliveries.toLocaleString()}
          </p>
        </div>
      </div>
    </m.div>
  );
}
