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
  ArrowLeft,
  Edit2,
  UserX,
  UserCheck,
  Archive,
  Loader2,
  Route,
  Phone,
  Mail,
  Car,
  Bike,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DriverStatsCards } from "./DriverStatsCards";
import { RecentRoutesSection } from "./RecentRoutesSection";
import { RecentRatingsSection } from "./RecentRatingsSection";
import type { VehicleType } from "@/types/driver";

interface DriverDetail {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  onboardingCompletedAt: string | null;
  ratingAvg: number;
  deliveriesCount: number;
  createdAt: string;
  updatedAt: string;
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  van: "Van",
  truck: "Truck",
};

const VehicleIcon = ({ type }: { type: VehicleType | null }) => {
  switch (type) {
    case "car":
      return <Car className="h-4 w-4" />;
    case "motorcycle":
    case "bicycle":
      return <Bike className="h-4 w-4" />;
    case "van":
    case "truck":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4 text-text-muted" />;
  }
};

export function DriverDetailClient() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    vehicleType: "" as VehicleType | "",
    licensePlate: "",
  });

  // Archive form state
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6 max-w-6xl">
          <div className="h-10 w-48 bg-surface-tertiary rounded-input" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-tertiary rounded-card-sm" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-surface-tertiary rounded-card-sm" />
              <div className="h-48 bg-surface-tertiary rounded-card-sm" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-surface-tertiary rounded-card-sm" />
              <div className="h-32 bg-surface-tertiary rounded-card-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Driver not found</p>
        <Button variant="outline" onClick={() => router.push("/admin/drivers")} className="mt-4">
          Back to Drivers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/drivers")}
            className="hover:bg-surface-tertiary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-avatar flex items-center justify-center text-text-inverse font-display text-lg shadow-sm">
              {driver.fullName
                ? driver.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "DR"}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-text-primary">
                {driver.fullName || "Unnamed Driver"}
              </h1>
              <Badge
                className={cn(
                  "mt-1",
                  driver.isActive
                    ? "bg-green/10 text-green border border-green/20"
                    : "bg-surface-tertiary text-text-secondary border border-border"
                )}
              >
                {driver.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </m.div>

      {/* Stats Cards Row */}
      <DriverStatsCards driver={driver} />

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column (2/3) - Activity */}
        <div className="lg:col-span-2 space-y-6">
          <RecentRoutesSection driverId={driverId} />
          <RecentRatingsSection driverId={driverId} />
        </div>

        {/* Side column (1/3) - Profile & Actions */}
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
                className="text-primary hover:bg-primary-light"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-body text-text-secondary truncate">{driver.email}</span>
              </div>

              {driver.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-body text-text-secondary">{driver.phone}</span>
                </div>
              )}

              {driver.vehicleType && (
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
                  Member since {formatDate(driver.createdAt)}
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
                className="w-full justify-start border-primary/30 text-primary hover:bg-primary-light"
                onClick={() => router.push(`/admin/routes?driver=${driverId}`)}
              >
                <Route className="h-4 w-4 mr-2" />
                Assign to Route
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start",
                  driver.isActive
                    ? "border-secondary/30 text-secondary-hover hover:bg-secondary-light"
                    : "border-green/30 text-green hover:bg-green/10"
                )}
                onClick={handleToggleStatus}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : driver.isActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                {driver.isActive ? "Deactivate" : "Activate"}
              </Button>

              {driver.isActive && (
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-surface-inverse/60"
            onClick={() => setShowEditModal(false)}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={spring.default}
            className="relative bg-surface-primary rounded-card-sm border border-border p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-display font-semibold text-text-primary mb-6">Edit Driver Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
                  Full Name
                </label>
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="bg-surface-secondary border-border"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
                  Phone
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-surface-secondary border-border"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
                  Vehicle Type
                </label>
                <select
                  value={editForm.vehicleType}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, vehicleType: e.target.value as VehicleType | "" }))
                  }
                  className={cn(
                    "w-full px-3 py-2 rounded-input",
                    "bg-surface-secondary border border-border",
                    "font-body text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                >
                  <option value="">Select vehicle type</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
                  License Plate
                </label>
                <Input
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, licensePlate: e.target.value }))}
                  className="bg-surface-secondary border-border"
                  placeholder="Enter license plate"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-primary hover:bg-primary-hover text-text-inverse"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-surface-inverse/60"
            onClick={() => setShowArchiveModal(false)}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={spring.default}
            className="relative bg-surface-primary rounded-card-sm border border-border p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">Archive Driver</h2>
            <p className="text-sm font-body text-text-secondary mb-6">
              This will deactivate the driver and hide them from active lists. This action can be reversed by
              reactivating the driver.
            </p>

            <div className="mb-6">
              <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
                Reason for archiving *
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-input",
                  "bg-surface-secondary border border-border",
                  "font-body text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="Enter reason for archiving this driver"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowArchiveModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleArchive}
                disabled={archiving || !archiveReason.trim()}
                className="bg-status-error hover:bg-status-error/90 text-text-inverse"
              >
                {archiving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  "Archive Driver"
                )}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  );
}
