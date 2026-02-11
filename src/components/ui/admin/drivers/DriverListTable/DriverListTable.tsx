"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { cardContainer } from "@/components/ui/admin/CardRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { DriverCardRow } from "./DriverCardRow";
import { DriverDetailDrawer } from "../DriverDetailDrawer";
import type { DriverListTableProps, SortField, SortDirection, AdminDriver } from "./types";

// ============================================
// SORT HEADER
// ============================================

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = activeField === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        isActive ? "text-accent-teal" : "text-text-muted hover:text-text-primary"
      )}
    >
      {label}
      {isActive && (
        direction === "asc"
          ? <ChevronUp className="h-3.5 w-3.5" />
          : <ChevronDown className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DriverListTable({
  drivers,
  onToggleActive: _onToggleActive,
  onViewDriver,
  searchQuery,
}: DriverListTableProps) {
  // onToggleActive preserved in interface; toggle happens via driver detail page
  void _onToggleActive;
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  // Filter
  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.fullName?.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query)
    );
  });

  // Sort
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "fullName":
        comparison = (a.fullName || "").localeCompare(b.fullName || "");
        break;
      case "ratingAvg":
        comparison = (a.ratingAvg || 0) - (b.ratingAvg || 0);
        break;
      case "deliveriesCount":
        comparison = a.deliveriesCount - b.deliveriesCount;
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Drawer handlers
  const selectedDriver: AdminDriver | null =
    selectedDriverId ? drivers.find((d) => d.id === selectedDriverId) ?? null : null;

  const handleRowClick = (driverId: string) => {
    setSelectedDriverId(driverId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Empty states
  if (filteredDrivers.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          variant="admin-drivers-filtered"
          onAction={() => {
            // Parent controls search; this is a fallback placeholder
          }}
        />
      );
    }
    return <EmptyState variant="admin-drivers" />;
  }

  return (
    <>
      {/* Sticky column header (desktop only) */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 mb-2 text-xs">
        <div className="min-w-[200px]">
          <SortHeader
            label="Driver"
            field="fullName"
            activeField={sortField}
            direction={sortDirection}
            onSort={handleSort}
          />
        </div>
        <div className="min-w-[90px] text-xs font-semibold uppercase tracking-wider text-text-muted">
          Status
        </div>
        <div className="min-w-[80px] text-center">
          <SortHeader
            label="Deliveries"
            field="deliveriesCount"
            activeField={sortField}
            direction={sortDirection}
            onSort={handleSort}
          />
        </div>
        <div className="min-w-[70px] text-center">
          <SortHeader
            label="Rating"
            field="ratingAvg"
            activeField={sortField}
            direction={sortDirection}
            onSort={handleSort}
          />
        </div>
        <div className="min-w-[100px] text-xs font-semibold uppercase tracking-wider text-text-muted">
          Vehicle
        </div>
        <div className="ml-auto text-xs font-semibold uppercase tracking-wider text-text-muted">
          Actions
        </div>
      </div>

      {/* Card rows with stagger */}
      <m.div
        variants={cardContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {sortedDrivers.map((driver) => (
          <DriverCardRow
            key={driver.id}
            driver={driver}
            selected={selectedDriverId === driver.id}
            onClick={() => handleRowClick(driver.id)}
            onView={onViewDriver}
          />
        ))}
      </m.div>

      {/* Detail Drawer */}
      <DriverDetailDrawer
        driver={selectedDriver}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onEdit={onViewDriver}
      />
    </>
  );
}
