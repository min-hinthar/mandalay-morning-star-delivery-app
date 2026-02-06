'use client';

import { m } from "framer-motion";
import {
  Image as ImageIcon,
  CheckCircle,
  HardDrive,
} from "lucide-react";

interface PhotosStatsCardsProps {
  total: number;
  assigned: number;
  unassigned: number;
}

export function PhotosStatsCards({
  total,
  assigned,
  unassigned,
}: PhotosStatsCardsProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* Total Photos */}
      <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary">
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Total Photos</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {total}
          </p>
        </div>
      </div>

      {/* Assigned */}
      <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-green">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Assigned</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {assigned}
          </p>
        </div>
      </div>

      {/* Unassigned */}
      <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-secondary-hover">
            <HardDrive className="h-5 w-5" />
            <span className="text-sm font-body font-medium">Unassigned</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {unassigned}
          </p>
        </div>
      </div>
    </m.div>
  );
}
