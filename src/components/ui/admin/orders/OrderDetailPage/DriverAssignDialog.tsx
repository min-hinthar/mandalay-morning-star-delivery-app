"use client";

import { useState, useEffect } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";

interface Driver {
  id: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
}

interface DriverAssignDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  currentDriverId: string | null;
  currentDriverName: string | null;
  onDriverChanged: () => void;
}

export function DriverAssignDialog({
  open,
  onClose,
  orderId,
  currentDriverId,
  currentDriverName,
  onDriverChanged,
}: DriverAssignDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(currentDriverId);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active drivers when dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedDriverId(currentDriverId);

    const fetchDrivers = async () => {
      try {
        setLoadingDrivers(true);
        const res = await fetch("/api/admin/drivers?limit=100");
        if (!res.ok) throw new Error("Failed to fetch drivers");
        const data = await res.json();
        setDrivers((data.data || []).filter((d: Driver) => d.isActive));
      } catch {
        toast({ message: "Failed to load drivers", type: "error" });
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, [open, currentDriverId]);

  const hasChanged = selectedDriverId !== currentDriverId;

  const handleSubmit = async () => {
    if (!hasChanged) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/orders/${orderId}/driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractErrorMessage(data, "Failed to update driver"));
      }

      const result = await res.json();
      const action = selectedDriverId
        ? `Driver assigned: ${result.driverName || "Unknown"}`
        : "Driver unassigned";
      toast({ message: action, type: "success" });
      onDriverChanged();
      onClose();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to update driver",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Assign Driver" size="md">
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {currentDriverId ? "Reassign Driver" : "Assign Driver"}
          </h3>
          {currentDriverName && (
            <p className="mt-1 text-sm text-text-secondary">
              Currently assigned: <span className="font-medium">{currentDriverName}</span>
            </p>
          )}
        </div>

        {loadingDrivers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : drivers.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No active drivers available.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {/* Unassign option */}
            {currentDriverId && (
              <button
                type="button"
                onClick={() => setSelectedDriverId(null)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  selectedDriverId === null
                    ? "bg-status-error/10 border border-status-error"
                    : "hover:bg-surface-secondary border border-transparent"
                )}
              >
                <UserX className="h-4 w-4 text-status-error flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-status-error">Unassign Driver</span>
                  <p className="text-xs text-text-muted">Remove driver from this order</p>
                </div>
              </button>
            )}

            {/* Driver list */}
            {drivers.map((driver) => {
              const isSelected = selectedDriverId === driver.id;
              const isCurrent = currentDriverId === driver.id;
              return (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-primary-light border border-primary"
                      : "hover:bg-surface-secondary border border-transparent"
                  )}
                >
                  <UserCheck
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isSelected ? "text-primary" : "text-text-muted"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary truncate block">
                      {driver.fullName || driver.email}
                    </span>
                    {driver.fullName && (
                      <p className="text-xs text-text-muted truncate">{driver.email}</p>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-text-muted flex-shrink-0">Current</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !hasChanged}
            className="flex-1"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {selectedDriverId === null ? "Unassign" : "Assign Driver"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
