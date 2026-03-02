"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, Mail, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { InlineErrorCard } from "@/components/ui/admin/InlineErrorCard";
import { DriversPageSkeleton } from "@/components/ui/admin/drivers/DriverListTable/DriversPageSkeleton";
import { DriverListTable, type AdminDriver } from "@/components/ui/admin/drivers/DriverListTable";
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
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [invitesRefreshKey, setInvitesRefreshKey] = useState(0);

  const fetchDrivers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/drivers");
      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }
      const json = await response.json();
      const data: AdminDriver[] = json.data ?? json;
      setDrivers(data);
    } catch {
      setError("Failed to load drivers. Please try again.");
      toast({ message: "Failed to fetch drivers", type: "error" });
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
        const err = await response.json();
        throw new Error(err.error || "Failed to update driver");
      }

      setDrivers((prev) =>
        prev.map((driver) => (driver.id === driverId ? { ...driver, isActive } : driver))
      );

      router.refresh();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to update driver",
        type: "error",
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
      const err = await response.json();
      throw new Error(err.error || "Failed to create driver");
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Driver Fleet"
        count={drivers.length}
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Drivers" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border hover:bg-surface-tertiary"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-accent-teal hover:bg-accent-teal/90 text-text-inverse shadow-sm"
            >
              <Mail className="mr-2 h-4 w-4" />
              Invite Driver
            </Button>
          </>
        }
      />

      {/* Skeleton Crossfade for loading */}
      <SkeletonCrossfade isLoading={loading} skeleton={<DriversPageSkeleton />}>
        {/* Error state */}
        {error ? (
          <InlineErrorCard message={error} onRetry={handleRefresh} />
        ) : (
          <>
            <DriversStatsCards
              total={stats.total}
              active={stats.active}
              avgRating={stats.avgRating}
              totalDeliveries={stats.totalDeliveries}
            />

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {statusFilter !== "pending" && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-surface-primary border-border focus:border-accent-teal focus:ring-accent-teal/20 rounded-input"
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
                          ? "bg-accent-teal hover:bg-accent-teal/90 text-text-inverse border-transparent"
                          : "bg-surface-primary border-border text-text-primary hover:bg-accent-teal/10 hover:border-accent-teal/30"
                      )}
                      onClick={() => setStatusFilter(f.value)}
                    >
                      {f.label}
                      {count > 0 && <span className="ml-1.5 text-xs opacity-80">({count})</span>}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
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
            </div>
          </>
        )}
      </SkeletonCrossfade>

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
