"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Search,
  UserPlus,
  Filter,
  Truck,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  DriverListTable,
  type AdminDriver,
} from "@/components/admin/drivers/DriverListTable";
import {
  AddDriverModal,
  type CreateDriverData,
} from "@/components/admin/drivers/AddDriverModal";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Drivers" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface DriverStats {
  total: number;
  active: number;
  avgRating: number | null;
  totalDeliveries: number;
}

export default function AdminDriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }
      const data: AdminDriver[] = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const handleToggleActive = async (driverId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update driver");
      }

      // Update local state
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId ? { ...driver, isActive } : driver
        )
      );

      router.refresh();
    } catch (error) {
      console.error("Error toggling driver status:", error);
      alert(error instanceof Error ? error.message : "Failed to update driver");
    }
  };

  const handleViewDriver = (driverId: string) => {
    router.push(`/admin/drivers/${driverId}`);
  };

  const handleAddDriver = async (data: CreateDriverData) => {
    const response = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create driver");
    }

    // Refresh the list
    await fetchDrivers();
  };

  // Filter drivers by status
  const filteredDrivers =
    statusFilter === "all"
      ? drivers
      : drivers.filter((driver) =>
          statusFilter === "active" ? driver.isActive : !driver.isActive
        );

  // Calculate stats
  const stats: DriverStats = {
    total: drivers.length,
    active: drivers.filter((d) => d.isActive).length,
    avgRating:
      drivers.filter((d) => d.ratingAvg !== null).length > 0
        ? drivers.reduce((sum, d) => sum + (d.ratingAvg || 0), 0) /
          drivers.filter((d) => d.ratingAvg !== null).length
        : null,
    totalDeliveries: drivers.reduce((sum, d) => sum + d.deliveriesCount, 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-charcoal">
            Driver Fleet
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your delivery drivers and track performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-curry/20 hover:bg-curry/5"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-saffron to-curry hover:from-saffron-dark hover:to-curry-dark text-white shadow-md"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Total Drivers */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream to-lotus/30 border border-curry/10 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-saffron">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Total Drivers</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Active Drivers */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-jade/5 to-jade/10 border border-jade/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-jade/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-jade">
              <Truck className="h-5 w-5" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.active}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                / {stats.total}
              </span>
            </p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-saffron/5 to-saffron/10 border border-saffron/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-saffron">
              <Star className="h-5 w-5 fill-saffron" />
              <span className="text-sm font-medium">Avg Rating</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
              {stats.avgRating && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / 5.0
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Deliveries */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-curry/5 to-curry/10 border border-curry/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-curry/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curry">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Deliveries</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.totalDeliveries.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Status:</span>
          </div>
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter.value === "all"
                ? drivers.length
                : filter.value === "active"
                ? drivers.filter((d) => d.isActive).length
                : drivers.filter((d) => !d.isActive).length;
            const isActive = statusFilter === filter.value;

            return (
              <Badge
                key={filter.value}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive
                    ? "bg-saffron hover:bg-saffron/90 text-white border-transparent"
                    : "bg-white border-curry/20 text-charcoal hover:bg-saffron/10 hover:border-saffron/30"
                )}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">({count})</span>
                )}
              </Badge>
            );
          })}
        </div>
      </motion.div>

      {/* Drivers Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <DriverListTable
          drivers={filteredDrivers}
          onToggleActive={handleToggleActive}
          onViewDriver={handleViewDriver}
          searchQuery={searchQuery}
        />
      </motion.div>

      {/* Add Driver Modal */}
      <AddDriverModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddDriver}
      />
    </div>
  );
}
