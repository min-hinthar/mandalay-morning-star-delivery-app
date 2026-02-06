"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { format, nextSaturday, isSaturday } from "date-fns";
import {
  Loader2,
  Route,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { OrderSelectionList } from "./OrderSelectionList";
import type { CreateRouteData, Driver, Order, FormErrors } from "./types";

function getDefaultDeliveryDate(): string {
  const today = new Date();
  const targetDate = isSaturday(today) ? today : nextSaturday(today);
  return format(targetDate, "yyyy-MM-dd");
}

interface CreateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRouteData) => Promise<void>;
}

export function CreateRouteModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateRouteModalProps) {
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDrivers();
      fetchOrders();
    }
  }, [open]);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch("/api/admin/drivers?active=true");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.filter((d: Driver) => d.isActive));
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders?status=confirmed,preparing");
      if (res.ok) {
        const data = await res.json();
        setOrders(
          data
            .filter(
              (o: { status: string }) => o.status === "confirmed" || o.status === "preparing"
            )
            .map((o: { id: string; total_cents: number; profiles?: { full_name: string | null }; delivery_window_start: string | null; order_items: { quantity: number }[]; status: string }) => ({
              id: o.id,
              totalCents: o.total_cents,
              customerName: o.profiles?.full_name || null,
              deliveryWindowStart: o.delivery_window_start,
              itemCount: o.order_items?.reduce(
                (sum: number, item: { quantity: number }) => sum + item.quantity,
                0
              ) || 0,
              status: o.status,
            }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!deliveryDate) {
      newErrors.deliveryDate = "Delivery date is required";
    } else {
      const date = new Date(deliveryDate + "T12:00:00");
      if (date.getDay() !== 6) {
        newErrors.deliveryDate = "Delivery date must be a Saturday";
      }
    }
    if (selectedOrderIds.length === 0) {
      newErrors.orderIds = "At least one order is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const data: CreateRouteData = {
        deliveryDate,
        orderIds: selectedOrderIds,
      };
      if (selectedDriverId) {
        data.driverId = selectedDriverId;
      }
      await onSubmit(data);
      setDeliveryDate(getDefaultDeliveryDate());
      setSelectedDriverId(null);
      setSelectedOrderIds([]);
      onOpenChange(false);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Failed to create route",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDeliveryDate(getDefaultDeliveryDate());
      setSelectedDriverId(null);
      setSelectedOrderIds([]);
      setErrors({});
      onOpenChange(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
    if (errors.orderIds) {
      setErrors((prev) => ({ ...prev, orderIds: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-surface-secondary to-surface-tertiary border-border-v5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-lg bg-gradient-to-br from-interactive-primary to-accent-tertiary text-text-inverse">
              <Route className="h-5 w-5" />
            </div>
            Create Delivery Route
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new route by selecting orders and optionally assigning a driver.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {errors.general && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </m.div>
          )}

          {/* Delivery Date */}
          <div className="space-y-2">
            <label
              htmlFor="deliveryDate"
              className="flex items-center gap-2 text-sm font-medium text-text-primary"
            >
              <Calendar className="h-4 w-4 text-interactive-primary" />
              Delivery Date <span className="text-status-error">*</span>
            </label>
            <Input
              id="deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                if (errors.deliveryDate) {
                  setErrors((prev) => ({ ...prev, deliveryDate: undefined }));
                }
              }}
              min={format(new Date(), "yyyy-MM-dd")}
              className={cn(
                "bg-surface-primary border-border-v5 focus:border-interactive-primary focus:ring-interactive-primary/20",
                errors.deliveryDate &&
                  "border-status-error focus:border-status-error focus:ring-status-error/20"
              )}
              disabled={isSubmitting}
            />
            {errors.deliveryDate && (
              <p className="text-xs text-red-500">{errors.deliveryDate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Deliveries only occur on Saturdays
            </p>
          </div>

          {/* Driver Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Users className="h-4 w-4 text-interactive-primary" />
              Assign Driver (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {loadingDrivers ? (
                <div className="col-span-full flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-interactive-primary" />
                </div>
              ) : drivers.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground py-2">
                  No active drivers available
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedDriverId(null)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      selectedDriverId === null
                        ? "border-interactive-primary bg-interactive-primary-light text-interactive-primary"
                        : "border-border-v5 bg-surface-primary hover:border-interactive-primary/50 text-text-secondary"
                    )}
                    disabled={isSubmitting}
                  >
                    <span className="text-xs font-medium">Unassigned</span>
                  </button>
                  {drivers.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                        selectedDriverId === driver.id
                          ? "border-interactive-primary bg-interactive-primary-light text-interactive-primary"
                          : "border-border-v5 bg-surface-primary hover:border-interactive-primary/50 text-text-primary"
                      )}
                      disabled={isSubmitting}
                    >
                      <div className="h-8 w-8 rounded-full bg-status-success-bg flex items-center justify-center text-status-success text-xs font-medium">
                        {driver.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "DR"}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full">
                        {driver.fullName || "Unnamed"}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Order Selection */}
          <OrderSelectionList
            orders={orders}
            selectedOrderIds={selectedOrderIds}
            loadingOrders={loadingOrders}
            isSubmitting={isSubmitting}
            error={errors.orderIds}
            onToggle={toggleOrderSelection}
            onSelectAll={() => {
              setSelectedOrderIds(orders.map((o) => o.id));
              if (errors.orderIds) setErrors((prev) => ({ ...prev, orderIds: undefined }));
            }}
            onDeselectAll={() => setSelectedOrderIds([])}
          />

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-border-v5 hover:bg-surface-tertiary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-interactive-primary to-accent-tertiary hover:opacity-90 text-text-inverse shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-4 w-4" />
                  Create Route
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
