"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, addDays, startOfDay } from "date-fns";
import {
  Loader2,
  Route,
  Calendar,
  Users,
  Package,
  AlertCircle,
  Check,
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

interface CreateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRouteData) => Promise<void>;
}

export interface CreateRouteData {
  deliveryDate: string;
  driverId?: string;
  orderIds: string[];
}

interface Driver {
  id: string;
  fullName: string | null;
  isActive: boolean;
}

interface Order {
  id: string;
  totalCents: number;
  customerName: string | null;
  deliveryWindowStart: string | null;
  itemCount: number;
  status: string;
}

interface FormErrors {
  deliveryDate?: string;
  orderIds?: string;
  general?: string;
}

export function CreateRouteModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateRouteModalProps) {
  const [deliveryDate, setDeliveryDate] = useState(
    format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd")
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch drivers on open
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

      // Reset form on success
      setDeliveryDate(format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"));
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
      setDeliveryDate(format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"));
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

  const selectAllOrders = () => {
    setSelectedOrderIds(orders.map((o) => o.id));
    if (errors.orderIds) {
      setErrors((prev) => ({ ...prev, orderIds: undefined }));
    }
  };

  const deselectAllOrders = () => {
    setSelectedOrderIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-cream to-lotus/20 border-curry/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-charcoal">
            <div className="p-2 rounded-lg bg-gradient-to-br from-saffron to-curry text-white">
              <Route className="h-5 w-5" />
            </div>
            Create Delivery Route
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new route by selecting orders and optionally assigning a
            driver.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* General Error */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </motion.div>
          )}

          {/* Delivery Date */}
          <div className="space-y-2">
            <label
              htmlFor="deliveryDate"
              className="flex items-center gap-2 text-sm font-medium text-charcoal"
            >
              <Calendar className="h-4 w-4 text-saffron" />
              Delivery Date <span className="text-red-500">*</span>
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
                "bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20",
                errors.deliveryDate &&
                  "border-red-400 focus:border-red-400 focus:ring-red-200"
              )}
              disabled={isSubmitting}
            />
            {errors.deliveryDate && (
              <p className="text-xs text-red-500">{errors.deliveryDate}</p>
            )}
          </div>

          {/* Driver Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <Users className="h-4 w-4 text-saffron" />
              Assign Driver (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {loadingDrivers ? (
                <div className="col-span-full flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-saffron" />
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
                        ? "border-saffron bg-saffron/10 text-saffron"
                        : "border-curry/10 bg-white hover:border-saffron/50 text-muted-foreground"
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
                          ? "border-saffron bg-saffron/10 text-saffron"
                          : "border-curry/10 bg-white hover:border-saffron/50 text-charcoal"
                      )}
                      disabled={isSubmitting}
                    >
                      <div className="h-8 w-8 rounded-full bg-jade/10 flex items-center justify-center text-jade text-xs font-medium">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
                <Package className="h-4 w-4 text-saffron" />
                Select Orders <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllOrders}
                  disabled={orders.length === 0 || isSubmitting}
                  className="text-xs h-7"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllOrders}
                  disabled={selectedOrderIds.length === 0 || isSubmitting}
                  className="text-xs h-7"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-curry/20 bg-white">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-saffron" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No confirmed orders available for routing
                </p>
              ) : (
                <div className="divide-y divide-curry/10">
                  {orders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => toggleOrderSelection(order.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 text-left transition-colors",
                          isSelected
                            ? "bg-saffron/10"
                            : "hover:bg-cream"
                        )}
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-saffron border-saffron"
                                : "border-curry/30"
                            )}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-charcoal">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.customerName || "Guest"} •{" "}
                              {order.itemCount} items
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-curry">
                          ${(order.totalCents / 100).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {errors.orderIds && (
              <p className="text-xs text-red-500">{errors.orderIds}</p>
            )}

            {selectedOrderIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedOrderIds.length} order(s) selected
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-curry/20 hover:bg-curry/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-saffron to-curry hover:from-saffron-dark hover:to-curry-dark text-white shadow-md"
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
