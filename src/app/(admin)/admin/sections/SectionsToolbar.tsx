"use client";

import { m } from "framer-motion";
import { Plus, RefreshCw, LayoutGrid, Eye, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { DraftBanner } from "@/components/ui/admin/sections/DraftBanner";

interface SectionsToolbarProps {
  hasUnpublishedChanges: boolean;
  refreshing: boolean;
  totalSections: number;
  visibleSections: number;
  totalItems: number;
  onRefresh: () => void;
  onCreate: () => void;
  onPublishComplete: () => void;
}

export function SectionsToolbar({
  hasUnpublishedChanges,
  refreshing,
  totalSections,
  visibleSections,
  totalItems,
  onRefresh,
  onCreate,
  onPublishComplete,
}: SectionsToolbarProps) {
  return (
    <>
      {/* Draft Banner */}
      <DraftBanner
        hasUnpublishedChanges={hasUnpublishedChanges}
        onPublishComplete={onPublishComplete}
      />

      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
            Featured Sections
          </h1>
          <p className="font-body text-text-secondary mt-1">
            Manage homepage featured sections and their items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="border-border hover:bg-surface-tertiary"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={onCreate}
            className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        </div>
      </m.div>

      {/* Stats Cards */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <LayoutGrid className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Sections</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {totalSections}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Visible</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {visibleSections}
              <span className="text-sm font-body font-normal text-text-muted ml-2">
                / {totalSections}
              </span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-secondary-hover">
              <Package className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">{totalItems}</p>
          </div>
        </div>
      </m.div>
    </>
  );
}
