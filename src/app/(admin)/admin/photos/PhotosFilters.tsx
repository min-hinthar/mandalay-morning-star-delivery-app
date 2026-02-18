"use client";

import { m, AnimatePresence } from "framer-motion";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type FilterType = "all" | "assigned" | "unassigned";

interface PhotosFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export function PhotosFilters({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: PhotosFiltersProps) {
  return (
    <>
      {/* Filters */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "assigned", "unassigned"] as FilterType[]).map((f) => (
            <Badge
              key={f}
              variant={filter === f ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all duration-fast font-body capitalize",
                filter === f
                  ? "bg-primary hover:bg-primary-hover text-text-inverse border-transparent"
                  : "bg-surface-primary border-border text-text-primary hover:bg-primary/10 hover:border-primary/30"
              )}
              onClick={() => onFilterChange(f)}
            >
              {f}
            </Badge>
          ))}
        </div>
      </m.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/30 rounded-card-sm"
          >
            <span className="font-body text-sm text-primary font-medium">
              {selectedCount} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="border-status-error/30 text-status-error hover:bg-status-error/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
