"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  RefreshCw,
  Search,
  Mail,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import {
  DriverListTable,
  type AdminDriver,
} from "@/components/ui/admin/drivers/DriverListTable";
import {
  AddDriverModal,
  type CreateDriverData,
} from "@/components/ui/admin/drivers/AddDriverModal";
import { PendingInvitesTab } from "@/components/ui/admin/drivers/PendingInvitesTab";
import { InviteDriverModal } from "@/components/ui/admin/drivers/InviteDriverModal";
import { DriversStatsCards } from "./DriversStatsCards";

type StatusFilter = "all" | "active" | "inactive" | "pending";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Drivers" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending Invites" },
];

export default function AdminDriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [invitesRefreshKey, setInvitesRefreshKey] = useState(0);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }
      const data: AdminDriver[] = await response.json();
      setDrivers(data);
    } catch {
      toast({ title: "Error", description: "Failed to fetch drivers", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchInvitesCount = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers/invites");
      if (response.ok) {
        const invites = await response.json();
        setPendingInvitesCount(invites.length);
      }
    } catch {
      // Silently fail for count fetch
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchInvitesCount();
  }, [fetchDrivers, fetchInvitesCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
    fetchInvitesCount();
    setInvitesRefreshKey((k) => k + 1);
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

      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId ? { ...driver, isActive } : driver
        )
      );

      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update driver",
        variant: "destructive",
      });
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

    await fetchDrivers();
  };

  const handleInviteSuccess = () => {
    fetchInvitesCount();
    setInvitesRefreshKey((k) => k + 1);
  };

  const filteredDrivers =
    statusFilter === "all" || statusFilter === "pending"
      ? drivers
      : drivers.filter((driver) =>
          statusFilter === "active" ? driver.isActive : !driver.isActive
        );

  const stats = {
    total: drivers.length,
    active: drivers.filter((d) => d.isActive).length,
    avgRating:
      drivers.filter((d) => d.ratingAvg !== null).length > 0
        ? drivers.reduce((sum, d) => sum + (d.ratingAvg || 0), 0) /
          drivers.filter((d) => d.ratingAvg !== null).length
        : null,
    totalDeliveries: drivers.reduce((sum, d) => sum + d.deliveriesCount, 0),
  };

  const getFilterCount = (filter: StatusFilter): number => {
    switch (filter) {
      case "all":
        return drivers.length;
      case "active":
        return drivers.filter((d) => d.isActive).length;
      case "inactive":
        return drivers.filter((d) => !d.isActive).length;
      case "pending":
        return pendingInvitesCount;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-surface-tertiary rounded-input" />
          <div className="h-4 w-64 bg-surface-tertiary rounded-input" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-tertiary rounded-card-sm" />
            ))}
          </div>
          <div className="h-96 bg-surface-tertiary rounded-card-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
            Driver Fleet
          </h1>
          <p className="font-body text-text-secondary mt-1">
            Manage your delivery drivers and track performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border hover:bg-surface-tertiary"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
          >
            <Mail className="mr-2 h-4 w-4" />
            Invite Driver
          </Button>
        </div>
      </m.div>

      <DriversStatsCards
        total={stats.total}
        active={stats.active}
        avgRating={stats.avgRating}
        totalDeliveries={stats.totalDeliveries}
      />

      {/* Search and Filters */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {statusFilter !== "pending" && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input"
            />
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 flex-wrap",
            statusFilter === "pending" && "flex-1"
          )}
        >
          <div className="flex items-center gap-2 text-text-muted">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-body hidden sm:inline">Status:</span>
          </div>
          {STATUS_FILTERS.map((f) => {
            const count = getFilterCount(f.value);
            const isActive = statusFilter === f.value;

            return (
              <Badge
                key={f.value}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all duration-fast font-body",
                  isActive
                    ? "bg-primary hover:bg-primary-hover text-text-inverse border-transparent"
                    : "bg-surface-primary border-border text-text-primary hover:bg-primary/10 hover:border-primary/30"
                )}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">({count})</span>
                )}
              </Badge>
            );
          })}
        </div>
      </m.div>

      {/* Content */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {statusFilter === "pending" ? (
          <PendingInvitesTab
            key={invitesRefreshKey}
            onInviteCountChange={setPendingInvitesCount}
          />
        ) : (
          <DriverListTable
            drivers={filteredDrivers}
            onToggleActive={handleToggleActive}
            onViewDriver={handleViewDriver}
            searchQuery={searchQuery}
          />
        )}
      </m.div>

      <AddDriverModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddDriver}
      />

      <InviteDriverModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
