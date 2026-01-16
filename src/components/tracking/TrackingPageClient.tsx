/**
 * V2 Sprint 3: Tracking Page Client Component
 *
 * Main client component that orchestrates real-time tracking.
 * Combines all tracking components and handles Supabase Realtime subscriptions.
 */

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { StatusTimeline } from "./StatusTimeline";
import { ETADisplay } from "./ETADisplay";
import { DeliveryMap } from "./DeliveryMap";
import { DriverCard } from "./DriverCard";
import { OrderSummary } from "./OrderSummary";
import { SupportActions } from "./SupportActions";
import {
  useTrackingSubscription,
  useShowLiveTracking,
  useLastUpdateDisplay,
} from "@/lib/hooks/useTrackingSubscription";
import { calculateETA, calculateRemainingStops } from "@/lib/utils/eta";
import type { TrackingData } from "@/types/tracking";
import type { OrderStatus } from "@/types/database";
import type { VehicleType } from "@/types/driver";

interface TrackingPageClientProps {
  orderId: string;
  initialData: TrackingData;
}

export function TrackingPageClient({
  orderId,
  initialData,
}: TrackingPageClientProps) {
  // Local state merged with initial data
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    initialData.order.status
  );
  const [routeStop, setRouteStop] = useState(initialData.routeStop);
  const [driverLocation, setDriverLocation] = useState(
    initialData.driverLocation
  );
  const [eta, setEta] = useState(initialData.eta);

  // Setup realtime subscription
  // Note: routeId tracking for location updates is currently not implemented
  // TODO: Extract route_id from routeStop when available
  const subscription = useTrackingSubscription({
    orderId,
    routeId: undefined, // We need to track route_id separately
    enabled: true,
    onOrderUpdate: (status) => {
      setOrderStatus(status);
    },
    onStopUpdate: (stopData) => {
      if (stopData.status) {
        setRouteStop((prev) =>
          prev
            ? { ...prev, status: stopData.status! }
            : null
        );
      }
      if (stopData.eta) {
        setRouteStop((prev) =>
          prev ? { ...prev, eta: stopData.eta! } : null
        );
      }
    },
    onLocationUpdate: (location) => {
      setDriverLocation(location);
      // Recalculate ETA with new location
      if (
        initialData.order.address.lat &&
        initialData.order.address.lng &&
        routeStop
      ) {
        const remainingStops = calculateRemainingStops(
          routeStop.currentStop,
          routeStop.stopIndex
        );
        const newEta = calculateETA({
          driverLocation: { lat: location.latitude, lng: location.longitude },
          customerLocation: {
            lat: initialData.order.address.lat,
            lng: initialData.order.address.lng,
          },
          remainingStops,
        });
        setEta({
          minMinutes: newEta.minMinutes,
          maxMinutes: newEta.maxMinutes,
          estimatedArrival: newEta.estimatedArrival.toISOString(),
        });
      }
    },
  });

  // Determine if we should show live tracking
  const showLiveTracking = useShowLiveTracking(orderStatus, driverLocation);
  const lastUpdateDisplay = useLastUpdateDisplay(subscription.lastUpdate);

  // Memoize driver info for DriverCard
  const driverInfo = useMemo(() => {
    if (!initialData.driver) return null;
    return {
      fullName: initialData.driver.fullName,
      profileImageUrl: initialData.driver.profileImageUrl,
      phone: initialData.driver.phone,
      vehicleType: (initialData.driver as { vehicleType?: VehicleType }).vehicleType ?? null,
    };
  }, [initialData.driver]);

  // Memoize stop progress
  const stopProgress = useMemo(() => {
    if (!routeStop) return null;
    return {
      currentStop: routeStop.currentStop,
      totalStops: routeStop.totalStops,
    };
  }, [routeStop]);

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-charcoal-100">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href={`/orders/${orderId}`}
              className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Order</span>
            </Link>

            {/* Connection status */}
            <div className="flex items-center gap-2 text-xs text-charcoal-500">
              {subscription.isConnected ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-jade-500" />
                  <span>Live</span>
                </>
              ) : subscription.connectionError ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-saffron-500" />
                  <span>Reconnecting...</span>
                </>
              ) : (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-charcoal-300" />
                  <span>Connecting...</span>
                </>
              )}
              {lastUpdateDisplay && (
                <span className="text-charcoal-400">• {lastUpdateDisplay}</span>
              )}
              <button
                onClick={() => subscription.refresh()}
                className="p-1 hover:bg-charcoal-100 rounded-full transition-colors"
                aria-label="Refresh tracking data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatusTimeline
            currentStatus={orderStatus}
            placedAt={initialData.order.placedAt}
            confirmedAt={initialData.order.confirmedAt}
            deliveredAt={initialData.order.deliveredAt}
            isLive={showLiveTracking}
          />
        </motion.div>

        {/* ETA Display - Only when out for delivery */}
        {showLiveTracking && eta && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ETADisplay
              minMinutes={eta.minMinutes}
              maxMinutes={eta.maxMinutes}
              estimatedArrival={eta.estimatedArrival}
            />
          </motion.div>
        )}

        {/* Delivery Map - Only when out for delivery with location */}
        {showLiveTracking &&
          initialData.order.address.lat &&
          initialData.order.address.lng && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DeliveryMap
                customerLocation={{
                  lat: initialData.order.address.lat,
                  lng: initialData.order.address.lng,
                  address: `${initialData.order.address.line1}, ${initialData.order.address.city}`,
                }}
                driverLocation={
                  driverLocation
                    ? {
                        lat: driverLocation.latitude,
                        lng: driverLocation.longitude,
                        heading: driverLocation.heading,
                      }
                    : null
                }
                isLive={subscription.isConnected}
                className="h-[300px]"
              />
            </motion.div>
          )}

        {/* Driver Card - Only when driver is assigned */}
        {driverInfo && stopProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DriverCard driver={driverInfo} stopProgress={stopProgress} />
          </motion.div>
        )}

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <OrderSummary
            items={initialData.order.items}
            subtotalCents={initialData.order.subtotalCents}
            deliveryFeeCents={initialData.order.deliveryFeeCents}
            taxCents={initialData.order.taxCents}
            totalCents={initialData.order.totalCents}
            deliveryWindow={{
              start: initialData.order.deliveryWindowStart,
              end: initialData.order.deliveryWindowEnd,
            }}
            deliveryAddress={{
              line1: initialData.order.address.line1,
              city: initialData.order.address.city,
              state: initialData.order.address.state,
            }}
          />
        </motion.div>

        {/* Support Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SupportActions
            driverPhone={initialData.driver?.phone ?? null}
            orderStatus={orderStatus}
          />
        </motion.div>

        {/* Delivery Photo - Show when delivered */}
        {orderStatus === "delivered" && routeStop?.deliveryPhotoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl bg-white p-4 shadow-warm-sm"
          >
            <p className="text-sm font-medium text-charcoal-600 mb-3">
              Delivery Photo
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={routeStop.deliveryPhotoUrl}
              alt="Delivery confirmation"
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: 300 }}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
