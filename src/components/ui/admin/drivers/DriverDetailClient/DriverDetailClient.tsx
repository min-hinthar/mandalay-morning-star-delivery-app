/**
 * Driver Detail Client Component
 *
 * Activity-focused layout: recent routes and deliveries as main view,
 * profile info secondary. Per CONTEXT.md design decisions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  Edit2,
  UserX,
  UserCheck,
  Archive,
  Loader2,
  Route,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { DriverStatsCards } from "../DriverStatsCards";
import { PerformanceSection } from "./PerformanceSection";
import { RecentRoutesSection } from "../RecentRoutesSection";
import { RecentRatingsSection } from "../RecentRatingsSection";
import { EditProfileModal } from "./EditProfileModal";
import { ArchiveConfirmModal } from "./ArchiveConfirmModal";
import { VehicleIcon, VEHICLE_LABELS, formatDate } from "./types";
import type { DriverDetail, EditFormState } from "./types";

export function DriverDetailClient() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: "",
    phone: "",
    vehicleType: "",
    licensePlate: "",
  });

  const [archiveReason, setArchiveReason] = useState("");

  const fetchDriver = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: "Error", description: "Driver not found", variant: "destructive" });
          router.push("/admin/drivers");
          return;
        }
        throw new Error("Failed to fetch driver");
      }

      const data: DriverDetail = await response.json();
      setDriver(data);
      setEditForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        vehicleType: data.vehicleType || "",
        licensePlate: data.licensePlate || "",
      });
    } catch {
      toast({ title: "Error", description: "Failed to fetch driver details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [driverId, router]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  const handleToggleStatus = async () => {
    if (!driver) return;
    setToggling(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !driver.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setDriver((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
      toast({
        title: "Success",
        description: driver.isActive ? "Driver deactivated" : "Driver activated",
      });
    } catch {
      toast({ title: "Error", description: "Failed to update driver status", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName || null,
          phone: editForm.phone || null,
          vehicleType: editForm.vehicleType || null,
          licensePlate: editForm.licensePlate || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({ title: "Success", description: "Driver profile updated" });
      setShowEditModal(false);
      fetchDriver();
    } catch {
      toast({ title: "Error", description: "Failed to update driver profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for archiving", variant: "destructive" });
      return;
    }

    setArchiving(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: archiveReason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to archive driver");
      }

      toast({ title: "Success", description: "Driver archived successfully" });
      router.push("/admin/drivers");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to archive driver",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };

  const driverName = driver?.fullName || "Driver";

  const driverDetailSkeleton = (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <Skeleton width={300} height={24} radius="md" />
      <div className="flex items-center gap-4">
        <Skeleton width={48} height={48} radius="full" />
        <div className="space-y-2">
          <Skeleton width={180} height={24} radius="md" />
          <Skeleton width={80} height={20} radius="md" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} width="100%" height={112} radius="lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton width="100%" height={256} radius="lg" />
          <Skeleton width="100%" height={192} radius="lg" />
        </div>
        <div className="space-y-6">
          <Skeleton width="100%" height={192} radius="lg" />
          <Skeleton width="100%" height={128} radius="lg" />
        </div>
      </div>
    </div>
  );

  if (!loading && !driver) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Driver not found</p>
        <Button variant="outline" onClick={() => router.push("/admin/drivers")} className="mt-4">
          Back to Drivers
        </Button>
      </div>
    );
  }

  // While loading, show skeleton; when done, driver is guaranteed non-null (early return above)
  if (!driver) {
    return driverDetailSkeleton;
  }

  return (
    <SkeletonCrossfade isLoading={loading} skeleton={driverDetailSkeleton}>
      <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <AdminPageHeader
        title={driverName}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Drivers", href: "/admin/drivers" },
          { label: driverName },
        ]}
      />

      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-avatar flex items-center justify-center text-text-inverse font-display text-lg shadow-sm">
            {driver?.fullName
              ? driver.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "DR"}
          </div>
          <div>
            <Badge
              className={cn(
                "mt-1",
                driver?.isActive
                  ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/20"
                  : "bg-surface-tertiary text-text-secondary border border-border"
              )}
            >
              {driver?.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </m.div>

      {driver && <PerformanceSection driver={driver} />}
      {driver && <DriverStatsCards driver={driver} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentRoutesSection driverId={driverId} />
          <RecentRatingsSection driverId={driverId} />
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-secondary rounded-card-sm border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text-primary">Profile</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="text-accent-teal hover:bg-accent-teal/10"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-body text-text-secondary truncate">{driver?.email}</span>
              </div>

              {driver?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-body text-text-secondary">{driver.phone}</span>
                </div>
              )}

              {driver?.vehicleType && (
                <div className="flex items-center gap-3">
                  <VehicleIcon type={driver.vehicleType} />
                  <span className="text-sm font-body text-text-secondary">
                    {VEHICLE_LABELS[driver.vehicleType]}
                    {driver.licensePlate && ` - ${driver.licensePlate}`}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <p className="text-xs font-body text-text-muted">
                  Member since {driver?.createdAt ? formatDate(driver.createdAt) : "—"}
                </p>
              </div>
            </div>
          </m.div>

          {/* Actions Card */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-secondary rounded-card-sm border border-border p-6"
          >
            <h2 className="font-display font-semibold text-text-primary mb-4">Actions</h2>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-accent-teal/30 text-accent-teal hover:bg-accent-teal/10"
                onClick={() => router.push(`/admin/routes?driver=${driverId}`)}
              >
                <Route className="h-4 w-4 mr-2" />
                Assign to Route
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start",
                  driver?.isActive
                    ? "border-secondary/30 text-secondary-hover hover:bg-secondary-light"
                    : "border-green/30 text-green hover:bg-green/10"
                )}
                onClick={handleToggleStatus}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : driver?.isActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                {driver?.isActive ? "Deactivate" : "Activate"}
              </Button>

              {driver?.isActive && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-status-error/30 text-status-error hover:bg-status-error/10"
                  onClick={() => setShowArchiveModal(true)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Driver
                </Button>
              )}
            </div>
          </m.div>
        </div>
      </div>

      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        editForm={editForm}
        onFormChange={setEditForm}
        onSave={handleSaveProfile}
        saving={saving}
      />

      <ArchiveConfirmModal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        archiveReason={archiveReason}
        onReasonChange={setArchiveReason}
        onArchive={handleArchive}
        archiving={archiving}
      />
      </div>
    </SkeletonCrossfade>
  );
}
