/**
 * TrackingPageClient - Split-view tracking page
 *
 * Mobile (TRAK-01): full-height map + collapsible bottom sheet (Drawer).
 * Desktop: existing lg:grid-cols-2 split (map left, info right).
 * Map visible in all order states (pre-delivery, en route, delivered).
 * StatusStepper at top of info section, StatusTimeline below as detail.
 * Browser tab title updates with live status.
 * ReconnectingBanner (TRAK-02) auto-shows after 2s of disconnection.
 * MuteToggle (CFIX-10) silences audio notifications globally.
 * Audio gated by !isMuted && !document.hidden.
 * Delivered/Cancelled overlays, share button, nearby banner, status effects.
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Drawer } from "@/components/ui/Drawer";
import { StatusTimeline } from "./StatusTimeline";
import { StatusStepper } from "./StatusStepper";
import { ETACountdown } from "./ETACountdown";
import { LazyDeliveryMap } from "@/components/ui/maps/LazyMaps";
import { DriverCard } from "./DriverCard";
import { OrderSummary } from "./OrderSummary";
import { SupportActions } from "./SupportActions";
import { DeliveryNotesEditor } from "./DeliveryNotesEditor";
import { DeliveredScreen } from "./DeliveredScreen";
import { CancelledOverlay } from "./CancelledOverlay";
import { ShareButton } from "./ShareButton";
import { NearbyBanner } from "./NearbyBanner";
import { ReconnectingBanner } from "./ReconnectingBanner";
import { MuteToggle } from "./MuteToggle";
import {
  useTrackingSubscription,
  useShowLiveTracking,
  useLastUpdateDisplay,
} from "@/lib/hooks/useTrackingSubscription";
import { useMutePreference } from "@/lib/hooks/useMutePreference";
import { calculateETA, calculateRemainingStops } from "@/lib/utils/eta";
import type { TrackingData } from "@/types/tracking";
import type { OrderStatus } from "@/types/database";
import type { VehicleType } from "@/types/driver";

const STATUS_TITLES: Record<OrderStatus, string> = {
  pending_approval: "Awaiting Approval | Morning Star",
  pending: "Order Placed | Morning Star",
  confirmed: "Confirmed | Morning Star",
  preparing: "Preparing... | Morning Star",
  out_for_delivery: "Out for Delivery | Morning Star",
  delivered: "Delivered! | Morning Star",
  cancelled: "Cancelled | Morning Star",
};

interface TrackingPageClientProps {
  orderId: string;
  initialData: TrackingData;
}

export function TrackingPageClient({ orderId, initialData }: TrackingPageClientProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialData.order.status);
  const [routeStop, setRouteStop] = useState(initialData.routeStop);
  const [driverLocation, setDriverLocation] = useState(initialData.driverLocation);
  const [eta, setEta] = useState(initialData.eta);

  // CFIX-10: mute preference for audio notifications (global, persists across orders)
  const { isMuted, toggleMuted } = useMutePreference();

  // TRAK-01: bottom sheet open state for mobile collapsible info pane
  const [sheetOpen, setSheetOpen] = useState(false);

  // Track previous status for transition effects
  const prevStatusRef = useRef<OrderStatus>(orderStatus);

  // Delayed delivered screen appearance (500ms after status change)
  const [showDelivered, setShowDelivered] = useState(orderStatus === "delivered");

  // Browser tab title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = STATUS_TITLES[orderStatus] ?? originalTitle;
    return () => {
      document.title = originalTitle;
    };
  }, [orderStatus]);

  // Status transition effects: haptic + sound + delayed delivered screen
  useEffect(() => {
    if (prevStatusRef.current === orderStatus) return;
    prevStatusRef.current = orderStatus;

    // Haptic feedback on any status change (silent + physical — never gated)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // CFIX-10: brief audio cue gated by mute preference AND tab visibility
    if (!isMuted && typeof document !== "undefined" && !document.hidden) {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.2;
        void audio.play().catch(() => {
          // Sound file may not exist or autoplay policy rejected -- graceful failure
        });
      } catch {
        // Audio creation failed -- skip
      }
    }

    // Delayed delivered screen appearance
    if (orderStatus === "delivered") {
      const timer = setTimeout(() => setShowDelivered(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowDelivered(false);
    }
  }, [orderStatus, isMuted]);

  const subscription = useTrackingSubscription({
    orderId,
    routeId: initialData.routeId ?? undefined,
    enabled: true,
    onOrderUpdate: (status) => setOrderStatus(status),
    onStopUpdate: (stopData) => {
      if (stopData.status) {
        setRouteStop((prev) => (prev ? { ...prev, status: stopData.status! } : null));
      }
      if (stopData.eta) {
        setRouteStop((prev) => (prev ? { ...prev, eta: stopData.eta! } : null));
      }
    },
    onLocationUpdate: (location) => {
      setDriverLocation(location);
      if (initialData.order.address.lat && initialData.order.address.lng && routeStop) {
        const remainingStops = calculateRemainingStops(routeStop.currentStop, routeStop.stopIndex);
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

  const showLiveTracking = useShowLiveTracking(orderStatus, driverLocation);
  const lastUpdateDisplay = useLastUpdateDisplay(subscription.lastUpdate);

  const driverInfo = useMemo(() => {
    if (!initialData.driver) return null;
    return {
      fullName: initialData.driver.fullName,
      profileImageUrl: initialData.driver.profileImageUrl,
      phone: initialData.driver.phone,
      vehicleType: (initialData.driver as { vehicleType?: VehicleType }).vehicleType ?? null,
    };
  }, [initialData.driver]);

  const stopProgress = useMemo(() => {
    if (!routeStop) return null;
    return {
      currentStop: routeStop.currentStop,
      totalStops: routeStop.totalStops,
    };
  }, [routeStop]);

  const hasLocation = !!initialData.order.address.lat && !!initialData.order.address.lng;

  const isTerminalStatus = orderStatus === "delivered" || orderStatus === "cancelled";

  // === Reusable content blocks shared between mobile and desktop branches ===

  const mapContent = hasLocation ? (
    <LazyDeliveryMap
      customerLocation={{
        lat: initialData.order.address.lat!,
        lng: initialData.order.address.lng!,
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
      restaurantLocation={initialData.restaurantLocation}
      orderStatus={orderStatus}
      lastLocationUpdate={subscription.lastUpdate}
      isLive={subscription.isConnected}
      className="h-full rounded-none lg:rounded-none"
    />
  ) : null;

  const cancelledOverlayContent = (
    <AnimatePresence>
      {orderStatus === "cancelled" && (
        <CancelledOverlay
          cancellationReason={initialData.order.cancellationReason}
          orderId={orderId}
        />
      )}
    </AnimatePresence>
  );

  const infoPaneContent = (
    <div className="px-4 py-4 space-y-4">
      {/* Nearby Banner */}
      <NearbyBanner
        etaMinutes={eta?.minMinutes ?? null}
        isVisible={orderStatus === "out_for_delivery"}
      />

      {/* StatusStepper - horizontal progress */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatusStepper currentStatus={orderStatus} cancelledAt={initialData.order.cancelledAt} />
      </m.div>

      {/* ETA Countdown */}
      {showLiveTracking && eta && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ETACountdown
            minMinutes={eta.minMinutes}
            maxMinutes={eta.maxMinutes}
            estimatedArrival={eta.estimatedArrival}
            isNearby={eta.minMinutes <= 5}
          />
        </m.div>
      )}

      {/* Delivered Screen */}
      <AnimatePresence>
        {showDelivered && orderStatus === "delivered" && (
          <DeliveredScreen
            orderId={orderId}
            initialRating={initialData.rating}
            deliveryPhotoUrl={routeStop?.deliveryPhotoUrl}
          />
        )}
      </AnimatePresence>

      {/* Status Timeline (detailed vertical) */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatusTimeline
          currentStatus={orderStatus}
          placedAt={initialData.order.placedAt}
          confirmedAt={initialData.order.confirmedAt}
          deliveredAt={initialData.order.deliveredAt}
          isLive={showLiveTracking}
        />
      </m.div>

      {/* Driver Card */}
      {driverInfo && stopProgress && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DriverCard driver={driverInfo} stopProgress={stopProgress} />
        </m.div>
      )}

      {/* Delivery Notes Editor */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <DeliveryNotesEditor
          orderId={orderId}
          initialNotes={initialData.order.specialInstructions}
          isEditable={!isTerminalStatus}
        />
      </m.div>

      {/* Order Summary */}
      <m.div
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
      </m.div>

      {/* Support Actions */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SupportActions driverPhone={initialData.driver?.phone ?? null} orderStatus={orderStatus} />
      </m.div>
    </div>
  );

  return (
    <div className="orders-canvas min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface-elevated/80 sm:backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href={`/orders/${orderId}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Order</span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {subscription.isConnected ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-hero-sage" />
                  <span>Live</span>
                </>
              ) : subscription.connectionError ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                  <span>Reconnecting...</span>
                </>
              ) : (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-text-muted" />
                  <span>Connecting...</span>
                </>
              )}
              {lastUpdateDisplay && (
                <span className="text-text-muted font-medium">&bull; {lastUpdateDisplay}</span>
              )}
              <ShareButton orderId={orderId} orderStatus={orderStatus} />
              <MuteToggle isMuted={isMuted} onToggle={toggleMuted} />
              <button
                onClick={() => subscription.refresh()}
                className="p-1 hover:bg-surface-secondary rounded-full transition-colors"
                aria-label="Refresh tracking data"
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    subscription.isConnected ? "text-hero-sage" : "text-text-muted"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* TRAK-02: Reconnecting banner with 2s debounce */}
      <ReconnectingBanner isConnected={subscription.isConnected} />

      {/* MOBILE: full-height map + collapsible bottom sheet (TRAK-01) */}
      <div className="lg:hidden relative">
        {hasLocation && (
          <div className="h-[calc(100svh-3.5rem)] w-full relative">
            {mapContent}
            {cancelledOverlayContent}
          </div>
        )}

        {/* Peek bar: tap to open expanded sheet */}
        {!sheetOpen && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Expand tracking details"
            className="fixed bottom-0 inset-x-0 z-modal-backdrop h-[120px] bg-surface-elevated border-t border-border rounded-t-3xl shadow-lg text-left"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-border-default" aria-hidden="true" />
            </div>
            <div className="px-4 pb-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {driverInfo?.fullName ?? "Finding your driver..."}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {eta
                    ? `Arriving in ${eta.minMinutes}-${eta.maxMinutes} min`
                    : "Calculating ETA..."}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Expanded sheet: Drawer handles focus trap, body scroll lock, swipe-to-dismiss */}
        <Drawer
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          position="bottom"
          height="full"
          title="Tracking details"
          className="orders-canvas"
        >
          {infoPaneContent}
        </Drawer>
      </div>

      {/* DESKTOP: existing lg:grid-cols-2 layout UNCHANGED */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:h-[calc(100vh-3.5rem)]">
          {hasLocation && (
            <div className="lg:h-full relative">
              {mapContent}
              {cancelledOverlayContent}
            </div>
          )}
          <div className="lg:h-full overflow-y-auto pb-24">{infoPaneContent}</div>
        </div>
      </div>
    </div>
  );
}
