"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { toast } from "@/lib/hooks/useToastV8";
import { clusterOrders, estimateRouteDuration, getUnclusteredOrders } from "@/lib/utils/clustering";
import { RouteBuilderMap } from "@/components/ui/admin/routes/RouteBuilderMap";
import { UnassignedOrdersPanel } from "./UnassignedOrdersPanel";
import { DriverSelector } from "./DriverSelector";
import { RouteSummaryBar } from "./RouteSummaryBar";
import {
  getNextSaturday,
  hasTimeWindowConflict,
  transformApiOrder,
  type BuilderOrder,
} from "./helpers";
import type { DriverApiResponse } from "./DriverSelector";
import type { OrderCluster } from "@/lib/utils/clustering";
import type { MapStop } from "@/components/ui/admin/routes/RouteBuilderMap";

// ============================================
// SKELETON
// ============================================

function RouteBuilderSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="h-10 bg-surface-secondary rounded-xl w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-10 bg-surface-secondary rounded-xl" />
          <div className="h-64 bg-surface-secondary rounded-xl" />
          <div className="h-48 bg-surface-secondary rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-96 bg-surface-secondary rounded-xl" />
          <div className="h-24 bg-surface-secondary rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function RouteBuilderClient() {
  const router = useRouter();

  // Data state
  const [orders, setOrders] = useState<BuilderOrder[]>([]);
  const [drivers, setDrivers] = useState<DriverApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>(getNextSaturday());

  // Action state
  const [isCreating, setIsCreating] = useState(false);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersRes, driversRes] = await Promise.all([
        fetch("/api/admin/routes/builder-orders"),
        fetch("/api/admin/drivers"),
      ]);

      if (!ordersRes.ok || !driversRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [rawOrders, rawDrivers] = await Promise.all([ordersRes.json(), driversRes.json()]);

      setOrders((rawOrders as Record<string, unknown>[]).map((o) => transformApiOrder(o)));
      setDrivers(rawDrivers as DriverApiResponse[]);
    } catch {
      toast({ message: "Failed to load route builder data", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const clusters: OrderCluster[] = clusterOrders(orders);
  const unclusteredIds: string[] = getUnclusteredOrders(orders);

  const selectedOrders = orders.filter((o) => selectedOrderIds.has(o.id));
  const selectedStops = selectedOrders.filter(
    (o): o is BuilderOrder & { lat: number; lng: number } => o.lat !== null && o.lng !== null
  );

  const mapStops: MapStop[] = selectedStops.map((o) => {
    // Find cluster color for this order
    const cluster = clusters.find((c) => c.orderIds.includes(o.id));
    return {
      id: o.id,
      lat: o.lat,
      lng: o.lng,
      label: o.customerName ?? o.customerEmail,
      clusterColor: cluster?.color,
    };
  });

  const duration = estimateRouteDuration(selectedStops.map((o) => ({ lat: o.lat, lng: o.lng })));

  const timeWindowWarning = hasTimeWindowConflict(selectedOrders);

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) ?? null;
  const driverName = selectedDriver?.fullName ?? null;

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleToggleOrder = useCallback((id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectCluster = useCallback((cluster: OrderCluster) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      const allSelected = cluster.orderIds.every((id) => next.has(id));
      if (allSelected) {
        cluster.orderIds.forEach((id) => next.delete(id));
      } else {
        cluster.orderIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const handleCreateRoute = useCallback(async () => {
    if (selectedOrderIds.size === 0) {
      toast({ message: "Select at least one order", type: "error" });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryDate,
          driverId: selectedDriverId ?? undefined,
          orderIds: [...selectedOrderIds],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error((err as { error?: string }).error ?? "Failed to create route");
      }

      toast({ message: "Route created successfully", type: "success" });
      router.push("/admin/routes");
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to create route",
        type: "error",
      });
      setIsCreating(false);
    }
  }, [selectedOrderIds, deliveryDate, selectedDriverId, router]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <SkeletonCrossfade isLoading={isLoading} skeleton={<RouteBuilderSkeleton />}>
      <div className="p-4 md:p-8 space-y-6">
        {/* Page header */}
        <AdminPageHeader
          title="New Route"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Routes", href: "/admin/routes" },
            { label: "New Route" },
          ]}
        />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ---- LEFT COLUMN ---- */}
          <div className="space-y-6">
            {/* Date picker */}
            <div className="space-y-2">
              <label
                htmlFor="delivery-date"
                className="text-sm font-semibold text-text-primary flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-accent-teal" />
                Delivery Date
              </label>
              <input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-primary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal/50"
              />
            </div>

            {/* Unassigned orders panel */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-text-primary">Unassigned Orders</h2>
              <UnassignedOrdersPanel
                orders={orders}
                clusters={clusters}
                unclusteredIds={unclusteredIds}
                selectedIds={selectedOrderIds}
                onToggleOrder={handleToggleOrder}
                onSelectCluster={handleSelectCluster}
              />
            </div>

            {/* Driver selector */}
            <DriverSelector
              drivers={drivers}
              selectedDriverId={selectedDriverId}
              onSelect={setSelectedDriverId}
              deliveryDate={deliveryDate}
            />
          </div>

          {/* ---- RIGHT COLUMN ---- */}
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Map */}
            <div className="h-[480px] rounded-xl overflow-hidden border border-border">
              <RouteBuilderMap stops={mapStops} onStopClick={handleToggleOrder} />
            </div>

            {/* Route summary bar */}
            <RouteSummaryBar
              selectedCount={selectedOrderIds.size}
              duration={duration}
              driverName={driverName}
              timeWindowWarning={timeWindowWarning}
              isCreating={isCreating}
              onCreateRoute={handleCreateRoute}
            />
          </div>
        </div>
      </div>
    </SkeletonCrossfade>
  );
}
